-- ---------------------------------------------------------------------------
-- 0008 — Force delete a product, and edit a purchase's paperwork with a log.
--
-- Two admin-only escape hatches for mistakes that the ordinary screens cannot
-- undo:
--
--   1. force_delete_product() — erases a product AND everything it appears in.
--      delete_product() (migration 0006) stays exactly as it was and is still
--      what the ordinary Delete button calls; this is the deliberate, typed-
--      confirmation path for a product that should never have existed.
--
--   2. update_purchase_details() — corrects the supplier's paperwork on a
--      purchase already recorded, writing every change to purchase_edits.
--
-- Nothing here weakens the stock invariants: stock still moves solely through
-- create_purchase, create_sale, void_sale and create_purchase_return.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. What a product would take with it
--
-- Read-only, so the confirmation dialog can state the damage in figures before
-- anyone types the word. Cheap enough to call on opening a modal.
-- ---------------------------------------------------------------------------

create or replace function public.product_history_summary(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sale_items',       (select count(*) from public.sale_items where product_id = p_id),
    'purchase_items',   (select count(*) from public.purchase_items where product_id = p_id),
    'purchase_returns', (select count(*) from public.purchase_returns where product_id = p_id),
    'stock_movements',  (select count(*) from public.stock_movements where product_id = p_id),
    'stock_quantity',   (select stock_quantity from public.products where id = p_id)
  );
$$;

revoke all on function public.product_history_summary(uuid) from public;
grant execute on function public.product_history_summary(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. RPC: force_delete_product
--
-- This is destructive by design and by explicit instruction: the product and
-- every trace of it go. Consequences, stated plainly because they are not
-- reversible:
--
--   • Sales and purchases that contained the product lose those lines. Their
--     header totals are NOT rewritten, because silently changing the total on
--     an invoice that has already been printed and handed over is worse than a
--     document that no longer itemises to its total. A sale or purchase left
--     with no lines at all is removed outright — an empty invoice is not a
--     record of anything.
--   • The product's stock_movements rows go, so reports covering a past period
--     will no longer count it. The audit trail is complete for every product
--     that still exists, not for one that has been erased.
--   • Stock currently on hand simply vanishes; it is not sold or returned.
--
-- Ordinary removal is still delete_product(), which archives. Only reach for
-- this one for a product that was created in error.
-- ---------------------------------------------------------------------------

create or replace function public.force_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_erased jsonb;
  v_sale_ids uuid[];
  v_purchase_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Only administrators may manage products' using errcode = '42501';
  end if;

  -- Locked for the same reason a sale locks it: a concurrent sale or purchase
  -- must not be writing this product's stock while it is being taken apart.
  select * into v_product from public.products where id = p_id for update;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  v_erased := public.product_history_summary(p_id);

  -- Remember which documents this product touched before its lines are gone,
  -- so the emptied ones can be found afterwards.
  select array_agg(distinct sale_id) into v_sale_ids
  from public.sale_items where product_id = p_id;

  select array_agg(distinct purchase_id) into v_purchase_ids
  from public.purchase_items where product_id = p_id;

  delete from public.sale_items where product_id = p_id;
  delete from public.purchase_items where product_id = p_id;
  delete from public.purchase_returns where product_id = p_id;
  delete from public.stock_movements where product_id = p_id;

  -- An invoice with nothing on it is not worth keeping. Their remaining lines,
  -- if any, keep the totals they were printed with.
  delete from public.sales s
  where s.id = any(coalesce(v_sale_ids, '{}'::uuid[]))
    and not exists (select 1 from public.sale_items where sale_id = s.id);

  delete from public.purchases p
  where p.id = any(coalesce(v_purchase_ids, '{}'::uuid[]))
    and not exists (select 1 from public.purchase_items where purchase_id = p.id);

  delete from public.products where id = p_id;

  return v_erased || jsonb_build_object('name', v_product.name, 'sku', v_product.sku);
end;
$$;

revoke all on function public.force_delete_product(uuid) from public;
grant execute on function public.force_delete_product(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Purchase edit log
--
-- Append-only. One row per save, holding just the fields that actually changed
-- as [{ "field": ..., "from": ..., "to": ... }], so the modal's second tab can
-- show what was corrected without diffing anything itself.
--
-- No update or delete privilege is granted to anyone: a correction log that can
-- be corrected is not a log. Inserts happen only inside the RPC below.
-- ---------------------------------------------------------------------------

create table if not exists public.purchase_edits (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  changed_by uuid references public.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  changes jsonb not null default '[]'::jsonb
);

create index if not exists purchase_edits_purchase_id_idx
  on public.purchase_edits (purchase_id, changed_at desc);

alter table public.purchase_edits enable row level security;

drop policy if exists purchase_edits_select on public.purchase_edits;
create policy purchase_edits_select on public.purchase_edits
  for select to authenticated using (true);

grant select on public.purchase_edits to authenticated;
revoke insert, update, delete on public.purchase_edits from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4. RPC: update_purchase_details
--
-- The supplier's paperwork only: their invoice number, the delivery receipt
-- number, how it was paid, the terms snapshot, the date and the note.
--
-- Deliberately NOT editable: the supplier, the lines, quantities, unit costs
-- and both discounts. Those decide stock levels and the weighted-average cost
-- price, and neither can be honestly rewound once later purchases and sales
-- have moved on. A delivery recorded wrongly is corrected with a purchase
-- return, not by editing history.
-- ---------------------------------------------------------------------------

create or replace function public.update_purchase_details(
  p_id uuid,
  p_purchase_date date,
  p_invoice_number text default '',
  p_reference_no text default '',
  p_payment_method text default '',
  p_payment_terms text default '',
  p_note text default ''
)
returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.purchases;
  v_after public.purchases;
  v_invoice_number text := btrim(coalesce(p_invoice_number, ''));
  v_reference_no text := btrim(coalesce(p_reference_no, ''));
  v_payment_method text := btrim(lower(coalesce(p_payment_method, '')));
  v_payment_terms text := btrim(coalesce(p_payment_terms, ''));
  v_note text := btrim(coalesce(p_note, ''));
  v_changes jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may edit a purchase' using errcode = '42501';
  end if;

  select * into v_before from public.purchases where id = p_id for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  if p_purchase_date is null then
    raise exception 'A purchase date is required' using errcode = '22023';
  end if;

  -- Repeated from the CHECK constraint so a bad value reads as advice rather
  -- than as a constraint violation.
  if v_payment_method not in ('', 'cash', 'bank_transfer', 'cheque', 'gcash', 'credit') then
    raise exception 'Unknown payment method %', v_payment_method using errcode = '22023';
  end if;

  -- Same rule as create_purchase: unique per supplier, blanks exempt. Checked
  -- here for the message; the partial unique index still enforces it.
  if v_invoice_number <> '' and exists (
    select 1 from public.purchases
    where supplier_id = v_before.supplier_id
      and invoice_number = v_invoice_number
      and id <> p_id
  ) then
    raise exception 'Invoice % is already recorded for this supplier', v_invoice_number
      using errcode = '23505';
  end if;

  update public.purchases
  set purchase_date = p_purchase_date,
      invoice_number = v_invoice_number,
      reference_no = v_reference_no,
      payment_method = v_payment_method,
      payment_terms = v_payment_terms,
      note = v_note
  where id = p_id
  returning * into v_after;

  -- Only what actually moved. Saving the form without touching anything must
  -- not leave a row saying nothing changed.
  v_changes := (
    select coalesce(jsonb_agg(change), '[]'::jsonb)
    from (
      select jsonb_build_object('field', field, 'from', old_value, 'to', new_value) as change
      from (
        values
          ('purchase_date', v_before.purchase_date::text, v_after.purchase_date::text),
          ('invoice_number', v_before.invoice_number, v_after.invoice_number),
          ('reference_no', v_before.reference_no, v_after.reference_no),
          ('payment_method', v_before.payment_method, v_after.payment_method),
          ('payment_terms', v_before.payment_terms, v_after.payment_terms),
          ('note', v_before.note, v_after.note)
      ) as candidates (field, old_value, new_value)
      where old_value is distinct from new_value
    ) as changed
  );

  if jsonb_array_length(v_changes) > 0 then
    insert into public.purchase_edits (purchase_id, changed_by, changes)
    values (p_id, app.user_id(), v_changes);
  end if;

  return v_after;
end;
$$;

revoke all on function public.update_purchase_details(
  uuid, date, text, text, text, text, text
) from public;

grant execute on function public.update_purchase_details(
  uuid, date, text, text, text, text, text
) to authenticated;
