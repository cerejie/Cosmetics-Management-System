-- Purchasing: suppliers, purchases and purchase returns.
--
-- Deliberately small. A purchase records who we bought from, when, and what
-- arrived; saving it puts the goods straight into inventory. There is no draft
-- state, no approval step and no partial receiving — the person entering it is
-- holding the delivery note.
--
-- Stock moves in exactly three ways after this migration:
--
--   in   create_purchase()          goods arrived from a supplier
--   out  create_sale()              a sale
--   out  create_purchase_return()   goods sent back to a supplier
--
-- save_product() no longer writes stock_quantity and adjust_stock() is revoked
-- from clients, so the product screen is a catalogue only. Every movement still
-- lands in stock_movements, so the audit trail stays complete.

-- ---------------------------------------------------------------------------
-- 1. Enums
--
-- ALTER TYPE ... ADD VALUE cannot have its new label used elsewhere in the same
-- transaction. Function bodies are stored as text and only resolved at call
-- time, so the RPCs below are fine; nothing here uses the label in DDL.
-- ---------------------------------------------------------------------------

alter type public.stock_movement_type add value if not exists 'purchase_return';

-- ---------------------------------------------------------------------------
-- 2. Suppliers
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_person text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Purchases
-- ---------------------------------------------------------------------------

create sequence if not exists public.purchase_reference_seq;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- restrict: a supplier with purchase history cannot be deleted out from
  -- under it. The Suppliers screen surfaces that as a friendly message.
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  purchase_date date not null default current_date,
  total numeric(12, 2) not null default 0 check (total >= 0),
  note text not null default '',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists purchases_supplier_id_idx on public.purchases (supplier_id);
create index if not exists purchases_purchase_date_idx on public.purchases (purchase_date desc);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  -- Snapshots, so an old purchase still reads correctly after product edits.
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0)
);

create index if not exists purchase_items_purchase_id_idx on public.purchase_items (purchase_id);
create index if not exists purchase_items_product_id_idx on public.purchase_items (product_id);

-- ---------------------------------------------------------------------------
-- 4. Purchase returns
--
-- Standalone: a return names a supplier and a product, not a past order. In a
-- small shop the goods going back are rarely traced to one delivery note.
-- ---------------------------------------------------------------------------

create sequence if not exists public.purchase_return_reference_seq;

create table if not exists public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  sku text not null,
  return_date date not null default current_date,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  reason text not null default '',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists purchase_returns_supplier_id_idx on public.purchase_returns (supplier_id);
create index if not exists purchase_returns_return_date_idx on public.purchase_returns (return_date desc);

-- ---------------------------------------------------------------------------
-- 5. RPC: create_purchase — the ONLY way stock increases.
--
-- Items arrive as jsonb:
--   [{ "product_id": uuid, "quantity": int, "unit_cost": numeric }, ...]
--
-- Locks each product row, adds the quantity, recalculates the weighted average
-- cost, and writes one 'purchase' stock movement per line. Line maths is done
-- here so the stored total always matches the stored lines.
-- ---------------------------------------------------------------------------

create or replace function public.create_purchase(
  p_supplier_id uuid,
  p_items jsonb,
  p_purchase_date date default current_date,
  p_note text default ''
)
returns public.purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_unit_cost numeric(12, 2);
  v_line_total numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_average_cost numeric(12, 2);
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

  insert into public.purchases (reference, supplier_id, purchase_date, note, created_by)
  values (
    'PO-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.purchase_reference_seq')::text, 4, '0'),
    p_supplier_id, p_purchase_date, btrim(coalesce(p_note, '')), v_actor
  )
  returning * into v_purchase;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := coalesce((v_item ->> 'unit_cost')::numeric, 0);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero' using errcode = '22023';
    end if;

    if v_unit_cost < 0 then
      raise exception 'Unit cost cannot be negative' using errcode = '22023';
    end if;

    -- Row lock: concurrent purchases and sales must not clobber each other.
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product % not found', v_item ->> 'product_id' using errcode = 'P0002';
    end if;

    v_line_total := round(v_unit_cost * v_quantity, 2);
    v_total := v_total + v_line_total;

    -- Weighted average across what was already on hand and what just arrived.
    -- Falls back to the incoming cost when there was nothing on hand.
    v_average_cost := case
      when v_product.stock_quantity <= 0 then v_unit_cost
      else round(
        (v_product.cost_price * v_product.stock_quantity + v_line_total)
        / (v_product.stock_quantity + v_quantity), 2)
    end;

    insert into public.purchase_items
      (purchase_id, product_id, product_name, sku, quantity, unit_cost, line_total)
    values
      (v_purchase.id, v_product.id, v_product.name, v_product.sku,
       v_quantity, v_unit_cost, v_line_total);

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

  update public.purchases
  set total = v_total
  where id = v_purchase.id
  returning * into v_purchase;

  return v_purchase;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: create_purchase_return — one product going back to a supplier.
--
-- The cost is read from the product, never from the client.
-- ---------------------------------------------------------------------------

create or replace function public.create_purchase_return(
  p_supplier_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_reason text default '',
  p_return_date date default current_date
)
returns public.purchase_returns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.purchase_returns;
  v_product public.products;
  v_actor uuid := app.user_id();
begin
  if not public.is_admin() then
    raise exception 'Only administrators may record a return' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero' using errcode = '22023';
  end if;

  if not exists (select 1 from public.suppliers where id = p_supplier_id) then
    raise exception 'Select a supplier' using errcode = '22023';
  end if;

  select * into v_product from public.products where id = p_product_id for update;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_product.stock_quantity < p_quantity then
    raise exception 'Not enough stock for % (on hand %, returning %)',
      v_product.name, v_product.stock_quantity, p_quantity
      using errcode = '23514';
  end if;

  insert into public.purchase_returns
    (reference, supplier_id, product_id, product_name, sku, return_date,
     quantity, unit_cost, total_amount, reason, created_by)
  values (
    'RET-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.purchase_return_reference_seq')::text, 4, '0'),
    p_supplier_id, v_product.id, v_product.name, v_product.sku, p_return_date,
    p_quantity, v_product.cost_price, round(v_product.cost_price * p_quantity, 2),
    btrim(coalesce(p_reason, '')), v_actor
  )
  returning * into v_return;

  update public.products
  set stock_quantity = stock_quantity - p_quantity
  where id = v_product.id
  returning * into v_product;

  insert into public.stock_movements
    (product_id, type, quantity, quantity_after, reason, reference_id, created_by)
  values
    (v_product.id, 'purchase_return', -p_quantity, v_product.stock_quantity,
     'Return ' || v_return.reference, v_return.id, v_actor);

  return v_return;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. save_product without stock
--
-- Products are catalogue entries. New ones are created from the purchase screen
-- (so a delivery can include something not yet on file) and start at zero; the
-- purchase that created them is what puts stock on the shelf. The old
-- eleven-argument signature is dropped so a stale client cannot keep calling it.
-- ---------------------------------------------------------------------------

drop function if exists public.save_product(
  text, text, text, uuid, numeric, numeric, integer, integer, boolean, uuid, text
);

create or replace function public.save_product(
  p_sku text,
  p_name text,
  p_brand text,
  p_category_id uuid,
  p_cost_price numeric,
  p_unit_price numeric,
  p_reorder_level integer,
  p_is_active boolean,
  p_id uuid default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may manage products' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.products
      (sku, name, brand, category_id, cost_price, unit_price,
       stock_quantity, reorder_level, is_active)
    values
      (upper(btrim(p_sku)), btrim(p_name), btrim(p_brand), p_category_id,
       p_cost_price, p_unit_price, 0, p_reorder_level, p_is_active)
    returning * into v_product;

    return v_product;
  end if;

  update public.products
  set sku = upper(btrim(p_sku)),
      name = btrim(p_name),
      brand = btrim(p_brand),
      category_id = p_category_id,
      cost_price = p_cost_price,
      unit_price = p_unit_price,
      reorder_level = p_reorder_level,
      is_active = p_is_active
  where id = p_id
  returning * into v_product;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  return v_product;
end;
$$;

-- adjust_stock is kept for break/fix work by the project owner but is no longer
-- reachable from the app: manual stock entry is exactly what this module
-- replaces. Re-grant it only if a genuine stock-take feature is added.
revoke execute on function public.adjust_stock(
  uuid, integer, public.stock_movement_type, text
) from authenticated;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
--
-- Reads are open to any authenticated user. Purchases and returns are written
-- only by the RPCs above, which recompute totals and move stock; suppliers are
-- a plain admin-managed reference table in the same shape as categories.
-- ---------------------------------------------------------------------------

alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.purchase_returns enable row level security;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers
  for select to authenticated using (true);

drop policy if exists suppliers_write on public.suppliers;
create policy suppliers_write on public.suppliers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists purchases_select on public.purchases;
create policy purchases_select on public.purchases
  for select to authenticated using (true);

drop policy if exists purchase_items_select on public.purchase_items;
create policy purchase_items_select on public.purchase_items
  for select to authenticated using (true);

drop policy if exists purchase_returns_select on public.purchase_returns;
create policy purchase_returns_select on public.purchase_returns
  for select to authenticated using (true);

-- Totals and stock movements are derived inside the RPCs, so direct writes must
-- stay closed even for admins.
revoke insert, update, delete on public.purchases from authenticated, anon;
revoke insert, update, delete on public.purchase_items from authenticated, anon;
revoke insert, update, delete on public.purchase_returns from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.suppliers to authenticated;
grant select on public.purchases to authenticated;
grant select on public.purchase_items to authenticated;
grant select on public.purchase_returns to authenticated;

revoke all on function public.create_purchase(uuid, jsonb, date, text) from public;
revoke all on function public.create_purchase_return(uuid, uuid, integer, text, date) from public;
revoke all on function public.save_product(
  text, text, text, uuid, numeric, numeric, integer, boolean, uuid
) from public;

grant execute on function public.create_purchase(uuid, jsonb, date, text) to authenticated;
grant execute on function public.create_purchase_return(uuid, uuid, integer, text, date)
  to authenticated;
grant execute on function public.save_product(
  text, text, text, uuid, numeric, numeric, integer, boolean, uuid
) to authenticated;
