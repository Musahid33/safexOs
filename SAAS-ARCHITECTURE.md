# 🏗️ Safex — SaaS Architecture Notes (Development Phase)

## Current state (18 Aug 2026)

- **App:** Static MPA on Vercel · **Backend:** Supabase (Postgres + PostgREST + Storage + Realtime)
- **Auth:** `users` + `companies` tables, SECURITY DEFINER RPCs (no custom server)
- **Login portals:** Safety Officer, CSMS, Conduct DM
- **User management:** manual via Supabase Dashboard (Super Admin portal NOT built yet)

## Key objects

```
companies (id, company_name, company_code UNIQUE, status, created_at, ...legacy cols)
users     (id, full_name, username UNIQUE, email, role, login_type, company_id → companies,
           designation, employee_id, status, created_at, updated_at, last_login,
           password_hash, salt, otp_hash, otp_expires)   ← secrets never exposed
users_safe VIEW (no secrets, no email)                   ← anon read only
vault_security_log (append-only audit: login_success / login_failed / login_locked)
```

## RPCs (all SECURITY DEFINER, granted to anon only)

| RPC | Purpose |
|---|---|
| `safex_login_v2(p_username, p_client_hash, p_login_type)` | Login; enforces login_type isolation; returns public user JSON + `otp_required`; sets last_login |
| `safex_verify_user_email(p_username, p_email)` | Forgot-password (officer/CSMS only — Conduct DM rejected) |
| `safex_set_user_password(p_username, p_email, p_client_hash)` | Reset (officer/CSMS only) |
| `safex_user_by_email(p_email)` | Cross-device magic-link session pickup |
| `safex_generate_user_otp(p_username, p_login_type)` | OTP infra (10-min expiry, hashed) — email transport = future Edge Function/SMTP |
| `safex_verify_user_otp(p_username, p_otp_hash)` | OTP verify (one-time) |

## Login type matrix

| Portal | login_type | OTP | Forgot | Reset |
|---|---|---|---|---|
| Safety Officer | `Safety Officer` | ✅ | ✅ | ✅ email |
| CSMS | `CSMS` | ✅ | ✅ | ✅ email |
| Conduct DM | `Conduct DM` | ❌ | ❌ | 🗄️ manual DB |

Back-compat note: CSMS portal also accepts `Safety Officer` users until dedicated
CSMS users are created in the Dashboard.

## How to manage users (until Super Admin portal exists)

Supabase Dashboard → Table Editor → `users`:
- **New user:** insert row → `password_hash` can be set by running in SQL editor:
  `UPDATE users SET password_hash = encode(digest('<sha256(password)>' || ':' || COALESCE(salt, gen_random_uuid()::text), 'sha256'), 'hex'), salt = COALESCE(salt, gen_random_uuid()::text) WHERE username = '<USERNAME>';`
  (client sends `sha256(password)` — same as the login screen)
- **Conduct DM password reset:** same UPDATE, any time (no email needed).

## Future path (already designed for)

1. **Subdomains:** map `company_code` → `<code>.safex.com` (Vercel wildcard domain) → app reads company from hostname → `company_id` on session.
2. **Super Admin portal:** CRUD on companies/users/subscriptions — tables already carry status/plan fields.
3. **Multi-tenant RLS:** add policies `company_id = current_company()` to all data tables (single company today, so not enforced yet).
4. **Supabase Auth migration:** users.email → auth.users; replace RPC verify with auth (argon2id, server rate limiting, MFA).
5. **OTP email transport:** Edge Function reads OTP via service role and emails via SMTP (Resend/Brevo) — RPCs already store hashed OTP.
6. **Billing/subscriptions:** new tables later; `companies.plan` + `employees_limit` already exist.

## Golden rules

- Never edit `/home/user/safex` directly — source lives in `/home/user/safex-src`, build with `node build.js`.
- RPCs are the ONLY path to credentials — never grant anon table-level access to `users`.
- Audit every login (client already logs to `vault_security_log`).

---

# 🔐 PHASE 3 — Supabase Auth Username-Login System (18 Aug 2026)

## Architecture (per spec)
```
Login: Username + Password
  1. RPC safex_user_by_username(username, login_type) → profile + registered email
  2. supabase.auth.signInWithPassword(email, password)   ← Supabase Auth verify
  3. Safety Officer / CSMS → signInWithOtp(email) → 6-digit code OR email link → verifyOtp
     Conduct DM          → direct login (no OTP)
Forgot: RPC safex_verify_user_email → auth.resetPasswordForEmail (officer/CSMS only)
Reset : auth.updateUser({password}) (recovery session se)
```

## Data residency (spec: passwords ONLY in Supabase Auth)
- `public.users` columns: id, auth_user_id, full_name, username(UNIQUE), email(UNIQUE NOT NULL),
  role, login_type, company_id, designation, employee_id, status, created_at, updated_at, last_login
  → **NO password / otp columns** (verified: dropped)
- Passwords: bcrypt in `auth.users` (GoTrue) — pgcrypto `crypt()` compatible

## Existing users migrated (live verified)
| Username | Full Name | Registered Email (OTP goes here) | Auth user |
|---|---|---|---|
| TSL-OFF-01 | Amit Verma | musahid413@gmail.com | ✅ linked |
| TSL-OFF-02 | S. K. Mahapatra | musahid413+skm@gmail.com (Gmail alias → same inbox) | ✅ linked |

## Verified live
- signInWithPassword correct → 200 session · wrong → 400 invalid_credentials
- RPC lookup returns email behind the scenes · otp_required=true for officer
- OTP request per-email rate limited (30s) — Supabase mailer sends the code/link

## IMPORTANT — email delivery (dashboard settings)
1. Dashboard → Authentication → Sign In / Up → Email → **enable "Email OTP"**
   (tab 6-digit code emails aayenge; currently default template sends link+code as configured)
2. Rate limits: free tier ~3 emails/hour. Production ke liye **SMTP configure karo**:
   Authentication → Emails → SMTP: e.g. Gmail App Password
   (host smtp.gmail.com:465, user = sender Gmail, pass = 16-char app password)

## Adding a user (until Super Admin portal exists)
1. Dashboard → Authentication → Users → **Add user** → Email (registered email) + Password → Create (auto-confirm on)
2. Table Editor → public.users → Insert row:
   username (unique), full_name, email (SAME as step 1), role, login_type, company_id, status='active'
   → auth_user_id auto-link nahi hoga manually; SQL editor me chalao:
   `UPDATE users SET auth_user_id = (SELECT id FROM auth.users WHERE email = users.email) WHERE auth_user_id IS NULL;`

---

# 📧 PHASE 4 — Brevo Email OTP (Supabase limit bypass) — 18 Aug 2026

## Architecture
```
Login password verify (Supabase Auth) ✓
   → RPC safex_request_email_otp(username, login_type)
       • 6-digit crypto-random code, sha256(code||pepper||salt), 5-min expiry
       • 30-second per-user rate limit
       • Email sent SERVER-SIDE via pg_net → Brevo v3 API (key DB vault me,
         browser ko kabhi nahi milti)
   → RPC safex_verify_email_otp(username, code)
       • one-time (replay blocked), invalidates other pending codes
```
- `vault_secrets`: brevo_api_key / sender email / sender name (RLS on, anon = no access)
- `user_otps`: hashed OTPs only, 5-min expiry, auto one-time
- OTP emails: branded HTML, 6-digit code, "expires in 5 minutes"

## ⚠️ REQUIRED — Brevo dashboard setting (one time)
Brevo account pe **IP restriction ON hai** — Supabase ke requests 401 aa rahe hain.
Fix: Brevo dashboard → **Security → Authorised IPs** → IP restriction OFF karo
(ya wahan dikhne wale IPs allowlist karo). Uske baad OTP emails turant pahuchenge.

## Live verified (production)
- request OTP → {ok:true} + row stored (hashed) ✅
- 30s rate limit → {ok:false, retry_after:30} ✅
- correct code → true · replay → false · non-numeric → false ✅
- Brevo API reachable from Supabase (pg_net) — 401 sirf IP restriction ki wajah se ✅
