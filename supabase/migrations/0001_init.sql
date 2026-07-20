-- Cosmetics Management System — initial schema
-- Modules: auth (profiles), inventory (categories, products, stock_movements), sales (sales, sale_items)

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'staff');
create type public.stock_movement_type as enum ('purchase', 'adjustment', 'sale', 'sale_reversal');
create type public.sale_status as enum ('completed', 'voided');
create type public.payment_method as enum ('cash', 'card', 'gcash', 'bank_transfer');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth: profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Role lookup used by RLS policies. SECURITY DEFINER so policies can read
-- profiles without recursing through profiles' own RLS.
-- Named current_app_role to avoid colliding with the built-in current_role.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

-- Every new auth user gets a profile.
-- The role is deliberately NOT read from raw_user_meta_data: that field is
-- attacker-controlled during sign-up, so honouring it would let anyone grant
-- themselves admin. New users are always staff; promote them explicitly with
--   update public.profiles set role = 'admin' where id = '<user-id>';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'staff');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Inventory: categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventory: products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  brand text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventory: stock movements (append-only audit trail)
-- ---------------------------------------------------------------------------

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type public.stock_movement_type not null,
  -- Signed: positive adds stock, negative removes it.
  quantity integer not null check (quantity <> 0),
  quantity_after integer not null,
  reason text not null default '',
  reference_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_product_id_idx on public.stock_movements (product_id, created_at desc);
create index stock_movements_reference_id_idx on public.stock_movements (reference_id);

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------

create sequence public.sale_reference_seq;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null default '',
  status public.sale_status not null default 'completed',
  payment_method public.payment_method not null default 'cash',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  note text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles (id) on delete set null
);

create index sales_created_at_idx on public.sales (created_at desc);
create index sales_status_idx on public.sales (status);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  -- Snapshots: a sale record must survive later product edits.
  product_name text not null,
  sku text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

-- ---------------------------------------------------------------------------
-- RPC: set_user_role — the only path for changing a role or activating a user.
-- ---------------------------------------------------------------------------

create or replace function public.set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_is_active boolean default true
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may change roles' using errcode = '42501';
  end if;

  -- Prevents an admin from locking themselves (and possibly everyone) out.
  if p_user_id = auth.uid() and (p_role <> 'admin' or not p_is_active) then
    raise exception 'You cannot remove your own admin access' using errcode = '22023';
  end if;

  update public.profiles
  set role = p_role, is_active = p_is_active
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: adjust_stock
-- Single atomic entry point for manual stock changes.
-- ---------------------------------------------------------------------------

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_quantity integer,
  p_type public.stock_movement_type default 'adjustment',
  p_reason text default ''
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  -- Inventory is admin-managed; staff move stock only by making sales.
  if not public.is_admin() then
    raise exception 'Only administrators may adjust stock' using errcode = '42501';
  end if;

  if p_quantity = 0 then
    raise exception 'Quantity must not be zero' using errcode = '22023';
  end if;

  if p_type not in ('purchase', 'adjustment') then
    raise exception 'Only purchase or adjustment movements may be recorded manually'
      using errcode = '22023';
  end if;

  -- Row lock prevents concurrent adjustments from clobbering each other.
  select * into v_product from public.products where id = p_product_id for update;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_product.stock_quantity + p_quantity < 0 then
    raise exception 'Insufficient stock for % (on hand %, requested %)',
      v_product.name, v_product.stock_quantity, abs(p_quantity)
      using errcode = '23514';
  end if;

  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = p_product_id
  returning * into v_product;

  insert into public.stock_movements (product_id, type, quantity, quantity_after, reason, created_by)
  values (p_product_id, p_type, p_quantity, v_product.stock_quantity, p_reason, auth.uid());

  return v_product;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create_sale
-- Creates the sale, its items, and decrements stock in one transaction.
-- Items arrive as jsonb: [{ "product_id": uuid, "quantity": int }, ...]
-- Prices are read from the DB, never trusted from the client.
-- ---------------------------------------------------------------------------

create or replace function public.create_sale(
  p_items jsonb,
  p_customer_name text default '',
  p_payment_method public.payment_method default 'cash',
  p_discount_amount numeric default 0,
  p_note text default ''
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_line_total numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_reference text;
begin
  -- SECURITY DEFINER bypasses RLS, so re-assert the caller is an active user.
  if public.current_app_role() is null then
    raise exception 'Your account is not active' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale requires at least one item' using errcode = '22023';
  end if;

  if p_discount_amount < 0 then
    raise exception 'Discount cannot be negative' using errcode = '22023';
  end if;

  v_reference := 'SO-' || lpad(nextval('public.sale_reference_seq')::text, 6, '0');

  insert into public.sales (reference, customer_name, payment_method, discount_amount, note, created_by)
  values (v_reference, coalesce(p_customer_name, ''), p_payment_method, p_discount_amount,
          coalesce(p_note, ''), auth.uid())
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Item quantity must be greater than zero' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product % not found', v_item ->> 'product_id' using errcode = 'P0002';
    end if;

    if not v_product.is_active then
      raise exception 'Product % is inactive and cannot be sold', v_product.name
        using errcode = '22023';
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock for % (on hand %, requested %)',
        v_product.name, v_product.stock_quantity, v_quantity
        using errcode = '23514';
    end if;

    v_line_total := round(v_product.unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;

    insert into public.sale_items
      (sale_id, product_id, product_name, sku, unit_price, quantity, line_total)
    values
      (v_sale.id, v_product.id, v_product.name, v_product.sku, v_product.unit_price,
       v_quantity, v_line_total);

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product.id
    returning * into v_product;

    insert into public.stock_movements
      (product_id, type, quantity, quantity_after, reason, reference_id, created_by)
    values
      (v_product.id, 'sale', -v_quantity, v_product.stock_quantity,
       'Sale ' || v_reference, v_sale.id, auth.uid());
  end loop;

  if p_discount_amount > v_subtotal then
    raise exception 'Discount (%) cannot exceed subtotal (%)', p_discount_amount, v_subtotal
      using errcode = '22023';
  end if;

  update public.sales
  set subtotal = v_subtotal,
      total = v_subtotal - p_discount_amount
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: void_sale — reverses a sale and restores stock. Admin only.
-- ---------------------------------------------------------------------------

create or replace function public.void_sale(p_sale_id uuid, p_reason text default '')
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_item public.sale_items;
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may void a sale' using errcode = '42501';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;

  if not found then
    raise exception 'Sale not found' using errcode = 'P0002';
  end if;

  if v_sale.status = 'voided' then
    raise exception 'Sale % is already voided', v_sale.reference using errcode = '22023';
  end if;

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.product_id
    returning stock_quantity into v_stock;

    insert into public.stock_movements
      (product_id, type, quantity, quantity_after, reason, reference_id, created_by)
    values
      (v_item.product_id, 'sale_reversal', v_item.quantity, v_stock,
       'Void ' || v_sale.reference || case when p_reason = '' then '' else ': ' || p_reason end,
       v_sale.id, auth.uid());
  end loop;

  update public.sales
  set status = 'voided', voided_at = now(), voided_by = auth.uid()
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- profiles: everyone reads, users may edit only their own row.
create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- RLS cannot restrict *which columns* a row update touches, so without this a
-- user could set their own role to 'admin'. Column grants close that: the only
-- self-service field is full_name; role and is_active move through set_user_role.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- categories & products: all authenticated read, admin writes.
create policy categories_select on public.categories
  for select to authenticated using (true);
create policy categories_write on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_select on public.products
  for select to authenticated using (true);
create policy products_write on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- stock_movements: read-only from the client; writes go through RPCs.
create policy stock_movements_select on public.stock_movements
  for select to authenticated using (true);

-- sales: all authenticated read. Inserts/updates go through RPCs only.
create policy sales_select on public.sales
  for select to authenticated using (true);

create policy sale_items_select on public.sale_items
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Function grants
-- ---------------------------------------------------------------------------

revoke all on function public.set_user_role(uuid, public.app_role, boolean) from public;
revoke all on function public.adjust_stock(uuid, integer, public.stock_movement_type, text) from public;
revoke all on function public.create_sale(jsonb, text, public.payment_method, numeric, text) from public;
revoke all on function public.void_sale(uuid, text) from public;

grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;
grant execute on function public.adjust_stock(uuid, integer, public.stock_movement_type, text) to authenticated;
grant execute on function public.create_sale(jsonb, text, public.payment_method, numeric, text) to authenticated;
grant execute on function public.void_sale(uuid, text) to authenticated;
