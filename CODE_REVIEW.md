# 🔍 SafetyOS / Safex — Code Review & Fixes

**Date:** 24 Aug 2026 · **Scope:** `safetyos/` (Next.js + Supabase SaaS), `safex-src/` → `safex/` (static PWA), `db-tools/`, `vercel-tools/`
**Status:** all builds green (`tsc --noEmit` ✓ · `next build` ✓ · PWA `build.js` ✓ · runtime smoke test ✓)

---

## What was reviewed

| Area | Status |
|---|---|
| Next.js app: auth, data layer, shell, module pages, admin | Reviewed + fixed |
| Supabase schema: tables, RLS, triggers, storage | Reviewed + fixed (see below) |
| Static PWA (officer/CSMS portals): login flow, build pipeline | Reviewed; build made portable |
| Vercel configs, deploy/DB tooling | Reviewed + fixed (headers, secrets hygiene) |
| Committed credentials / secret hygiene | **Issues found — see §3** |

---

## 1. Bugs fixed

### 1.1 Build-breaking: missing Tailwind utilities
`src/app/globals.css` used `@apply shadow-glass / shadow-glass-lg`, but those
utilities did not exist in `tailwind.config.ts` → **`next build` failed**.
✅ Added `glass` + `glass-lg` box-shadows to the Tailwind config.

### 1.2 PWA build not portable
`safex-src/build.js` hardcoded `/home/user/safex-src` and `/home/user/safex`.
Out of that sandbox layout the build failed / wrote to the wrong place.
✅ Now script-relative (`__dirname` + optional `SAFEX_SRC` / `SAFEX_OUT` env).
Verified: rebuild is **byte-identical** to the committed `safex/` output.

### 1.3 Live-mode notifications invisible
The bell + notifications page filtered on the demo-only `user === "all"` field;
live rows store `user_id` / `role`, so employees/staff saw nothing.
✅ Filters now handle `user_id == null` broadcasts; `NotificationItem` type updated.

### 1.4 Missing security headers on the Next.js app
`safetyos/vercel.json` had **no** CSP/HSTS/XFO/nosniff headers (the static PWA had them).
✅ Added full header set + immutable caching for `/_next/static`.

### 1.5 Secrets / files that must not be in the repo
The uploaded workspace contained **a real Vercel CLI token + refresh token**
(`.local/share/com.vercel.cli/auth.json`) and a **live `VERCEL_OIDC_TOKEN`** in
`safetyos/.env.local`. ✅ They were **not** imported into git; a root `.gitignore`
now covers `node_modules/`, `.env*`, `.vercel/`, build artifacts everywhere.

> ⚠️ **Action needed by you:** the Vercel token (`vca_…`) was exposed in the zip —
> **revoke it** at https://vercel.com/account/tokens. The Supabase anon key
> (`sb_publishable_…`) is public-by-design, but treat the OIDC token as compromised.

---

## 2. Security fixes (database — applied to `supabase/schema.sql` + `db-tools/safetyos-rls-hardening.sql`)

| # | Severity | Issue | Fix |
|---|---|---|---|
| S1 | 🔴 Critical | **Signup trigger trusted client data**: `raw_user_meta_data.role` / `company_slug` → anyone could `signUp()` with `role: "super_admin"` or land in another tenant | Role + company now read from **server-set `raw_app_meta_data` only**; self-signups get `employee` + no tenant until an admin assigns one (`profiles.company_id` made nullable) |
| S2 | 🔴 Critical | **Self role-escalation**: `profiles` UPDATE policy let a user change their own `role`/`company_id` | Self-edits keep role/company locked (`with check` compares against existing row); only admins can change them (company_admin within own tenant, super_admin anywhere) |
| S3 | 🟠 High | **Any authenticated user could UPDATE any tenant row** (employees/guests editing audits, incidents, employees…) | UPDATE gated on `app.can_edit_tenant()` (admins + safety officers + supervisors) |
| S4 | 🟠 High | **`subscriptions` policies not tenant-scoped** — company A could read/modify company B's subscription | Scoped to `company_id = app.current_company_id()` (or super_admin) |
| S5 | 🟠 Medium | **INSERT allowed on staff-only tables** (employees master, audits, inspections, training…) | INSERT on staff-only tables requires staff role; employees keep creating near-misses/hazards/grievances/documents |
| S6 | 🟠 Medium | **Hard DELETE** allowed to `safety_officer` (including other tenants' rows via unscoped deletes) | Deletes restricted to `super_admin` / `company_admin`, tenant-scoped (soft-delete remains the app's path — UI has no hard deletes) |
| S7 | 🟢 | `is_company_admin()` misnomer included safety officers | Split into `is_admin()` / `is_company_admin()` (admins) + `can_edit_tenant()` (staff) |
| S8 | 🟢 | Super admin could not actually operate cross-tenant (claimed feature) | `super_admin` gets the intended cross-tenant bypass on tenant tables, profiles, companies and subscriptions |

**Migration for existing DBs:** `db-tools/safetyos-rls-hardening.sql` (idempotent; drops + recreates policies/functions). Verified it parses through the repo's own `run-sql.js` splitter (24 statements).

---

## 3. Remaining risks (not changed — decisions needed)

1. **Live demo accounts** (`*@demo.com` / `demo1234`) exist in the live Supabase project.
   The README now warns to delete them before production. ❗ If this deployment is public,
   change/delete these accounts **now**.
2. **Hardcoded seed password** `safex@2026` in `db-tools/safex-auth-migration.sql`
   (legacy PWA migration). Rotate the officer passwords after the migration.
3. Legacy PWA auth (officer portals) uses its own `users`/`vault_*` tables + RPCs parallel
   to the new `profiles`-based SaaS — the two systems are not unified yet.
4. Client-side only rate limiting / lockout on legacy portals (documented limitation).
5. `.env.local` was excluded but exists only outside git — recreate it on deploy from
   `DEPLOY.md` values (add `VERCEL_OIDC_TOKEN` only when the CLI needs it; prefer `vercel login`).
6. RLS policies evaluate `app.current_role()` per row — fine at this scale; `search_path`
   is pinned on all `SECURITY DEFINER` functions.

---

## 4. How to deploy

```bash
# 1. Apply DB hardening (once)
cd db-tools && npm install
PGHOST=… PGUSER=postgres PGPASSWORD=… PGDATABASE=postgres node run-sql.js safetyos-rls-hardening.sql

# 2. Next.js app
cd safetyos && npm install && npm run build

# 3. Static PWA (if you still ship it)
cd ../safex-src && npm install && node build.js   # regenerates ../safex
```

Files changed in this pass: `safetyos/tailwind.config.ts`, `safetyos/src/lib/types.ts`,
`src/components/shell.tsx`, `src/app/(app)/notifications/page.tsx`,
`safetyos/vercel.json`, `safetyos/supabase/schema.sql`, `safetyos/README.md`,
`safex-src/build.js`, `.gitignore` (root), `db-tools/safetyos-rls-hardening.sql` (new).
