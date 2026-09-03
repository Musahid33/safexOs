# SafetyOS — One Platform. Complete Workplace Safety.

Multi-tenant **Health, Safety & Environment (HSE)** SaaS platform built on **Next.js 15 · TypeScript · TailwindCSS · Supabase (PostgreSQL)** — designed for Manufacturing, Mining, Steel, Construction, Warehousing, Logistics, EPC, Renewable Energy and Process Plants.

---

## ✨ What's inside

| Area | Details |
|---|---|
| **Multi-tenancy** | `company_id` on every table, Row-Level Security, per-tenant data, dashboard, branding & documents. Demo tenants: `emveess`, `revathi`, `abc` |
| **Roles** | Super Admin · Company Admin · Safety Officer · Supervisor · Employee · Guest — each with its own nav, permissions & views |
| **Modules** | Employee Master (QR profiles) · Near Miss · Hazard Reporting · Incident Management (5-Why + Fishbone) · Grievance · Training (calendar/matrix/effectiveness) · PPE · Vehicle Inspection · Tool Inspection · Audit (ISO/5S/CSMS/Internal/Customer) · Document Library |
| **Dashboard** | Employees, near misses, hazards, incidents, trainings, audits, safe man-hours, LTI-free days, open CAPA, pending actions, critical hazards, heat map & trend graphs |
| **Search & Reports** | Global search across all modules; report builder with date/department/contractor/status filters → CSV/Excel export & PDF/print |
| **Notifications** | Email / SMS / browser channels (WhatsApp marked future) |
| **Admin panel** | Platform dashboard, Companies, Subscriptions, Roles & Permissions matrix, Activity Logs |
| **Design** | Glassmorphism, Blue + White + Orange theme, dark mode, responsive, Linear/Notion-inspired enterprise UI |
| **Images** | Client-side auto-compression → WebP, 10 MB max, 100–300 KB target |
| **Data** | PostgreSQL, RLS, soft delete (`deleted_at`), audit logs, `created_by/updated_by/created_at/updated_at` |

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

**Current mode: LIVE** — connected to your Supabase project (`.env.local` → `NEXT_PUBLIC_DEMO_MODE=false`). Sign in with the accounts listed in the Supabase section below.

> Demo mode (mock data) is one env flag away: set `NEXT_PUBLIC_DEMO_MODE=true`, restart, and use the built-in role-switcher + tenant-switcher to explore every combination.

---

## 🔐 Before going live — IMPORTANT

1. **Disable or delete the demo accounts** (`superadmin@demo.com`, `admin@demo.com`,
   `officer@demo.com`, `supervisor@demo.com`, `employee@demo.com`, `guest@demo.com`
   — password `demo1234`). They are seeded for evaluation only and are a real
   backdoor if left enabled on a production project:
   ```sql
   delete from auth.users where email like '%@demo.com';
   ```
   Then re-create real users with the Auth admin API (see `db-tools/safetyos-rls-hardening.sql`).
2. **Apply the RLS hardening migration** to any DB created before Aug 2026
   (fixes signup privilege escalation, self role-change, unscoped updates/deletes
   and non-tenant-scoped subscriptions):
   ```bash
   npm install        # in db-tools
   PGHOST=... PGUSER=postgres PGPASSWORD=... PGDATABASE=postgres \
     node run-sql.js ../db-tools/safetyos-rls-hardening.sql
   ```
3. **Be careful with client uploads** — Vercel CLI credentials must never be
   committed; keep `.env.local` (and any `~/.vercel` / `.local` auth files) out of git.
4. **Security headers** ship via `vercel.json` for both apps (static PWA + Next.js).

## 🔌 Supabase connection — LIVE (configured)

This build is wired to your Supabase project. **`.env.local` currently has `NEXT_PUBLIC_DEMO_MODE=false` → live mode.**

- **Project:** `https://ixfwhxjtajmrdndhtsub.supabase.co` (region: ap-northeast-2)
- **Schema:** already applied — `supabase/schema.sql` (tables, RLS, audit triggers, storage)
- **Data:** already seeded — `supabase/seed.sql` (3 tenants + 6 demo users + sample data)

### Sign in (live)

| Email | Password | Role |
|---|---|---|
| `superadmin@demo.com` | `demo1234` | Super Admin (sees all 3 tenants) |
| `admin@demo.com` | `demo1234` | Company Admin |
| `officer@demo.com` | `demo1234` | Safety Officer |
| `supervisor@demo.com` | `demo1234` | Supervisor |
| `employee@demo.com` | `demo1234` | Employee |
| `guest@demo.com` | `demo1234` | Guest |

Verified via the live REST API: officer sees only `emveess` data (6 near misses), anonymous requests get 0 rows (RLS blocks), super admin sees all tenants. **No company can access another company's data.**

### Where the magic happens

- `src/lib/api.ts` — data layer: queries your Postgres via PostgREST, maps DB rows to the app's domain shape (FK → names)
- `src/lib/sync.ts` — loads the tenant's data + ID→name lookups into the shared store on login
- `src/lib/auth.tsx` — Supabase Auth login, role + company from `profiles` table
- `supabase/schema.sql` — DDL + Row-Level Security + audit triggers + per-tenant storage buckets
- `supabase/seed.sql` — idempotent demo data (re-runnable anytime)

### Creating real users (your own staff)

1. Supabase Dashboard → Authentication → Users → **Add user**
2. The `on_auth_user_created` trigger auto-creates their profile from metadata:

```json
{ "full_name": "New User", "role": "safety_officer", "company_slug": "emveess" }
```

Roles: `super_admin`, `company_admin`, `safety_officer`, `supervisor`, `employee`, `guest`

### Switch back to demo mode

Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` and restart — the app runs on in-memory mock data with the role-switcher enabled.

---

## 🏗 Architecture

```
safetyos/
├── supabase/schema.sql        # Full DDL: tables, RLS, triggers, storage
├── src/
│   ├── app/
│   │   ├── (auth)/            # login, forgot-password
│   │   └── (app)/             # authenticated shell + 25 pages
│   │       ├── dashboard      # KPIs, trends, heat map
│   │       ├── employees      # master + QR profile detail
│   │       ├── near-misses    # NEW → investigation (5-Why) → RCA → CLOSED + auto PDF/DOCX
│   │       ├── hazards        # register + risk controls
│   │       ├── incidents      # 5-Why + Fishbone + actions + evidence
│   │       ├── grievances     # submit → act → acknowledge loop
│   │       ├── training       # calendar / sessions / matrix / effectiveness
│   │       ├── ppe            # issues / stock / expiry tracker
│   │       ├── vehicle-inspections, tool-inspections
│   │       ├── audits         # ISO/5S/CSMS/Internal/Customer + findings
│   │       ├── documents      # SOP/JSA/HIRA/MSDS library
│   │       ├── search, reports, notifications, settings
│   │       └── admin          # dashboard, companies, subscriptions, roles, activity
│   ├── components/            # ui, charts (pure SVG), shell, data-table, fishbone…
│   └── lib/                   # types, store (mock seed), api (Supabase/mock), auth, roles
```

**Data access** — `src/lib/api.ts` exposes the same API in both modes:

```ts
listEntities("near-misses", companyId, { status: "NEW", q: "forklift" });
createEntity("near-misses", row);            // status ← "NEW"
updateEntity("near-misses", id, { status: "UNDER INVESTIGATION" });
// Workflow: NEW → UNDER INVESTIGATION → RCA COMPLETED → CLOSED (or REJECTED).
// Closing unlocks "Generate Report": builds PDF + DOCX clientside
// (src/lib/report-generator.ts) and auto-saves both to the
// csms-documents bucket under Near Miss/{year}/{month}/
// (src/lib/report-saver.ts) + a "Near Miss Report" row in `documents`.
```

---

## 🔐 Security model

- **Tenant isolation** — every table carries `company_id`; RLS policies evaluate `company_id = app.current_company_id()` (a `security definer` function reading the caller's profile). No tenant can read another tenant's rows.
- **Role gates** — write policies scoped per table; hard deletes restricted to company admins.
- **Soft delete** — records are archived with `deleted_at`; read policies filter them out.
- **Audit trail** — Postgres triggers write every INSERT/UPDATE/DELETE to `activity_logs`.
- **Storage** — per-tenant folders (`<slug>/…`) enforced by storage policies; 10 MB limit; JPEG/PNG/WebP/PDF.

---

## 🗺 Roadmap (from the PRD)

- [x] v1.0 — All modules, multi-tenant MVP, dashboards, reports, admin panel (this build)
- [ ] Google Login & OTP auth (Supabase providers)
- [ ] WhatsApp notifications (Twilio/WhatsApp Business API)
- [ ] Server-rendered PDF reports (edge function)
- [ ] AI suite — AI Incident Investigation, AI HIRA Generator, AI SOP Generator, AI Risk Prediction, AI Safety Assistant, AI Analytics
- [ ] Mobile PWA + offline near-miss reporting
- [ ] Custom domain mapping per tenant on Vercel

---

## 📄 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

Built with ❤️ for safer workplaces. **SafetyOS v1.0**
