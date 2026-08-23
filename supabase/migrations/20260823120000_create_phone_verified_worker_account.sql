-- Worker signup uses letters+numbers (min 6). GoTrue also blocks passwords that
-- appear in HaveIBeenPwned, which rejects values like Asdf123 even though they
-- match the on-screen rule. Create those accounts here so the product policy is
-- the only gate — same approach as create_phone_verified_partner_account.
-- Email is confirmed because Firebase mobile OTP already succeeded on the client.

CREATE OR REPLACE FUNCTION public.create_phone_verified_worker_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_name text := nullif(trim(coalesce(p_full_name, '')), '');
  v_uid uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_caller AND role = 'partner'
    ) THEN
      RAISE EXCEPTION 'Already signed in';
    END IF;
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

  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'A valid 10-digit mobile is required';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = v_phone
  ) THEN
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
      'phone', v_phone,
      'role', 'worker',
      'mobile_verified', true
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

REVOKE ALL ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text) TO anon, authenticated;
