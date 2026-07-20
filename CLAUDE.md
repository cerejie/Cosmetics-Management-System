# Cosmetics Management System

Inventory and sales management for a cosmetics retail business.

## Stack

- **Package manager:** yarn (classic, 1.x) — never npm or pnpm
- **Build:** Vite + React 18 + TypeScript (strict, `noUncheckedIndexedAccess`)
- **UI:** Ant Design 5 — use antd components rather than raw `div`s
- **Styling:** vanilla-extract (`*.css.ts`) for layout and bespoke styles
- **State:** zustand — do not use `useState`
- **Validation:** zod, bridged into antd forms via `utils/common/formRules.ts`
- **Backend:** Supabase (Postgres + auth + RLS)

## Architecture — hybrid type-based

Top level is organised by technical type. Inside each, by business module
(`common`, `auth`, `inventory`, `sales`, `dashboard`). Inside module folders,
by category (`forms`, `tables`, `modals`, `cards`, `charts`, `inputs`, …).

```
src/
  api/        Thin Supabase wrappers. Return raw DB rows. Throw ApiError.
  services/   Map rows to domain types, orchestrate. Called only by stores.
  store/      zustand. Holds server data AND UI state (modals, filters).
  hooks/      Bind stores to components; derive values with useMemo.
  components/ Presentational + container components, grouped by module/category.
  pages/      Route-level screens. Compose components, trigger loads on mount.
  schemas/    zod schemas — the single source of truth for form validation.
  types/      Domain types + `toX()` row→domain mappers.
  utils/      Pure functions (formatting, filtering, metrics).
  routes/     Route table and guards.
  config/     env, constants, route paths.
  styles/     vanilla-extract theme + antd theme (keep the two in sync).
```

**Layering rule:** `pages → hooks/components → store → services → api → supabase`.
Never skip a layer; components must not import from `api/`.

## Conventions

- No `any`. Prefer `unknown` and `readonly`.
- Domain types are camelCase; DB row types keep snake_case and end in `Row`.
- UI state lives in the module's store, not in components.
- Mutations go through `useAsyncAction()` so toasts stay consistent.
- New forms: define a zod schema in `schemas/`, then `zodRules(schema.shape)`.

## Database

Migrations live in `supabase/migrations/`. Apply `0001_init.sql` to a new project,
then optionally `seed.sql`.

**Security invariants — do not weaken these:**

- Stock is only ever changed by the `adjust_stock`, `create_sale`, and
  `void_sale` RPCs. They lock rows (`for update`) so concurrent sales cannot
  oversell. Never write `products.stock_quantity` directly from the client.
- `create_sale` reads prices from the database. The client sends only
  `{product_id, quantity}` — never prices or totals.
- `profiles.role` is not settable by the user. Sign-up always yields `staff`;
  promotion goes through the admin-only `set_user_role` RPC. Column grants
  (`grant update (full_name)`) enforce this, because RLS cannot restrict columns.
- Client-side `RequireAdmin` is UX only; the database enforces the same rules.

### Roles

- **admin** — manages products, categories, stock adjustments; can void sales.
- **staff** — records sales, reads inventory.

Promote the first admin manually after signing them up:

```sql
update public.profiles set role = 'admin' where id = '<user-id>';
```

## Commands

```
yarn dev        # dev server (port 5173)
yarn build      # typecheck + production build
yarn typecheck  # tsc --noEmit
yarn lint       # eslint
```

Requires `.env` (copy from `.env.example`).
