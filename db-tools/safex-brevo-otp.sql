-- ═══════════════════════════════════════════════════════════════
-- SAFEX — BREVO EMAIL OTP SYSTEM (Supabase email limit bypass)
--  - Brevo API key: vault_secrets me (sirf SECURITY DEFINER function
--    padh sakta hai — anon/browser ko kabhi nahi milti)
--  - OTP: user_otps table (hashed, 5-min expiry, one-time)
--  - Email send: pg_net se Brevo v3 API (server-side)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. secrets store (RLS on, koi policy nahi → anon padh nahi sakta) ──
CREATE TABLE IF NOT EXISTS public.vault_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vault_secrets FROM anon, authenticated;

INSERT INTO public.vault_secrets (name, value) VALUES
  ('brevo_api_key', 'BREVO_KEY_STORED_IN_DB_VAULT_ONLY'),
  ('brevo_sender_email', 'musahid413@gmail.com'),
  ('brevo_sender_name', 'Safex Security')
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ── 2. OTP store (hashed only, temporary, 5-min expiry) ──
CREATE TABLE IF NOT EXISTS public.user_otps (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.users(id),
  otp_hash text NOT NULL,
  salt text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_otps ADD COLUMN IF NOT EXISTS salt text;
CREATE INDEX IF NOT EXISTS user_otps_user_idx ON public.user_otps (user_id, created_at DESC);
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_otps FROM anon, authenticated;

-- ── 3. helper: email bhejo (internal, Brevo v3) ──
CREATE OR REPLACE FUNCTION public.safex_brevo_send(p_to_email text, p_to_name text, p_subject text, p_html text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, net
AS $$
DECLARE
  v_key text; v_sender text; v_name text; req_id bigint;
BEGIN
  SELECT value INTO v_key   FROM public.vault_secrets WHERE name = 'brevo_api_key';
  SELECT value INTO v_sender FROM public.vault_secrets WHERE name = 'brevo_sender_email';
  SELECT value INTO v_name   FROM public.vault_secrets WHERE name = 'brevo_sender_name';
  IF v_key IS NULL OR v_sender IS NULL THEN RETURN -1; END IF;
  req_id := net.http_post(
    'https://api.brevo.com/v3/smtp/email'::text,
    jsonb_build_object(
      'sender', jsonb_build_object('name', COALESCE(v_name, 'Safex'), 'email', v_sender),
      'to', jsonb_build_array(jsonb_build_object('email', p_to_email, 'name', COALESCE(NULLIF(p_to_name, ''), 'Safex User'))),
      'subject', p_subject,
      'htmlContent', p_html,
      'textContent', 'Your Safex verification code has been sent to this email.'
    ),
    '{}'::jsonb,
    jsonb_build_object(
      'api-key', v_key,
      'content-type', 'application/json',
      'accept', 'application/json'
    ),
    8000
  );
  RETURN req_id;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_brevo_send(text, text, text, text) FROM PUBLIC;

-- ── 4. RPC: OTP request (login Step 4) ──
CREATE OR REPLACE FUNCTION public.safex_request_email_otp(p_username text, p_login_type text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, net
AS $$
DECLARE
  rec RECORD;
  code text;
  last_req timestamptz;
  v_name text;
BEGIN
  IF p_username IS NULL OR p_login_type IS NULL THEN
    RETURN json_build_object('ok', false, 'message', 'invalid');
  END IF;

  SELECT u.id, u.username, u.full_name, u.email, u.role
    INTO rec
    FROM public.users u
   WHERE u.username = p_username
     AND u.status = 'active'
     AND u.login_type = p_login_type
     AND u.login_type <> 'Conduct DM'   -- DM: OTP nahi
     AND u.email IS NOT NULL
   LIMIT 1;
  IF rec IS NULL THEN
    RETURN json_build_object('ok', false, 'message', 'user_not_found');
  END IF;

  -- 🔁 Rate limit: 30 seconds per user
  SELECT created_at INTO last_req
    FROM public.user_otps
   WHERE user_id = rec.id
   ORDER BY id DESC LIMIT 1;
  IF last_req IS NOT NULL AND now() - last_req < interval '30 seconds' THEN
    RETURN json_build_object('ok', false, 'message', 'rate_limited', 'retry_after', 30 - EXTRACT(EPOCH FROM (now() - last_req))::int);
  END IF;

  -- 🔢 6-digit code (crypto random) + salted hash store + 5-min expiry
  code := lpad((('x' || encode(extensions.gen_random_bytes(3), 'hex'))::bit(24)::int % 1000000)::text, 6, '0');
  INSERT INTO public.user_otps (user_id, otp_hash, salt, expires_at)
  SELECT rec.id,
         encode(extensions.digest(code || ':safex-otp:' || s.salt, 'sha256'::text), 'hex'),
         s.salt,
         now() + interval '5 minutes'
    FROM (SELECT extensions.gen_random_uuid()::text AS salt) s;

  -- 📧 Brevo se email (pg_net async)
  PERFORM public.safex_brevo_send(
    rec.email,
    COALESCE(NULLIF(rec.role, ''), rec.full_name, rec.username),
    'Safex — Email Verification Code',
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">' ||
    '<div style="background:#0f172a;padding:18px 24px"><span style="color:#f59e0b;font-weight:800;letter-spacing:2px">SAFEX</span> <span style="color:#94a3b8;font-size:12px">Security Verification</span></div>' ||
    '<div style="padding:24px">' ||
    '<p style="margin:0 0 6px;font-weight:700;color:#0f172a">Dear ' || COALESCE(NULLIF(regexp_replace(rec.role, '[<>]', '', 'g'), ''), regexp_replace(rec.full_name, '[<>]', '', 'g'), 'User') || ',</p>' ||
    '<p style="margin:0 0 18px;color:#475569;font-size:13px;line-height:1.6">Your password was verified. Enter this one-time code in the app to complete your login:</p>' ||
    '<div style="text-align:center;margin:20px 0"><span style="font-size:32px;font-weight:800;letter-spacing:10px;color:#0f172a;background:#fef3c7;border:1px dashed #f59e0b;padding:14px 22px;border-radius:12px">' || code || '</span></div>' ||
    '<p style="color:#64748b;font-size:12px;line-height:1.6">This code expires in <b>5 minutes</b>. If you did not attempt to login, ignore this email — your account is safe.</p>' ||
    '</div>' ||
    '<div style="background:#f8fafc;padding:12px 24px;color:#94a3b8;font-size:11px">Safex • EMVEESS Infraventures Pvt. Ltd. — automated security email</div></div>'
  );

  RETURN json_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.safex_request_email_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_request_email_otp(text, text) TO anon;

-- ── 5. RPC: OTP verify (one-time, 5-min expiry) ──
CREATE OR REPLACE FUNCTION public.safex_verify_email_otp(p_username text, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  rec RECORD;
  v_row RECORD;
BEGIN
  IF p_username IS NULL OR p_code IS NULL OR length(p_code) <> 6 OR p_code !~ '^[0-9]{6}$' THEN
    RETURN false;
  END IF;
  SELECT u.id INTO rec
    FROM public.users u
   WHERE u.username = p_username AND u.status = 'active'
   LIMIT 1;
  IF rec IS NULL THEN RETURN false; END IF;

  FOR v_row IN
    SELECT id, otp_hash, salt FROM public.user_otps
     WHERE user_id = rec.id AND used = false AND expires_at > now()
     ORDER BY id DESC LIMIT 5
  LOOP
    IF v_row.otp_hash = encode(extensions.digest(p_code || ':safex-otp:' || v_row.salt, 'sha256'::text), 'hex') THEN
      UPDATE public.user_otps SET used = true WHERE id = v_row.id;
      -- purane pending codes expire karo (one-time use, replay block)
      UPDATE public.user_otps SET used = true
       WHERE user_id = rec.id AND used = false AND id <> v_row.id;
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.safex_verify_email_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safex_verify_email_otp(text, text) TO anon;

COMMIT;COMMIT;
