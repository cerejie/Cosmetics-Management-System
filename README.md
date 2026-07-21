# Cosmetics Management System

Inventory and sales management for a cosmetics retail business — built with
React, TypeScript, Ant Design, vanilla-extract, zustand and Supabase.

## Features

**Inventory**
- Full product CRUD, including editing the quantity on hand directly
- SKU, brand, category, cost and selling price, reorder threshold
- Low-stock and out-of-stock flags driven by the reorder level
- Quick +/− stock adjustments (deliveries, damages, recounts) with a reason
- Append-only movement log — every change to stock is auditable, whether it
  came from an edit, an adjustment, a sale, or a voided sale

**Sales**
- Point-of-sale screen: searchable product picker, cart, discount, checkout
- Stock is decremented atomically as part of recording the sale
- Sales history with search, filters and per-sale detail
- Admins can void a sale, which restores stock and logs the reversal

**Dashboard**
- Revenue today / this month, sales counts, restocking alerts
- 14-day revenue trend and best-selling products

**Users and access control**
- Accounts are **username-based** — no email address is required
- Three hierarchical roles: **superadmin → admin → employee**
- Only the superadmin is a Supabase Auth account, so staff do not count against
  the Auth free-tier cap; everyone else signs in through a database RPC that
  mints a JWT signed with the project's own secret
- Superadmins add admins; admins add employees
- Staff can also request an account, which stays pending until an admin approves
- Admins reset passwords; accounts can be disabled without being deleted
- Enforced in the database through RLS and role checks in every RPC

## Getting started

### 1. Install

```bash
yarn install
```

### 2. Create a Supabase project

In the Supabase SQL editor, run **in order**:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_roles_and_product_rpc.sql`
3. `supabase/migrations/0003_username_login.sql`
4. `supabase/migrations/0004_custom_jwt_auth.sql`
5. `supabase/seed.sql` (optional sample catalogue)

### 3. Set the JWT signing secret

Staff sign in through the `login` RPC, which signs a token with the project's own
JWT secret. Copy it from **Project Settings → API → JWT Settings → JWT Secret**
and run, once:

```sql
update app.settings set jwt_secret = '<PROJECT_JWT_SECRET>';
```

Never commit this value and never put it in `.env` — it lives only in the
database, in a schema with no grants.

> If the project offers only asymmetric (ECC/RSA) signing keys, enable the
> legacy HS256 secret first. `app.sign_jwt` cannot work without it.

Without this step nobody but the superadmin can sign in.

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API**. The app validates these at startup and fails with a
clear message if they are missing.

### 5. Create the superadmin

Add one user under **Authentication → Users**. That is the only Supabase Auth
account the system uses, and it becomes the **superadmin**; it signs in with its
email address rather than a username.

Then turn **off** *Allow new users to sign up* under **Authentication →
Providers → Email**, so no second Auth account can appear.

From there, sign in and use the **Users** screen: the superadmin adds admins, and
admins add employees. Staff can also request an account from the sign-in screen,
which an admin approves. Roles can never be self-assigned.

### 6. Run

```bash
yarn dev
```

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start the dev server |
| `yarn build` | Typecheck and build for production |
| `yarn typecheck` | Type-check without emitting |
| `yarn lint` | Lint the source |

## Architecture

Hybrid type-based: top-level folders by technical type, then by business module,
then by component category. See [CLAUDE.md](CLAUDE.md) for the full layering
rules and the database security invariants.
