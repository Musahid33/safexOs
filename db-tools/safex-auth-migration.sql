-- ═══════════════════════════════════════════════════════════════
-- SAFEX — SUPABASE AUTH MIGRATION (username login system)
-- Passwords: ONLY in Supabase Auth (auth.users) — users table se
-- password/otp columns hata diye jayenge.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. users table: auth_user_id + email unique (SaaS spec) ──
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Mahapatra ke liye unique alias email (Gmail +addressing — same inbox)
UPDATE public.users SET email = 'musahid413+skm@gmail.com' WHERE username = 'TSL-OFF-02';
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname='users_email_key') THEN
    CREATE UNIQUE INDEX users_email_key ON public.users (email);
  END IF;
END $$;

-- ── 2. Auth user for Amit (existing) — set password via bcrypt ──
UPDATE auth.users
   SET encrypted_password = extensions.crypt('safex@2026', extensions.gen_salt('bf')),
       email_confirmed_at = COALESCE(email_confirmed_at, now()),
       aud = 'authenticated', role = 'authenticated',
       raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
       raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb),
       updated_at = now()
 WHERE email = 'musahid413@gmail.com';

-- ── 3. Auth user for S. K. Mahapatra (new) ──
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
SELECT '00000000-0000-0000-0000-000000000000'::uuid,
       gen_random_uuid(), 'authenticated', 'authenticated',
       'musahid413+skm@gmail.com',
       extensions.crypt('safex@2026', extensions.gen_salt('bf')),
       now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"full_name":"S. K. Mahapatra"}'::jsonb,
       now(), now(), '', '', '', '', false
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'musahid413+skm@gmail.com');

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT u.id, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', u.email, now(), now(), now()
  FROM auth.users u
 WHERE u.email = 'musahid413+skm@gmail.com'
   AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

-- ── 4. Link users table → auth.users ──
UPDATE public.users SET auth_user_id = a.id
  FROM auth.users a
 WHERE a.email = public.users.email
   AND public.users.auth_user_id IS NULL;

-- ── 5. safe view update (auth_user_id include) ──
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe AS
  SELECT id, auth_user_id, full_name, username, role, login_type, company_id, designation, employee_id, status, created_at, updated_at, last_login
    FROM public.users;
REVOKE ALL ON public.users_safe FROM anon, authenticated;
GRANT SELECT ON public.users_safe TO anon;

-- ── 6. RPC: username lookup (login Step 1-2; email sirf behind-the-scenes) ──
CREATE OR REPLACE FUNCTION public.safex_user_by_username(p_username text, p_login_type text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE rec RECORD;
BEGIN
  IF p_username IS NULL OR p_login_type IS NULL THEN RETURN NULL; END IF;
  SELECT id, auth_user_id, full_name, username, email, role, login_type, company_id, designation, employee_id, status
    INTO rec
    FROM public.users
   WHERE username = p_username
     AND status = 'active'
     AND (login_type = p_login_type OR (p_login_type = 'CSMS' AND login_type = 'Safety Officer'))
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  RETURN json_build_object(
    'id', rec.id,
    'auth_user_id', rec.auth_user_id,
    'username', rec.username,
    'full_name', rec.full_name,
    'email', rec.email,
    'role', rec.role,
    'login_type', rec.login_type,
    'company_id', rec.company_id,
    'designation', rec.designation,
    'employee_id', rec.employee_id,
    'status', rec.status,
    'otp_required', (rec.login_type <> 'Conduct DM')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.safex_user_by_username(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_user_by_username(text, text) TO anon;

COMMIT;
