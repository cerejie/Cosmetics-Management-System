# Cosmetics Management System

Inventory and sales management for a cosmetics retail business — built with
React, TypeScript, Ant Design, vanilla-extract, zustand and Supabase.

## Features

**Inventory**
- Product catalogue with SKU, brand, category, cost and selling price
- Stock levels with reorder thresholds and low/out-of-stock flags
- Stock adjustments (deliveries, damages, recounts) with a required reason
- Full append-only movement log — every change to stock is auditable

**Sales**
- Point-of-sale screen: searchable product picker, cart, discount, checkout
- Stock is decremented atomically as part of recording the sale
- Sales history with search, filters and per-sale detail
- Admins can void a sale, which restores stock and logs the reversal

**Dashboard**
- Revenue today / this month, sales counts, restocking alerts
- 14-day revenue trend and best-selling products

**Access control**
- Email/password auth with `admin` and `staff` roles
- Enforced in the database through RLS and role checks in RPCs

## Getting started

### 1. Install

```bash
yarn install
```

### 2. Create a Supabase project

In the Supabase SQL editor, run:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed.sql` (optional sample catalogue)

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API**. The app validates these at startup and fails with a
clear message if they are missing.

### 4. Create your first admin

Add a user under **Authentication → Users**, then promote them:

```sql
update public.profiles set role = 'admin' where id = '<user-id>';
```

New sign-ups are always created as `staff` — the role cannot be self-assigned.

### 5. Run

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
