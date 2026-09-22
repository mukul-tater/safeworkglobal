-- Direct (email+password) signup must prove inbox ownership via a one-time code.
-- Google OAuth already verifies email. Partner/kiosk synthetic addresses skip this.

CREATE TABLE IF NOT EXISTS public.signup_email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  ticket_hash text,
  attempts integer NOT NULL DEFAULT 0,
  verified_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_email_otps_email_created_idx
  ON public.signup_email_otps (email, created_at DESC);

CREATE INDEX IF NOT EXISTS signup_email_otps_ticket_hash_idx
  ON public.signup_email_otps (ticket_hash)
  WHERE ticket_hash IS NOT NULL AND consumed_at IS NULL;

ALTER TABLE public.signup_email_otps ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.signup_email_otps FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.signup_email_otps TO service_role;

CREATE OR REPLACE FUNCTION public.create_email_verified_employer_account(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(coalesce(p_full_name, '')), '');
  v_uid uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Account creation must go through verified OTP';
  END IF;

  IF v_email IS NULL OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF p_password IS NULL
     OR length(p_password) < 6
     OR length(p_password) > 72
     OR p_password !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Use letters and numbers only, at least 6 characters. No spaces or symbols.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  v_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', coalesce(v_name, split_part(v_email, '@', 1)),
      'role', 'employer'
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_uid::text,
    now(),
    now(),
    now()
  );

  RETURN v_uid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

REVOKE ALL ON FUNCTION public.create_email_verified_employer_account(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_email_verified_employer_account(text, text, text)
  TO service_role;
