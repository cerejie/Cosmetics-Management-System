-- Invoicing, supplier details, and safe product removal.
--
-- Three things the business needs and one bug the schema caused:
--
--   1. Printed invoices need the store's own identity (name, TIN, address,
--      contact). That is a single row of settings, so store_profile is a
--      singleton table rather than a key/value bag — the invoice reads named
--      columns, not lookups that might be missing.
--   2. Suppliers need the same identity fields, because a purchase invoice is
--      addressed to them.
--   3. Receipts should name the buyer, so there is now a customers table.
--      create_sale() finds or creates one from the name it is given and links
--      the sale to it. Only identity fields may be sent by the client; prices
--      and totals are still read from the database.
--   4. Deleting a product that has ever been sold raised a raw foreign key
--      error (sale_items_product_id_fkey). Deleting it was never the right
--      outcome — the audit trail must stay complete — so delete_product()
--      archives a product with history and only hard-deletes one without.
--
-- Nothing here weakens the stock invariants: stock still moves solely through
-- create_purchase, create_sale, void_sale and create_purchase_return.

-- ---------------------------------------------------------------------------
-- 1. Store profile
--
-- Exactly one row, enforced by a unique index on a constant expression. The
-- app upserts through save_store_profile() so it never has to know whether the
-- row exists yet.
-- ---------------------------------------------------------------------------

create table if not exists public.store_profile (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default '',
  legal_name text not null default '',
  tin text not null default '',
  address text not null default '',
  contact_number text not null default '',
  email text not null default '',
  website text not null default '',
  invoice_footer text not null default '',
  updated_at timestamptz not null default now()
);

create unique index if not exists store_profile_singleton
  on public.store_profile ((true));

drop trigger if exists store_profile_set_updated_at on public.store_profile;
create trigger store_profile_set_updated_at
before update on public.store_profile
for each row execute function public.set_updated_at();

insert into public.store_profile (store_name)
select 'My Store'
where not exists (select 1 from public.store_profile);

alter table public.store_profile enable row level security;

-- Readable by everyone who can print an invoice; writable by admins only.
drop policy if exists store_profile_select on public.store_profile;
create policy store_profile_select on public.store_profile
  for select to authenticated using (true);

drop policy if exists store_profile_write on public.store_profile;
create policy store_profile_write on public.store_profile
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.store_profile to authenticated;
-- The singleton is never removed, only edited.
revoke delete on public.store_profile from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 2. Supplier invoice details
-- ---------------------------------------------------------------------------

alter table public.suppliers
  add column if not exists tin text not null default '',
  add column if not exists payment_terms text not null default '';

-- ---------------------------------------------------------------------------
-- 3. Customers
--
-- Walk-in trade still works: a sale with no customer name records nothing here.
-- The moment a name is typed, create_sale() finds or creates the customer and
-- links the sale to it, so the list fills itself from ordinary use rather than
-- from someone remembering to maintain it. New rows start empty — the
-- Customers screen shows them as "no information yet" until they are filled in.
--
-- The sale keeps its own copy of the name, contact and TIN. A customer who is
-- renamed or corrected later must not change what an already printed invoice
-- said, so those columns are a snapshot, not a lookup.
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_person text not null default '',
  contact_number text not null default '',
  tin text not null default '',
  address text not null default '',
  email text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Matching is case-insensitive so "Maria Santos" and "maria santos" are one
-- customer, not two.
create unique index if not exists customers_name_lower_idx
  on public.customers (lower(name));

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers
  for select to authenticated using (true);

-- Cashiers record sales, so they may add and correct a customer. Removing one
-- is an admin decision.
drop policy if exists customers_write on public.customers;
create policy customers_write on public.customers
  for insert to authenticated with check (true);

drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers
  for update to authenticated using (true) with check (true);

drop policy if exists customers_delete on public.customers;
create policy customers_delete on public.customers
  for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.customers to authenticated;

alter table public.sales
  add column if not exists customer_contact text not null default '',
  add column if not exists customer_tin text not null default '',
  -- set null, not restrict: deleting a customer must never make an old sale
  -- unreadable, and the sale still carries its own copy of their details.
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

create index if not exists sales_customer_id_idx on public.sales (customer_id);

-- The old signature is dropped rather than left as an overload, so a stale
-- client cannot keep calling a version that silently discards the customer.
drop function if exists public.create_sale(
  jsonb, text, public.payment_method, numeric, text
);

create or replace function public.create_sale(
  p_items jsonb,
  p_customer_name text default '',
  p_payment_method public.payment_method default 'cash',
  p_discount_amount numeric default 0,
  p_note text default '',
  p_customer_contact text default '',
  p_customer_tin text default '',
  p_customer_id uuid default null
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
  v_actor uuid := app.user_id();
  v_customer_id uuid := p_customer_id;
  v_customer_name text := btrim(coalesce(p_customer_name, ''));
  v_contact text := btrim(coalesce(p_customer_contact, ''));
  v_tin text := btrim(coalesce(p_customer_tin, ''));
begin
  -- SECURITY DEFINER bypasses RLS, so re-assert the caller is an active user.
  if not public.is_active_user() then
    raise exception 'Your account is not active' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale requires at least one item' using errcode = '22023';
  end if;

  if p_discount_amount < 0 then
    raise exception 'Discount cannot be negative' using errcode = '22023';
  end if;

  -- A named customer is found or created, so the Customers list builds itself
  -- from ordinary selling. An unnamed (walk-in) sale links to nothing.
  if v_customer_id is null and v_customer_name <> '' then
    select id into v_customer_id
    from public.customers
    where lower(name) = lower(v_customer_name);

    if not found then
      -- do nothing, not a plain insert: two tills ringing up the same new
      -- customer at once must not fail one of the sales.
      insert into public.customers (name, contact_number, tin)
      values (v_customer_name, v_contact, v_tin)
      on conflict (lower(name)) do nothing
      returning id into v_customer_id;

      if v_customer_id is null then
        select id into v_customer_id
        from public.customers
        where lower(name) = lower(v_customer_name);
      end if;
    end if;
  end if;

  -- Fill in blanks only. A detail typed at the till completes a record that
  -- says "no information yet", but never overwrites what someone curated on
  -- the Customers screen.
  if v_customer_id is not null then
    update public.customers
    set contact_number = case when contact_number = '' then v_contact else contact_number end,
        tin = case when tin = '' then v_tin else tin end
    where id = v_customer_id
      and ((contact_number = '' and v_contact <> '') or (tin = '' and v_tin <> ''));

    -- The name on the sale must match the customer it points at.
    select name into v_customer_name from public.customers where id = v_customer_id;
  end if;

  v_reference := 'SO-' || lpad(nextval('public.sale_reference_seq')::text, 6, '0');

  insert into public.sales
    (reference, customer_id, customer_name, customer_contact, customer_tin,
     payment_method, discount_amount, note, created_by)
  values
    (v_reference, v_customer_id, coalesce(v_customer_name, ''), v_contact, v_tin,
     p_payment_method, p_discount_amount, coalesce(p_note, ''), v_actor)
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
       'Sale ' || v_reference, v_sale.id, v_actor);
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

revoke all on function public.create_sale(
  jsonb, text, public.payment_method, numeric, text, text, text, uuid
) from public;
grant execute on function public.create_sale(
  jsonb, text, public.payment_method, numeric, text, text, text, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Removing a product without losing its history
--
-- sale_items, purchase_items, purchase_returns and stock_movements all point at
-- products. A product that appears in any of them is part of the audit trail,
-- so it is deactivated instead of deleted; the return value tells the client
-- which of the two happened so it can say so.
--
-- Direct DELETE is revoked, making this the only removal path.
-- ---------------------------------------------------------------------------

create or replace function public.delete_product(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_history boolean;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may manage products' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_id) then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  select exists (select 1 from public.sale_items where product_id = p_id)
      or exists (select 1 from public.purchase_items where product_id = p_id)
      or exists (select 1 from public.purchase_returns where product_id = p_id)
      or exists (select 1 from public.stock_movements where product_id = p_id)
    into v_has_history;

  if v_has_history then
    update public.products set is_active = false where id = p_id;
    return 'archived';
  end if;

  delete from public.products where id = p_id;
  return 'deleted';
end;
$$;

revoke all on function public.delete_product(uuid) from public;
grant execute on function public.delete_product(uuid) to authenticated;

-- products_delete stays as documentation of who may remove a product, but the
-- table privilege is gone, so every removal goes through the RPC above.
revoke delete on public.products from authenticated, anon;
