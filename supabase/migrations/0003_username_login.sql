-- Username-based accounts.
--
-- Supabase Auth always needs an email, so accounts created in-app get a
-- deterministic synthetic one: <username>@cosmetics.local. It is never sent to,
-- because the create-user function marks the account confirmed on creation.
--
-- The domain is duplicated in three places that must stay in sync:
--   supabase/functions/create-user/index.ts   (INTERNAL_EMAIL_DOMAIN)
--   src/config/constants.ts                   (INTERNAL_EMAIL_DOMAIN)
--   this file                                 (public.username_to_email)

alter table public.users add column if not exists username text;

-- Backfill: local part of the existing email, sanitised.
update public.users u
set username = regexp_replace(lower(split_part(a.email, '@', 1)), '[^a-z0-9._-]', '', 'g')
from auth.users a
where a.id = u.id
  and (u.username is null or u.username = '');

-- Anyone still without one (no email at all) falls back to a stable stub.
update public.users
set username = 'user_' || left(replace(id::text, '-', ''), 8)
where username is null or username = '';

create unique index if not exists users_username_key on public.users (lower(username));

alter table public.users alter column username set not null;

-- ---------------------------------------------------------------------------
-- Helper shared by the login flow
-- ---------------------------------------------------------------------------

create or replace function public.username_to_email(p_username text)
returns text
language sql
immutable
as $$
  select lower(btrim(p_username)) || '@cosmetics.local';
$$;

-- ---------------------------------------------------------------------------
-- New auth users: take the username from metadata when the create-user
-- function supplies it, otherwise derive it from the email local part.
-- The role is still never read from metadata.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first boolean;
  v_username text;
begin
  select not exists (select 1 from public.users) into v_is_first;

  v_username := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')), '');

  if v_username is null then
    v_username := regexp_replace(
      lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9._-]', '', 'g'
    );
  end if;

  if v_username = '' or v_username is null then
    v_username := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.users (id, email, username, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    lower(v_username),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when v_is_first then 'superadmin'::public.app_role else 'employee'::public.app_role end
  );

  return new;
end;
$$;
