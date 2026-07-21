-- Three-role hierarchy + editable stock quantity in the product form.
--
--   superadmin  the account created by the very first sign-up; manages admins
--   admin       created by a superadmin; manages employees and all inventory
--   employee    created by an admin; records sales, reads inventory
--
-- Roles are hierarchical: you may only create or modify accounts strictly
-- below your own level.

-- ---------------------------------------------------------------------------
-- 1. Drop everything that depends on the old enum / helpers.
-- Policies create a hard dependency on the functions they call, so they must
-- go before is_admin() can be dropped. They are recreated in step 8.
-- ---------------------------------------------------------------------------

drop policy if exists categories_write on public.categories;
drop policy if exists products_write on public.products;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_user_role(uuid, public.app_role, boolean);
drop function if exists public.is_admin();
drop function if exists public.current_app_role();

-- ---------------------------------------------------------------------------
-- 2. profiles -> users  (the app's own user table)
-- ---------------------------------------------------------------------------

alter table public.profiles rename to users;
alter trigger profiles_set_updated_at on public.users rename to users_set_updated_at;

-- Mirrored from auth.users so the management screen can list accounts without
-- needing the admin API. Kept in sync by handle_new_user on creation.
alter table public.users add column if not exists email text not null default '';

update public.users u
set email = a.email
from auth.users a
where a.id = u.id and u.email = '';

drop policy if exists profiles_select on public.users;
drop policy if exists profiles_update_self on public.users;

-- ---------------------------------------------------------------------------
-- 3. Swap the enum: staff -> employee, and add superadmin
-- ---------------------------------------------------------------------------

alter type public.app_role rename to app_role_old;

create type public.app_role as enum ('superadmin', 'admin', 'employee');

alter table public.users alter column role drop default;

alter table public.users
  alter column role type public.app_role
  using (case role::text when 'staff' then 'employee' else role::text end)::public.app_role;

alter table public.users alter column role set default 'employee';

drop type public.app_role_old;

-- ---------------------------------------------------------------------------
-- 4. Role helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and is_active;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'superadmin', false);
$$;

-- "Admin or above" — the check used for all inventory management.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('superadmin', 'admin'), false);
$$;

-- Who may create/modify an account of a given role.
create or replace function public.can_manage_role(p_target public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.current_app_role()
    when 'superadmin' then p_target in ('admin', 'employee')
    when 'admin' then p_target = 'employee'
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 5. New auth users
-- The very first account to sign up becomes the superadmin; everyone after
-- defaults to employee and is expected to be provisioned through the
-- create-user Edge Function, which sets the role explicitly afterwards.
-- The role is never read from raw_user_meta_data: that is client-controlled.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first boolean;
begin
  select not exists (select 1 from public.users) into v_is_first;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when v_is_first then 'superadmin'::public.app_role else 'employee'::public.app_role end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. RPC: set_user_role — change a role or (de)activate an account
-- ---------------------------------------------------------------------------

create or replace function public.set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_is_active boolean default true
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users;
begin
  select * into v_target from public.users where id = p_user_id for update;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '22023';
  end if;

  -- Must outrank both what they are now and what they are becoming.
  if not public.can_manage_role(v_target.role) or not public.can_manage_role(p_role) then
    raise exception 'You do not have permission to manage this account'
      using errcode = '42501';
  end if;

  update public.users
  set role = p_role, is_active = p_is_active
  where id = p_user_id
  returning * into v_target;

  return v_target;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: save_product — create or update, including stock quantity.
-- Editing the quantity directly is allowed, and any change is written to the
-- movement log so the audit trail stays complete.
-- ---------------------------------------------------------------------------

create or replace function public.save_product(
  p_sku text,
  p_name text,
  p_brand text,
  p_category_id uuid,
  p_cost_price numeric,
  p_unit_price numeric,
  p_stock_quantity integer,
  p_reorder_level integer,
  p_is_active boolean,
  p_id uuid default null,
  p_stock_reason text default 'Set from product form'
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_delta integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may manage products' using errcode = '42501';
  end if;

  if p_stock_quantity < 0 then
    raise exception 'Stock quantity cannot be negative' using errcode = '23514';
  end if;

  if p_id is null then
    insert into public.products
      (sku, name, brand, category_id, cost_price, unit_price,
       stock_quantity, reorder_level, is_active)
    values
      (upper(btrim(p_sku)), btrim(p_name), btrim(p_brand), p_category_id,
       p_cost_price, p_unit_price, p_stock_quantity, p_reorder_level, p_is_active)
    returning * into v_product;

    if p_stock_quantity > 0 then
      insert into public.stock_movements
        (product_id, type, quantity, quantity_after, reason, created_by)
      values
        (v_product.id, 'purchase', p_stock_quantity, p_stock_quantity,
         'Opening stock', auth.uid());
    end if;

    return v_product;
  end if;

  select * into v_product from public.products where id = p_id for update;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  v_delta := p_stock_quantity - v_product.stock_quantity;

  update public.products
  set sku = upper(btrim(p_sku)),
      name = btrim(p_name),
      brand = btrim(p_brand),
      category_id = p_category_id,
      cost_price = p_cost_price,
      unit_price = p_unit_price,
      stock_quantity = p_stock_quantity,
      reorder_level = p_reorder_level,
      is_active = p_is_active
  where id = p_id
  returning * into v_product;

  if v_delta <> 0 then
    insert into public.stock_movements
      (product_id, type, quantity, quantity_after, reason, created_by)
    values
      (v_product.id, 'adjustment', v_delta, v_product.stock_quantity,
       coalesce(nullif(btrim(p_stock_reason), ''), 'Set from product form'), auth.uid());
  end if;

  return v_product;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Policies
-- ---------------------------------------------------------------------------

create policy users_select on public.users
  for select to authenticated using (true);

create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- RLS cannot restrict which columns an update touches, so column grants stop a
-- user from promoting themselves. Roles move only through set_user_role.
revoke update on public.users from authenticated;
grant update (full_name) on public.users to authenticated;

create policy categories_write on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Products are written through save_product so stock changes are always logged.
revoke insert, update on public.products from authenticated;

create policy products_delete on public.products
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.set_user_role(uuid, public.app_role, boolean) from public;
revoke all on function public.save_product(
  text, text, text, uuid, numeric, numeric, integer, integer, boolean, uuid, text
) from public;

grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;
grant execute on function public.save_product(
  text, text, text, uuid, numeric, numeric, integer, integer, boolean, uuid, text
) to authenticated;
