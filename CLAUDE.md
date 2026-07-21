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
(`common`, `auth`, `inventory`, `sales`, `purchasing`, `dashboard`, `reports`,
`settings`). Inside module folders, by category (`forms`, `tables`, `modals`,
`cards`, `charts`, `inputs`, …).

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
- Mobile numbers and TINs are captured with `MobileNumberInput` /
  `TinInput`, never a bare `Input`. They mask as you type and store one shape
  — `+63 917 123 4567` and `000-000-000-000` — so invoices print the value
  straight out of the database. Validate with `schemas/common/contact.schema`.
- A form's `onFinish` argument only carries fields that have a `Form.Item`.
  Values that live in `initialValues` alone are **not** in it — parse
  `form.getFieldsValue(true)` instead, or the schema will reject them as
  missing and the submit will silently do nothing.

## Printing

Printed documents are built as a standalone HTML string and rendered in a
hidden iframe (`utils/common/print.ts`), never with `window.print()` — that
would print the whole application, and taming it with `@media print` would put
knowledge of every screen into the app's stylesheet.

`types/common/invoice.types.ts` defines one `InvoiceDocument` shape; sales,
purchases and supplier statements each have a pure builder that produces one,
and `utils/common/invoiceHtml.ts` is the only renderer. Add a document by
writing a builder, not a second renderer. Reports print through
`utils/reports/reportPrint.ts`, which takes pre-formatted strings.

Every printed page carries the store profile as its letterhead, so any screen
that prints calls `useStoreProfileStore().ensureProfile()` on mount.

## Reports

`Daily | Weekly | Monthly | Annually | Date range` — the named periods all mean
the current one (today, this week, this month, this year). The range picks the
bucket automatically (`bucketFor`): day up to a month, week up to four months,
month beyond that, so no report is 365 unreadable rows.

`reportStore` owns the period and fetches sales and movements together for it.
Both report screens and Sales Analytics share it, so switching between them
never silently changes the period being measured.

## Purchasing

Deliberately small — the admin using it is not a systems person. A purchase is
supplier + date + rows of (product, quantity, unit cost); saving it puts the
goods into inventory straight away. There is no draft, no approval, no partial
receiving, and no per-line discount or tax. Do not reintroduce them.

Products are created **only** from the purchase screen (the picker's "Add a new
product"), so a delivery can contain something not yet on file. The Products
page has no New Product button; it edits and removes only.

Returns are standalone: supplier + product + quantity + reason, not linked to a
past purchase order.

Suppliers carry TIN and payment terms because a purchase invoice is addressed
to them. Their statement covers a period, chosen in a dialog before printing;
it opens on the current month unless the supplier has nothing this month, in
which case it widens to their whole history.

## Customers

There is a customers table, but nobody has to maintain it. `create_sale` finds
or creates a customer from the name it is given and links the sale, so the list
fills itself from ordinary selling. Rows created that way have only a name and
show as **"no information yet"** until someone fills them in. A sale with no
name is a walk-in and links to nothing.

The sale keeps its **own copy** of the name, contact number and TIN. Renaming
or correcting a customer must never change an invoice that is already printed,
so those columns are a snapshot, not a lookup.

Details typed at the till fill blanks on the customer record but never
overwrite anything already curated on the Customers screen.

## Authentication — hybrid Supabase Auth + custom JWT

Supabase's free tier caps monthly active Auth users, so **only the superadmin
has an `auth.users` row**. Everyone else is a row in `public.users` and signs in
through the `login` RPC, which verifies a bcrypt hash and mints a JWT signed
with the project's own JWT secret. PostgREST validates that token like a native
session, so RLS is the only authorisation layer.

- One login field. Usernames cannot contain `@` (zod regex + a CHECK
  constraint), so an identifier containing `@` is the superadmin's email and
  anything else is a username. Never add tabs or an account-type selector.
- The custom token rides on a `fetch` wrapper in `api/common/supabaseClient.ts`.
  It must **never** go through `auth.setSession()` — supabase-js would try to
  refresh a token it did not issue and clobber the superadmin's session.
- Custom sessions last a hard 8 hours with no refresh. The wrapper force-logs-out
  on any 401.
- Only `{ kind, user, token }` is persisted; the superadmin's session belongs to
  supabase-js.
- Identity comes from `app.user_id()` / `app.user_role()`, never `auth.uid()` —
  custom users have no `auth.uid()`.

## Database

Migrations live in `supabase/migrations/`. Apply them in order (`0001` … `0006`)
to a new project, then optionally `seed.sql`. **Migration 0004 is not complete
without its manual steps** — setting `app.settings.jwt_secret` and disabling
Auth sign-ups; they are listed at the bottom of that file.

The `app` schema holds the JWT secret and the signing helpers. It is not exposed
via PostgREST and gets no grants beyond `execute` on the identity helpers, which
RLS policies need. Nothing else may be granted there.

**Security invariants — do not weaken these:**

- Stock is only ever changed by the `create_purchase`, `create_sale`,
  `void_sale`, and `create_purchase_return` RPCs. They lock rows (`for update`)
  so concurrent sales cannot oversell. Direct `insert`/`update` on `products` is
  revoked from `authenticated` — never write `stock_quantity` from the client.
- **Inventory increases only by saving a purchase.** It decreases only by a sale
  or a return to the supplier. `save_product` has no stock argument and
  `adjust_stock` is revoked from `authenticated` (migration 0005); the product
  screen is a catalogue. Do not add an "add stock" path to it.
- Every stock change writes a `stock_movements` row. The audit trail must stay
  complete. This is why **products are never hard-deleted once they have
  history**: `delete_product` (migration 0006) archives a product that appears
  in a sale, purchase, return or movement and only truly deletes an unused one.
  Direct `delete` on `products` is revoked, so that RPC is the only path.
- A movement's "on hand before" is derived (`quantity_after - quantity`), never
  stored. Reports read opening and closing levels from the log itself, so a
  report of a past period stays correct however much has happened since.
- `create_sale` reads prices from the database; `create_purchase` recomputes
  every line total and `create_purchase_return` reads the cost from the product.
  The client sends only quantities, unit costs and customer identity — never a
  total it worked out itself.
- `users.role` is not settable by the user. `register` always creates a *pending
  employee* and never reads a role from its arguments; changes go through
  `set_user_role`. Column grants (`grant update (full_name)`) enforce this,
  because RLS cannot restrict columns.
- Password hashes live in `app.user_credentials`, never on `public.users`.
  `users_select` is `using (true)`, so a hash column there would be readable by
  every employee.
- Who may create, approve, or reset whom is decided **inside** the RPCs. The
  `useAuth()` / `canManageRole()` checks only hide buttons.
- Every `SECURITY DEFINER` function pins `set search_path`.
- `login` returns one message for every failure, so it cannot enumerate
  usernames, and refuses pending, rejected, and inactive accounts.
- Client-side guards are UX only; the database enforces the same rules.

### Roles

Hierarchical — each role may only manage the roles strictly below it.

| Role | Lives in | Signs in with | Can do |
| --- | --- | --- | --- |
| `superadmin` | `auth.users` + a `public.users` row | email | everything; creates admins and employees |
| `admin` | `public.users` | username | creates employees; approves requests; full inventory; voids sales |
| `employee` | `public.users` | username | records sales; reads inventory |

There is exactly one superadmin, seeded by signing up once in the Supabase
dashboard. It keeps a `public.users` row purely so `sales.created_by` and
`stock_movements.created_by` resolve — authorisation is still derived from the
token (`app.is_superadmin()` = authenticated but not a custom user).

Accounts arrive two ways: `admin_create_user` (already approved) or `register`
(self-service, `pending` until an admin approves it on the Users page).

`is_admin()` means *admin or superadmin* and gates inventory management.
`can_manage_role(target)` gates user management. Both read the token only, so
they are safe to call from a policy.

### Known limitation

Tokens stay valid for their full 8 hours: disabling or demoting a user does not
take effect until their token expires. Add a `token_version` column and claim if
immediate revocation becomes a requirement.

## Commands

```
yarn dev        # dev server (port 5173)
yarn build      # typecheck + production build
yarn typecheck  # tsc --noEmit
yarn lint       # eslint
```

Requires `.env` (copy from `.env.example`).
