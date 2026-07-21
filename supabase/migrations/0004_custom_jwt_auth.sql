-- Hybrid auth: one Supabase Auth account + custom username/password users.
--
-- Why: Supabase's free tier caps monthly active Auth users. Only the superadmin
-- keeps a real auth.users row. Everyone else lives in public.users and signs in
-- through public.login(), which mints a JWT signed with the project's own JWT
-- secret. PostgREST validates that token like any native session, so RLS keeps
-- working unchanged and there is no bespoke authorisation layer in the app.
--
-- Deviations from the reference design, both deliberate:
--
--   1. The superadmin DOES get a public.users row. sales.created_by and
--      stock_movements.created_by are foreign keys to public.users(id), so a
--      superadmin recording a sale would otherwise violate them. Authorisation
--      is still derived from the token, never from that row.
--   2. Password hashes live in app.user_credentials, not on public.users.
--      users_select is `using (true)`, and RLS cannot restrict columns, so a
--      hash column on public.users would be readable by every employee.
--
-- MANUAL STEPS AFTER APPLYING (see the end of this file for the full list):
--   - set app.settings.jwt_secret to the project's JWT secret
--   - disable email sign-ups in the Supabase dashboard

-- ---------------------------------------------------------------------------
-- 1. Private schema
--
-- `app` is not in PostgREST's exposed schemas, so nothing here is reachable
-- over the API. RLS policies still execute as the *calling* role, so
-- `authenticated` needs usage plus execute on the identity helpers only —
-- the signing functions and the secret table stay ungranted.
-- ---------------------------------------------------------------------------

create schema if not exists app;

revoke all on schema app from public;
-- Only `authenticated` needs this, and only so RLS policies can reach the
-- identity helpers. anon reaches `app` solely through SECURITY DEFINER RPCs,
-- which run as the owner.
grant usage on schema app to authenticated;

create extension if not exists pgcrypto;

create table if not exists app.settings (
  id         boolean primary key default true check (id),
  jwt_secret text not null default ''
);

insert into app.settings (id) values (true) on conflict (id) do nothing;

revoke all on app.settings from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. JWT signing (HS256)
--
-- SECURITY INVOKER on purpose: reading app.settings then fails for anyone but
-- the owner, so these are usable only from the SECURITY DEFINER RPCs below.
-- ---------------------------------------------------------------------------

create or replace function app.url_encode(p_data bytea)
returns text
language sql
immutable
strict
as $$
  select translate(encode(p_data, 'base64'), E'+/=\n', '-_');
$$;

create or replace function app.sign_jwt(p_payload jsonb)
returns text
language sql
volatile
set search_path = public, app, extensions
as $$
  with parts as (
    select
      app.url_encode(convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8')) as header,
      app.url_encode(convert_to(p_payload::text, 'utf8'))               as body
  ),
  signing as (
    select header || '.' || body as data,
           (select jwt_secret from app.settings limit 1) as secret
    from parts
  )
  select data || '.' || app.url_encode(hmac(data, secret, 'sha256'))
  from signing;
$$;

revoke all on function app.url_encode(bytea) from public, anon, authenticated;
revoke all on function app.sign_jwt(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Identity helpers — the only thing policies and RPCs may ask about identity
--
-- None of these read public.users, so they never recurse through RLS and stay
-- cheap enough to call from a policy.
-- ---------------------------------------------------------------------------

create or replace function app.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

-- The superadmin holds the only genuine Supabase Auth session. Custom tokens
-- carry is_custom_user = true, so "authenticated AND not custom" identifies it.
create or replace function app.is_superadmin()
returns boolean
language sql
stable
as $$
  select auth.role() = 'authenticated'
     and coalesce((app.jwt() ->> 'is_custom_user')::boolean, false) = false;
$$;

create or replace function app.user_role()
returns public.app_role
language sql
stable
as $$
  select case
    when auth.role() <> 'authenticated' then null
    when app.is_superadmin() then 'superadmin'::public.app_role
    else nullif(app.jwt() ->> 'user_role', '')::public.app_role
  end;
$$;

create or replace function app.user_id()
returns uuid
language sql
stable
as $$
  select case
    when app.is_superadmin() then auth.uid()
    else nullif(app.jwt() ->> 'sub', '')::uuid
  end;
$$;

grant execute on function app.jwt() to authenticated;
grant execute on function app.is_superadmin() to authenticated;
grant execute on function app.user_role() to authenticated;
grant execute on function app.user_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. public.users
--
-- Requires 0003, which adds users.username.
--
-- The FK to auth.users goes first: custom users have no auth.users row, and the
-- constraint would cascade-delete them when the auth rows are cleaned up below.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.users') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'users' and column_name = 'username'
     ) then
    raise exception
      'Migration 0003_username_login.sql has not been applied. Run it before this one.';
  end if;
end;
$$;

do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.users'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass;

  if v_constraint is not null then
    execute format('alter table public.users drop constraint %I', v_constraint);
  end if;
end;
$$;

alter table public.users alter column id set default gen_random_uuid();

do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_status'
                 and typnamespace = 'public'::regnamespace) then
    create type public.approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end;
$$;

alter table public.users
  add column if not exists approval_status public.approval_status not null default 'pending';

-- Everyone who exists today was provisioned by an admin, so they are approved.
update public.users set approval_status = 'approved';

create index if not exists users_approval_status_idx on public.users (approval_status);

-- Usernames may not contain '@', which is what lets one login field decide
-- between the superadmin's email and a custom username. Mirrored in
-- src/schemas/users/user.schema.ts.
update public.users
set username = regexp_replace(lower(btrim(username)), '[^a-z0-9._-]', '', 'g');

update public.users
set username = 'user' || left(replace(id::text, '-', ''), 8)
where length(username) < 3;

alter table public.users
  drop constraint if exists users_username_format;

alter table public.users
  add constraint users_username_format check (username ~ '^[a-z0-9._-]{3,32}$');

-- ---------------------------------------------------------------------------
-- 5. Credentials
--
-- Separate table in the private schema: no grants, so no policy and no client
-- query can ever surface a hash.
-- ---------------------------------------------------------------------------

create table if not exists app.user_credentials (
  user_id       uuid primary key references public.users (id) on delete cascade,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);

revoke all on app.user_credentials from public, anon, authenticated;

-- Carry existing passwords over. Supabase hashes auth.users.encrypted_password
-- with bcrypt, which crypt() verifies by re-hashing against the stored salt —
-- the same check public.login() performs. So nobody has to reset a password.
insert into app.user_credentials (user_id, password_hash)
select u.id, a.encrypted_password
from public.users u
join auth.users a on a.id = u.id
where u.role <> 'superadmin'
  and a.encrypted_password is not null
  and a.encrypted_password <> ''
on conflict (user_id) do nothing;

-- Those auth.users rows are now dead weight against the MAU cap. The
-- superadmin's is kept: it is the one real Auth session.
delete from auth.users
where id in (select id from public.users where role <> 'superadmin');

-- ---------------------------------------------------------------------------
-- 6. New Supabase Auth sign-ups
--
-- Only the superadmin should ever reach this path. It exists so the very first
-- deploy can bootstrap itself from the dashboard; disable email sign-ups
-- afterwards.
-- ---------------------------------------------------------------------------

-- Synthetic <username>@cosmetics.local addresses existed only so every account
-- could have a Supabase Auth row. Custom users no longer have one.
drop function if exists public.username_to_email(text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- app.is_superadmin() trusts *any* non-custom session, so a second Auth
  -- account would silently become a second superadmin. Disabling sign-ups in
  -- the dashboard is the intended control; this is the backstop if it is ever
  -- turned back on.
  if exists (select 1 from public.users where role = 'superadmin') then
    raise exception 'A super admin already exists. Create accounts from the Users screen.'
      using errcode = '42501';
  end if;

  v_username := regexp_replace(
    lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9._-]', '', 'g'
  );

  if length(v_username) < 3 then
    v_username := 'user' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.users (id, email, username, full_name, role, approval_status)
  values (
    new.id,
    coalesce(new.email, ''),
    v_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'superadmin',
    'approved'
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. public helpers now delegate to the token
--
-- Keeping the public.* names means every existing policy and RPC keeps working
-- untouched; only the identity source changes.
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select app.user_role();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select app.is_superadmin();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(app.user_role() in ('superadmin', 'admin'), false);
$$;

create or replace function public.can_manage_role(p_target public.app_role)
returns boolean
language sql
stable
as $$
  select case app.user_role()
    when 'superadmin' then p_target in ('admin', 'employee')
    when 'admin' then p_target = 'employee'
    else false
  end;
$$;

-- current_app_role() no longer reads public.users, so it no longer notices a
-- deactivated account. Business RPCs call this instead.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = app.user_id() and is_active and approval_status = 'approved'
  );
$$;

grant execute on function public.is_active_user() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Auth RPCs
-- ---------------------------------------------------------------------------

-- Mints an 8-hour session token. The three claims that make PostgREST accept
-- it: role/aud 'authenticated', sub (identity for RLS), is_custom_user.
create or replace function public.login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, app, extensions
as $$
declare
  v_user  public.users;
  v_hash  text;
  v_now   integer := extract(epoch from now())::integer;
begin
  select * into v_user from public.users where username = lower(btrim(p_username));

  if v_user.id is not null then
    select password_hash into v_hash from app.user_credentials where user_id = v_user.id;
  end if;

  -- One message for every failure mode, so this cannot enumerate usernames.
  if v_user.id is null or v_hash is null
     or v_hash <> crypt(p_password, v_hash) then
    raise exception 'Incorrect username or password.' using errcode = '28P01';
  end if;

  if v_user.approval_status = 'pending' then
    raise exception 'Your account is awaiting approval.' using errcode = '28000';
  end if;

  if v_user.approval_status = 'rejected' or not v_user.is_active then
    raise exception 'Your account is not active. Contact an administrator.'
      using errcode = '28000';
  end if;

  return jsonb_build_object(
    'token', app.sign_jwt(jsonb_build_object(
      'role',           'authenticated',
      'aud',            'authenticated',
      'sub',            v_user.id::text,
      'iat',            v_now,
      'exp',            v_now + 60 * 60 * 8,
      'is_custom_user', true,
      'username',       v_user.username,
      'user_role',      v_user.role
    )),
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'email', v_user.email,
      'full_name', v_user.full_name,
      'role', v_user.role,
      'is_active', v_user.is_active,
      'approval_status', v_user.approval_status,
      'created_at', v_user.created_at,
      'updated_at', v_user.updated_at
    )
  );
end;
$$;

-- Self-registration. Always a pending employee: role and approval are never
-- taken from the caller.
create or replace function public.register(
  p_username  text,
  p_password  text,
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = public, app, extensions
as $$
declare
  v_username text := lower(btrim(p_username));
  v_id       uuid;
begin
  if v_username !~ '^[a-z0-9._-]{3,32}$' then
    raise exception 'Username must be 3-32 characters: letters, numbers, dot, underscore or hyphen.'
      using errcode = '22023';
  end if;

  -- 72 bytes is bcrypt's input limit; anything beyond it is silently ignored.
  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    raise exception 'Password must be between 8 and 72 characters.' using errcode = '22023';
  end if;

  if btrim(coalesce(p_full_name, '')) = '' then
    raise exception 'Full name is required.' using errcode = '22023';
  end if;

  begin
    insert into public.users (username, full_name, role, approval_status, is_active)
    values (v_username, btrim(p_full_name), 'employee', 'pending', true)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'That username is already taken.' using errcode = '23505';
  end;

  insert into app.user_credentials (user_id, password_hash)
  values (v_id, crypt(p_password, gen_salt('bf')));
end;
$$;

-- Admin-created accounts skip approval. The hierarchy is enforced here, in the
-- database — the UI check is only there to hide buttons.
create or replace function public.admin_create_user(
  p_username  text,
  p_password  text,
  p_full_name text,
  p_role      public.app_role
)
returns public.users
language plpgsql
security definer
set search_path = public, app, extensions
as $$
declare
  v_username text := lower(btrim(p_username));
  v_user     public.users;
begin
  if not public.can_manage_role(p_role) then
    raise exception 'You do not have permission to create a % account.', p_role
      using errcode = '42501';
  end if;

  if v_username !~ '^[a-z0-9._-]{3,32}$' then
    raise exception 'Username must be 3-32 characters: letters, numbers, dot, underscore or hyphen.'
      using errcode = '22023';
  end if;

  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    raise exception 'Password must be between 8 and 72 characters.' using errcode = '22023';
  end if;

  if btrim(coalesce(p_full_name, '')) = '' then
    raise exception 'Full name is required.' using errcode = '22023';
  end if;

  begin
    insert into public.users (username, full_name, role, approval_status, is_active)
    values (v_username, btrim(p_full_name), p_role, 'approved', true)
    returning * into v_user;
  exception when unique_violation then
    raise exception 'That username is already taken.' using errcode = '23505';
  end;

  insert into app.user_credentials (user_id, password_hash)
  values (v_user.id, crypt(p_password, gen_salt('bf')));

  return v_user;
end;
$$;

-- Password resets are performed by an admin; there is no email delivery.
create or replace function public.admin_set_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, app, extensions
as $$
declare
  v_target public.users;
begin
  select * into v_target from public.users where id = p_user_id;

  if not found then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;

  if not public.can_manage_role(v_target.role) then
    raise exception 'You do not have permission to manage this account.' using errcode = '42501';
  end if;

  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    raise exception 'Password must be between 8 and 72 characters.' using errcode = '22023';
  end if;

  insert into app.user_credentials (user_id, password_hash, updated_at)
  values (p_user_id, crypt(p_password, gen_salt('bf')), now())
  on conflict (user_id)
  do update set password_hash = excluded.password_hash, updated_at = now();
end;
$$;

-- Approve or reject a self-registered account.
create or replace function public.set_user_approval(
  p_user_id uuid,
  p_status  public.approval_status
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.users;
begin
  if p_status = 'pending' then
    raise exception 'An account cannot be moved back to pending.' using errcode = '22023';
  end if;

  select * into v_target from public.users where id = p_user_id for update;

  if not found then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;

  if not public.can_manage_role(v_target.role) then
    raise exception 'You do not have permission to manage this account.' using errcode = '42501';
  end if;

  update public.users
  set approval_status = p_status
  where id = p_user_id
  returning * into v_target;

  return v_target;
end;
$$;

-- Rebuilt for app.user_id(): the superadmin has no row-level self to compare
-- against auth.uid() any more, and custom users are identified by the token.
create or replace function public.set_user_role(
  p_user_id   uuid,
  p_role      public.app_role,
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
    raise exception 'User not found.' using errcode = 'P0002';
  end if;

  if p_user_id = app.user_id() then
    raise exception 'You cannot change your own role.' using errcode = '22023';
  end if;

  -- Must outrank both what they are now and what they are becoming.
  if not public.can_manage_role(v_target.role) or not public.can_manage_role(p_role) then
    raise exception 'You do not have permission to manage this account.' using errcode = '42501';
  end if;

  update public.users
  set role = p_role, is_active = p_is_active
  where id = p_user_id
  returning * into v_target;

  return v_target;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Business RPCs: auth.uid() -> app.user_id()
--
-- auth.uid() reads the 'sub' claim directly and would work for custom users by
-- accident, but going through app.user_id() keeps one definition of identity.
-- Bodies are otherwise unchanged from 0001/0002.
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
  values (p_product_id, p_type, p_quantity, v_product.stock_quantity, p_reason, app.user_id());

  return v_product;
end;
$$;

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
         'Opening stock', app.user_id());
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
       coalesce(nullif(btrim(p_stock_reason), ''), 'Set from product form'), app.user_id());
  end if;

  return v_product;
end;
$$;

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
  v_actor uuid := app.user_id();
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

  v_reference := 'SO-' || lpad(nextval('public.sale_reference_seq')::text, 6, '0');

  insert into public.sales (reference, customer_name, payment_method, discount_amount, note, created_by)
  values (v_reference, coalesce(p_customer_name, ''), p_payment_method, p_discount_amount,
          coalesce(p_note, ''), v_actor)
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
  v_actor uuid := app.user_id();
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
       v_sale.id, v_actor);
  end loop;

  update public.sales
  set status = 'voided', voided_at = now(), voided_by = v_actor
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Policies
--
-- users_update_self used auth.uid(), which is null for custom users. Everything
-- else keeps working because it goes through public.is_admin().
-- ---------------------------------------------------------------------------

drop policy if exists users_update_self on public.users;

create policy users_update_self on public.users
  for update to authenticated
  using (id = app.user_id())
  with check (id = app.user_id());

-- Unchanged from 0002, restated here as the record of what is enforced:
-- RLS cannot restrict which columns an update touches, so column grants stop a
-- user from promoting themselves. Roles move only through set_user_role.
revoke update on public.users from authenticated;
grant update (full_name) on public.users to authenticated;

-- Pending accounts must not be able to insert themselves into the app if a
-- token is ever obtained another way; login() already refuses them.
revoke insert, delete on public.users from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 11. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.login(text, text) from public;
revoke all on function public.register(text, text, text) from public;
revoke all on function public.admin_create_user(text, text, text, public.app_role) from public;
revoke all on function public.admin_set_password(uuid, text) from public;
revoke all on function public.set_user_approval(uuid, public.approval_status) from public;

grant execute on function public.login(text, text) to anon, authenticated;
grant execute on function public.register(text, text, text) to anon, authenticated;
grant execute on function public.admin_create_user(text, text, text, public.app_role) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.set_user_approval(uuid, public.approval_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. Manual steps — this migration is not complete without them
--
--   1. Set the signing secret. Dashboard -> Project Settings -> API ->
--      JWT Settings -> JWT Secret. Never commit this value.
--
--        update app.settings set jwt_secret = '<PROJECT_JWT_SECRET>';
--
--      If the project only offers asymmetric (ECC/RSA) signing keys, enable the
--      legacy HS256 secret first — app.sign_jwt cannot work without it.
--
--   2. Confirm the superadmin. There must be exactly one row in auth.users, and
--      public.users must hold a matching row with role = 'superadmin'. On a
--      fresh project, sign up once from the dashboard; handle_new_user creates
--      the row.
--
--   3. Disable further Auth sign-ups: Dashboard -> Authentication -> Providers
--      -> Email -> turn off "Allow new users to sign up". Every later account
--      is created through admin_create_user or register.
--
--   4. Rate-limit public.login. It is callable by anon and runs bcrypt, so it
--      is a brute-force and CPU-exhaustion surface. Supabase's built-in
--      PostgREST limits do not cover RPC volume.
--
-- Known limitation: tokens are valid for their full 8 hours. Deactivating or
-- demoting a user does not take effect until their token expires. Add a
-- token_version column and claim if immediate revocation is ever needed.
-- ---------------------------------------------------------------------------
