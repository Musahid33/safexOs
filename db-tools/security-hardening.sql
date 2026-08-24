-- ═══════════════════════════════════════════════════════════════
-- SAFEX SECURITY HARDENING (production)
-- Auth tables: vault_officers, vault_admin, vault_officer_otps
-- Strategy:
--   1. Plaintext passwords → salted SHA-256 (client sends SHA-256,
--      server stores SHA-256(client_hash || ':' || salt))
--   2. Column-level privileges: anon can NO LONGER read/write
--      password / password_hash / salt columns
--   3. All credential checks move into SECURITY DEFINER RPCs
--   4. RLS enabled on vault_admin + vault_officer_otps
--   5. Security audit log table (insert-only for anon)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. salt columns ──
ALTER TABLE public.vault_officers ADD COLUMN IF NOT EXISTS salt text;
ALTER TABLE public.vault_admin ADD COLUMN IF NOT EXISTS salt text;

-- ── 2. migrate legacy plaintext officer passwords → salted hashes ──
UPDATE public.vault_officers SET salt = gen_random_uuid() WHERE salt IS NULL;
UPDATE public.vault_officers
   SET password_hash = encode(digest(encode(digest(password, 'sha256'), 'hex') || ':' || salt, 'sha256'), 'hex'),
       password = ''
 WHERE password IS NOT NULL AND password <> '';

-- ── 3. migrate vault_admin PIN → salted hash (one-time, marker-guarded) ──
CREATE TABLE IF NOT EXISTS public.safex_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
UPDATE public.vault_admin SET salt = gen_random_uuid() WHERE salt IS NULL;
UPDATE public.vault_admin
   SET pin_hash = encode(digest(pin_hash || ':' || salt, 'sha256'), 'hex')
 WHERE pin_hash IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.safex_migrations WHERE name = 'vault_admin_pin_salted');
INSERT INTO public.safex_migrations (name) VALUES ('vault_admin_pin_salted') ON CONFLICT (name) DO NOTHING;

-- ── 4. RPC: verify officer login (SECURITY DEFINER) ──
CREATE OR REPLACE FUNCTION public.safex_verify_officer(p_user_id text, p_client_hash text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF p_user_id IS NULL OR p_client_hash IS NULL THEN RETURN NULL; END IF;
  SELECT id, user_id, name, plant, email
    INTO rec
    FROM vault_officers
   WHERE user_id = p_user_id
     AND password_hash IS NOT NULL
     AND password_hash = encode(digest(p_client_hash || ':' || COALESCE(salt, ''), 'sha256'::text), 'hex')
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  RETURN json_build_object('id', rec.id, 'user_id', rec.user_id, 'name', rec.name, 'plant', rec.plant, 'email', rec.email);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_officer(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_officer(text, text) TO anon;

-- ── 5. RPC: verify officer by user_id + email (forgot-password) ──
CREATE OR REPLACE FUNCTION public.safex_verify_officer_email(p_user_id text, p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF p_user_id IS NULL OR p_email IS NULL THEN RETURN NULL; END IF;
  SELECT id, user_id, name, plant, email
    INTO rec
    FROM vault_officers
   WHERE user_id = p_user_id AND lower(email) = lower(p_email)
   LIMIT 1;
  IF rec IS NULL THEN RETURN NULL; END IF;
  RETURN json_build_object('id', rec.id, 'user_id', rec.user_id, 'name', rec.name, 'plant', rec.plant, 'email', rec.email);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_officer_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_officer_email(text, text) TO anon;

-- ── 6. RPC: set new officer password (magic-link reset flow) ──
CREATE OR REPLACE FUNCTION public.safex_set_officer_password(p_user_id text, p_email text, p_client_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_email IS NULL OR p_client_hash IS NULL THEN RETURN false; END IF;
  UPDATE vault_officers
     SET password_hash = encode(digest(p_client_hash || ':' || COALESCE(salt, gen_random_uuid()), 'sha256'::text), 'hex'),
         salt = COALESCE(salt, gen_random_uuid()),
         password = ''
   WHERE user_id = p_user_id AND lower(email) = lower(p_email);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_set_officer_password(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_set_officer_password(text, text, text) TO anon;

-- ── 7. vault_officers privileges: strip anon access to secrets ──
DROP POLICY IF EXISTS vault_officers_public_insert ON public.vault_officers;
REVOKE ALL ON public.vault_officers FROM anon;
GRANT SELECT ON public.vault_officers TO anon;
REVOKE SELECT (password), SELECT (password_hash), SELECT (salt) ON public.vault_officers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.vault_officers FROM anon;

-- ── 8. vault_admin: enable RLS + secret check via RPC only ──
ALTER TABLE public.vault_admin ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vault_admin FROM anon;

CREATE OR REPLACE FUNCTION public.safex_verify_admin_pin(p_client_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_client_hash IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM vault_admin
     WHERE pin_hash IS NOT NULL
       AND pin_hash = encode(digest(p_client_hash || ':' || COALESCE(salt, ''), 'sha256'::text), 'hex')
     LIMIT 1
  );
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_admin_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_admin_pin(text) TO anon;

-- ── 9. vault_officer_otps: enable RLS; insert-only for anon; no hash reads ──
ALTER TABLE public.vault_officer_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vault_officer_otps_insert ON public.vault_officer_otps;
CREATE POLICY vault_officer_otps_insert ON public.vault_officer_otps
  FOR INSERT TO anon WITH CHECK (true);
REVOKE ALL ON public.vault_officer_otps FROM anon;
GRANT INSERT (officer_id, email, otp_hash, expires_at, used) ON public.vault_officer_otps TO anon;

CREATE OR REPLACE FUNCTION public.safex_recent_otp_status(p_officer_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_json json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO out_json
  FROM (
    SELECT created_at, used, (expires_at > now()) AS active
      FROM vault_officer_otps
     WHERE officer_id = p_officer_id
     ORDER BY id DESC
     LIMIT 5
  ) t;
  RETURN COALESCE(out_json, '[]'::json);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_recent_otp_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_recent_otp_status(text) TO anon;

-- ── 10. security audit log (insert-only, append-only) ──
CREATE TABLE IF NOT EXISTS public.vault_security_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_security_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vault_security_log_insert ON public.vault_security_log;
CREATE POLICY vault_security_log_insert ON public.vault_security_log
  FOR INSERT TO anon WITH CHECK (true);
REVOKE ALL ON public.vault_security_log FROM anon;
GRANT INSERT (event_type, detail) ON public.vault_security_log TO anon;

-- ── 11. storage: remove anon DELETE on safety-alerts (not used by app) ──
DROP POLICY IF EXISTS "Safety dashboard can delete alert attachments" ON storage.objects;

COMMIT;

-- ── 12. Safe read-only view (secrets never leave the database) ──
DROP VIEW IF EXISTS public.vault_officers_safe;
CREATE VIEW public.vault_officers_safe AS
  SELECT id, user_id, name, plant, email, phone, created_at
    FROM public.vault_officers;
REVOKE ALL ON public.vault_officers_safe FROM anon, authenticated;
GRANT SELECT ON public.vault_officers_safe TO anon;
