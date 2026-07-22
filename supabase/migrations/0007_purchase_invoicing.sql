-- ---------------------------------------------------------------------------
-- 0007 — Purchase invoicing: supplier document references, payment details and
--        discounts.
--
-- The New Purchase screen used to be supplier + date + lines. A purchase
-- invoice from a supplier carries more than that: their invoice number, a
-- delivery receipt number, how it is being paid, and — often — a discount,
-- either negotiated on a line or taken off the whole order.
--
-- Deliberately NOT added: tax. Costs are recorded as the supplier bills them.
-- Nothing here changes the invariant that stock moves only through the RPCs.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Purchase header
--
-- Every new column has a default, so existing rows stay valid and history that
-- predates this migration simply has blanks where the document numbers go.
--
-- `payment_terms` is a snapshot copied from the supplier at save time, for the
-- same reason a sale snapshots the customer's name: correcting a supplier's
-- standing terms must not rewrite an invoice that is already printed.
-- ---------------------------------------------------------------------------

alter table public.purchases
  add column if not exists invoice_number text not null default '',
  add column if not exists reference_no text not null default '',
  add column if not exists payment_method text not null default '',
  add column if not exists payment_terms text not null default '',
  add column if not exists subtotal numeric(12, 2) not null default 0
    check (subtotal >= 0),
  add column if not exists discount_type text not null default 'amount',
  add column if not exists discount_value numeric(12, 2) not null default 0
    check (discount_value >= 0),
  add column if not exists discount_amount numeric(12, 2) not null default 0
    check (discount_amount >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'purchases_discount_type_check'
  ) then
    alter table public.purchases
      add constraint purchases_discount_type_check
      check (discount_type in ('amount', 'percent'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'purchases_payment_method_check'
  ) then
    alter table public.purchases
      add constraint purchases_payment_method_check
      check (payment_method in ('', 'cash', 'bank_transfer', 'cheque', 'gcash', 'credit'));
  end if;
end;
$$;

-- Existing purchases were never discounted, so their subtotal is their total.
update public.purchases set subtotal = total where subtotal = 0 and total > 0;

-- A supplier invoice number is theirs, not ours: two different suppliers may
-- legitimately both issue "INV-001", so it is unique per supplier and only when
-- one was actually typed.
create unique index if not exists purchases_supplier_invoice_number_idx
  on public.purchases (supplier_id, invoice_number)
  where invoice_number <> '';

-- ---------------------------------------------------------------------------
-- 2. Purchase lines
--
-- `line_total` keeps its meaning of "what this line costs", now net of the
-- line's own discount, so sum(line_total) is still the purchase subtotal.
-- ---------------------------------------------------------------------------

alter table public.purchase_items
  add column if not exists discount_type text not null default 'amount',
  add column if not exists discount_value numeric(12, 2) not null default 0
    check (discount_value >= 0),
  add column if not exists discount_amount numeric(12, 2) not null default 0
    check (discount_amount >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'purchase_items_discount_type_check'
  ) then
    alter table public.purchase_items
      add constraint purchase_items_discount_type_check
      check (discount_type in ('amount', 'percent'));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Discount arithmetic, in one place
--
-- Used for both the line discount and the order discount so the two can never
-- drift apart. Clamped to the value being discounted, which is what keeps
-- `total >= 0` true without a separate guard.
-- ---------------------------------------------------------------------------

create or replace function public.purchase_discount_amount(
  p_base numeric,
  p_type text,
  p_value numeric
)
returns numeric
language sql
immutable
as $$
  select least(
    greatest(
      case
        when p_type = 'percent'
          then round(p_base * least(greatest(coalesce(p_value, 0), 0), 100) / 100, 2)
        else round(greatest(coalesce(p_value, 0), 0), 2)
      end,
      0
    ),
    greatest(coalesce(p_base, 0), 0)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RPC: create_purchase
--
-- The old four-argument signature is dropped so a stale client cannot keep
-- calling it and silently save a purchase with no document details.
--
-- Items arrive as jsonb:
--   [{ "product_id": uuid, "quantity": int, "unit_cost": numeric,
--      "discount_type": "amount"|"percent", "discount_value": numeric }, ...]
--
-- The client still sends no money it worked out itself: every discount is
-- recomputed here from the type and the value, and both totals are derived.
--
-- Two passes. The first prices the lines and gets the subtotal, which the
-- order-level discount needs before any stock can be touched; the second locks
-- each product and moves the goods.
-- ---------------------------------------------------------------------------

drop function if exists public.create_purchase(uuid, jsonb, date, text);

create or replace function public.create_purchase(
  p_supplier_id uuid,
  p_items jsonb,
  p_purchase_date date default current_date,
  p_note text default '',
  p_invoice_number text default '',
  p_reference_no text default '',
  p_payment_method text default '',
  p_payment_terms text default '',
  p_discount_type text default 'amount',
  p_discount_value numeric default 0
)
returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases;
  v_item jsonb;
  v_priced jsonb := '[]'::jsonb;
  v_product public.products;
  v_quantity integer;
  v_unit_cost numeric(12, 2);
  v_gross numeric(12, 2);
  v_line_discount_type text;
  v_line_discount_value numeric(12, 2);
  v_line_discount numeric(12, 2);
  v_line_total numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_discount_type text := coalesce(nullif(btrim(p_discount_type), ''), 'amount');
  v_discount_value numeric(12, 2) := round(coalesce(p_discount_value, 0), 2);
  v_discount_amount numeric(12, 2);
  v_total numeric(12, 2);
  v_cost_factor numeric;
  v_costed_total numeric(12, 2);
  v_average_cost numeric(12, 2);
  v_invoice_number text := btrim(coalesce(p_invoice_number, ''));
  v_payment_method text := btrim(lower(coalesce(p_payment_method, '')));
  v_actor uuid := app.user_id();
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record a purchase' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one product to this purchase' using errcode = '22023';
  end if;

  if not exists (select 1 from public.suppliers where id = p_supplier_id) then
    raise exception 'Select a supplier' using errcode = '22023';
  end if;

  if v_discount_type not in ('amount', 'percent') then
    raise exception 'Unknown discount type %', v_discount_type using errcode = '22023';
  end if;

  if v_discount_value < 0 then
    raise exception 'Discount cannot be negative' using errcode = '22023';
  end if;

  if v_discount_type = 'percent' and v_discount_value > 100 then
    raise exception 'A percentage discount cannot exceed 100%%' using errcode = '22023';
  end if;

  -- Checked here as well as by the unique index, so recording the same supplier
  -- invoice twice reads as advice rather than as a constraint violation. The
  -- index is still what guarantees it under concurrency.
  if v_invoice_number <> '' and exists (
    select 1 from public.purchases
    where supplier_id = p_supplier_id and invoice_number = v_invoice_number
  ) then
    raise exception 'Invoice % is already recorded for this supplier', v_invoice_number
      using errcode = '23505';
  end if;

  -- Pass 1: price every line, so the subtotal exists before the order-level
  -- discount is applied. Nothing is written and no rows are locked yet.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := round(coalesce((v_item ->> 'unit_cost')::numeric, 0), 2);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero' using errcode = '22023';
    end if;

    if v_unit_cost < 0 then
      raise exception 'Unit cost cannot be negative' using errcode = '22023';
    end if;

    v_line_discount_type :=
      coalesce(nullif(btrim(v_item ->> 'discount_type'), ''), 'amount');
    v_line_discount_value := round(coalesce((v_item ->> 'discount_value')::numeric, 0), 2);

    -- An unrecognised type would otherwise be read as a peso amount, quietly
    -- turning "5%" into "₱5 off".
    if v_line_discount_type not in ('amount', 'percent') then
      raise exception 'Unknown discount type %', v_line_discount_type using errcode = '22023';
    end if;

    if v_line_discount_value < 0 then
      raise exception 'Discount cannot be negative' using errcode = '22023';
    end if;

    if v_line_discount_type = 'percent' and v_line_discount_value > 100 then
      raise exception 'A percentage discount cannot exceed 100%%' using errcode = '22023';
    end if;

    v_gross := round(v_unit_cost * v_quantity, 2);
    v_line_discount := public.purchase_discount_amount(
      v_gross, v_line_discount_type, v_line_discount_value
    );
    v_line_total := v_gross - v_line_discount;
    v_subtotal := v_subtotal + v_line_total;

    v_priced := v_priced || jsonb_build_object(
      'product_id', v_item ->> 'product_id',
      'quantity', v_quantity,
      'unit_cost', v_unit_cost,
      'discount_type', v_line_discount_type,
      'discount_value', v_line_discount_value,
      'discount_amount', v_line_discount,
      'line_total', v_line_total
    );
  end loop;

  v_discount_amount := public.purchase_discount_amount(
    v_subtotal, v_discount_type, v_discount_value
  );
  v_total := v_subtotal - v_discount_amount;

  -- An order-level discount is money off the goods, so it belongs in what they
  -- cost. It is spread across the lines in proportion to their value purely to
  -- keep the weighted average honest; the stored line totals stay gross of it,
  -- because that is what the supplier's invoice shows.
  v_cost_factor := case when v_subtotal > 0 then v_total / v_subtotal else 1 end;

  insert into public.purchases (
    reference, supplier_id, purchase_date, note, created_by,
    invoice_number, reference_no, payment_method, payment_terms,
    subtotal, discount_type, discount_value, discount_amount, total
  )
  values (
    'PO-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.purchase_reference_seq')::text, 4, '0'),
    p_supplier_id, p_purchase_date, btrim(coalesce(p_note, '')), v_actor,
    v_invoice_number, btrim(coalesce(p_reference_no, '')),
    v_payment_method, btrim(coalesce(p_payment_terms, '')),
    v_subtotal, v_discount_type, v_discount_value, v_discount_amount, v_total
  )
  returning * into v_purchase;

  -- Pass 2: lock each product, write the line, move the stock.
  for v_item in select * from jsonb_array_elements(v_priced)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := (v_item ->> 'unit_cost')::numeric;
    v_line_total := (v_item ->> 'line_total')::numeric;

    -- Row lock: concurrent purchases and sales must not clobber each other.
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product % not found', v_item ->> 'product_id' using errcode = 'P0002';
    end if;

    v_costed_total := round(v_line_total * v_cost_factor, 2);

    -- Weighted average across what was already on hand and what just arrived.
    -- Falls back to the incoming cost when there was nothing on hand.
    v_average_cost := case
      when v_product.stock_quantity <= 0 then round(v_costed_total / v_quantity, 2)
      else round(
        (v_product.cost_price * v_product.stock_quantity + v_costed_total)
        / (v_product.stock_quantity + v_quantity), 2)
    end;

    insert into public.purchase_items (
      purchase_id, product_id, product_name, sku, quantity, unit_cost,
      discount_type, discount_value, discount_amount, line_total
    )
    values (
      v_purchase.id, v_product.id, v_product.name, v_product.sku,
      v_quantity, v_unit_cost,
      v_item ->> 'discount_type',
      (v_item ->> 'discount_value')::numeric,
      (v_item ->> 'discount_amount')::numeric,
      v_line_total
    );

    update public.products
    set stock_quantity = stock_quantity + v_quantity,
        cost_price = v_average_cost
    where id = v_product.id
    returning * into v_product;

    insert into public.stock_movements
      (product_id, type, quantity, quantity_after, reason, reference_id, created_by)
    values
      (v_product.id, 'purchase', v_quantity, v_product.stock_quantity,
       'Purchase ' || v_purchase.reference, v_purchase.id, v_actor);
  end loop;

  return v_purchase;
end;
$$;

revoke all on function public.create_purchase(
  uuid, jsonb, date, text, text, text, text, text, text, numeric
) from public;

grant execute on function public.create_purchase(
  uuid, jsonb, date, text, text, text, text, text, text, numeric
) to authenticated;
