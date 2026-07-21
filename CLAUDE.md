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

Migrations live in `supabase/migrations/`. Apply them in order (`0001`, then
`0002`) to a new project, then optionally `seed.sql`.

The `create-user` Edge Function lives in `supabase/functions/` and must be
deployed with `supabase functions deploy create-user`.

**Security invariants — do not weaken these:**

- Stock is only ever changed by the `save_product`, `adjust_stock`,
  `create_sale`, and `void_sale` RPCs. They lock rows (`for update`) so
  concurrent sales cannot oversell. Direct `insert`/`update` on `products` is
  revoked from `authenticated` — never write `stock_quantity` from the client.
- Editing quantity in the product form is allowed, and `save_product` logs the
  delta to `stock_movements`. The audit trail must stay complete.
- `create_sale` reads prices from the database. The client sends only
  `{product_id, quantity}` — never prices or totals.
- `users.role` is not settable by the user. Sign-up never reads a role from
  client-controlled metadata; changes go through `set_user_role`. Column grants
  (`grant update (full_name)`) enforce this, because RLS cannot restrict columns.
- Creating accounts needs the `service_role` key, so it lives **only** in the
  `create-user` Edge Function. It must never appear in a `VITE_` variable.
- Client-side guards are UX only; the database enforces the same rules.

### Roles

Hierarchical — each role may only manage the roles strictly below it.

| Role | Created by | Can do |
| --- | --- | --- |
| `superadmin` | the first sign-up | everything; creates admins and employees |
| `admin` | superadmin | creates employees; full inventory; voids sales |
| `employee` | admin | records sales; reads inventory |

The **first account to sign up becomes the superadmin** (`handle_new_user`
checks whether `public.users` is empty). Every later account defaults to
`employee` and is provisioned through the Edge Function, which sets the role
after authorising the caller.

`is_admin()` means *admin or superadmin* and gates inventory management.
`can_manage_role(target)` gates user management.

## Commands

```
yarn dev        # dev server (port 5173)
yarn build      # typecheck + production build
yarn typecheck  # tsc --noEmit
yarn lint       # eslint
```

Requires `.env` (copy from `.env.example`).
