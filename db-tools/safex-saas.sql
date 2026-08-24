-- ═══════════════════════════════════════════════════════════════
-- SAFEX SaaS-READY AUTH ARCHITECTURE (Phase 1)
-- companies + users + secure auth RPCs
-- No Super Admin portal yet — sab manual management via Dashboard
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. COMPANIES: add SaaS columns (legacy table reuse — no data loss) ──
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_code text;
UPDATE public.companies SET company_name = COALESCE(company_name, name),
                           company_code = COALESCE(company_code, upper(slug));
CREATE UNIQUE INDEX IF NOT EXISTS companies_company_code_key ON public.companies (company_code) WHERE company_code IS NOT NULL;

-- ── 2. USERS table (exact spec + internal auth columns) ──
CREATE TABLE IF NOT EXISTS public.users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text,
  role text NOT NULL DEFAULT 'Safety Officer',
  login_type text NOT NULL DEFAULT 'Safety Officer',   -- 'Safety Officer' | 'CSMS' | 'Conduct DM'
  company_id uuid REFERENCES public.companies(id),
  designation text,
  employee_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  -- internal auth columns (never exposed to clients)
  password_hash text,
  salt text,
  otp_hash text,
  otp_expires timestamptz
);
CREATE INDEX IF NOT EXISTS users_company_idx ON public.users (company_id);
CREATE INDEX IF NOT EXISTS users_login_type_idx ON public.users (login_type);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.safex_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS users_touch_updated ON public.users;
CREATE TRIGGER users_touch_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.safex_touch_updated_at();

-- ── 3. Migrate existing officers → users (same salted-hash scheme, passwords keep working) ──
INSERT INTO public.users (username, full_name, email, role, login_type, designation, status, password_hash, salt, company_id)
SELECT v.user_id, v.name, v.email, 'Safety Officer', 'Safety Officer', 'Safety Officer', 'active', v.password_hash, v.salt,
       (SELECT id FROM public.companies WHERE slug = 'emveess' LIMIT 1)
  FROM public.vault_officers v
 WHERE v.password_hash IS NOT NULL
ON CONFLICT (username) DO NOTHING;

-- ── 4. Lock the users table; safe view only (no secrets, no email) ──
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.users FROM anon, authenticated;

DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe AS
  SELECT id, full_name, username, role, login_type, company_id, designation, employee_id, status, created_at, updated_at, last_login
    FROM public.users;
REVOKE ALL ON public.users_safe FROM anon, authenticated;
GRANT SELECT ON public.users_safe TO anon;

-- ── 5. RPC: main login (all 3 login types) ──
CREATE OR REPLACE FUNCTION public.safex_login_v2(p_username text, p_client_hash text, p_login_type text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE rec RECORD;
BEGIN
  IF p_username IS NULL OR p_client_hash IS NULL OR p_login_type IS NULL THEN RETURN NULL; END IF;
  SELECT u.id, u.username, u.full_name, u.role, u.login_type, u.company_id, u.designation, u.employee_id, u.status
    INTO rec
    FROM public.users u
   WHERE u.username = p_username
     AND (u.login_type = p_login_type OR (p_login_type = 'CSMS' AND u.login_type = 'Safety Officer'))
     AND u.status = 'active'
     AND u.password_hash IS NOT NULL
     AND u.password_hash = encode(extensions.digest(p_client_hash || ':' || COALESCE(u.salt, ''), 'sha256'::text), 'hex')
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  UPDATE public.users SET last_login = now() WHERE id = rec.id;
  RETURN json_build_object(
    'id', rec.id,
    'username', rec.username,
    'full_name', rec.full_name,
    'role', rec.role,
    'login_type', rec.login_type,
    'company_id', rec.company_id,
    'designation', rec.designation,
    'employee_id', rec.employee_id,
    'status', rec.status,
    'otp_required', (rec.login_type <> 'Conduct DM')  -- Conduct DM: NO OTP
  );
END;
$$;
REVOKE ALL ON FUNCTION public.safex_login_v2(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_login_v2(text, text, text) TO anon;

-- ── 6. RPC: forgot-password email verify (Conduct DM EXCLUDED by design) ──
CREATE OR REPLACE FUNCTION public.safex_verify_user_email(p_username text, p_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE rec RECORD;
BEGIN
  IF p_username IS NULL OR p_email IS NULL THEN RETURN NULL; END IF;
  SELECT id, username, full_name, email, role, login_type
    INTO rec
    FROM public.users
   WHERE username = p_username
     AND lower(email) = lower(p_email)
     AND login_type IN ('Safety Officer', 'CSMS')
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  RETURN json_build_object('id', rec.id, 'username', rec.username, 'full_name', rec.full_name, 'email', rec.email, 'role', rec.role, 'login_type', rec.login_type);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_user_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_user_email(text, text) TO anon;

-- ── 7. RPC: set new password (reset flow) ──
CREATE OR REPLACE FUNCTION public.safex_set_user_password(p_username text, p_email text, p_client_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  IF p_username IS NULL OR p_email IS NULL OR p_client_hash IS NULL THEN RETURN false; END IF;
  UPDATE public.users
     SET password_hash = encode(extensions.digest(p_client_hash || ':' || COALESCE(salt, extensions.gen_random_uuid()::text), 'sha256'::text), 'hex'),
         salt = COALESCE(salt, extensions.gen_random_uuid()::text)
   WHERE username = p_username
     AND lower(email) = lower(p_email)
     AND login_type IN ('Safety Officer', 'CSMS');
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_set_user_password(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_set_user_password(text, text, text) TO anon;

-- ── 8. RPC: user lookup by email (cross-device magic link session) ──
CREATE OR REPLACE FUNCTION public.safex_user_by_email(p_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE rec RECORD;
BEGIN
  IF p_email IS NULL THEN RETURN NULL; END IF;
  SELECT id, username, full_name, role, login_type, status
    INTO rec
    FROM public.users
   WHERE lower(email) = lower(p_email)
     AND status = 'active'
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  RETURN json_build_object('id', rec.id, 'username', rec.username, 'full_name', rec.full_name, 'role', rec.role, 'login_type', rec.login_type);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_user_by_email(text) TO anon;

-- ── 9. Email OTP infrastructure (delivery via future edge function/SMTP) ──
CREATE OR REPLACE FUNCTION public.safex_generate_user_otp(p_username text, p_login_type text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE code text; rec RECORD;
BEGIN
  IF p_username IS NULL OR p_login_type IS NULL THEN RETURN false; END IF;
  SELECT id, salt INTO rec FROM public.users
   WHERE username = p_username AND login_type = p_login_type AND status = 'active' LIMIT 1;
  IF rec IS NULL THEN RETURN false; END IF;
  code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  UPDATE public.users
     SET otp_hash = encode(extensions.digest(code || ':' || COALESCE(rec.salt, ''), 'sha256'::text), 'hex'),
         otp_expires = now() + interval '10 minutes'
   WHERE id = rec.id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_generate_user_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_generate_user_otp(text, text) TO anon;

CREATE OR REPLACE FUNCTION public.safex_verify_user_otp(p_username text, p_otp_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE rec RECORD;
BEGIN
  IF p_username IS NULL OR p_otp_hash IS NULL THEN RETURN false; END IF;
  SELECT id INTO rec FROM public.users
   WHERE username = p_username
     AND otp_hash = p_otp_hash
     AND otp_expires > now()
     AND status = 'active'
   LIMIT 1;
  IF rec IS NULL THEN RETURN false; END IF;
  UPDATE public.users SET otp_hash = NULL, otp_expires = NULL WHERE id = rec.id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_user_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_user_otp(text, text) TO anon;

COMMIT;
