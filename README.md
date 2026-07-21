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
- The first account to sign up becomes the superadmin
- Superadmins add admins; admins add employees
- Accounts can be disabled without being deleted
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
4. `supabase/seed.sql` (optional sample catalogue)

### 3. Deploy the account-creation function

Adding a user requires the `service_role` key, which can never be shipped to a
browser — so it runs server-side:

```bash
supabase link --project-ref <your-project-ref>
supabase functions deploy create-user
```

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` automatically; there is nothing to configure.

Without this step everything works except the **Add user** button.

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API**. The app validates these at startup and fails with a
clear message if they are missing.

### 5. Create the superadmin

Add the first user under **Authentication → Users**. Because
`public.users` is still empty, that account automatically becomes the
**superadmin**. Every account created afterwards defaults to `employee`, and
roles can never be self-assigned.

From there, sign in and use the **Users** screen: the superadmin adds admins,
and admins add employees.

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
