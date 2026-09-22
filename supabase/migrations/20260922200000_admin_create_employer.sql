-- Admin can create an employer login without the public email-OTP signup.

CREATE OR REPLACE FUNCTION public.admin_create_employer(
  p_email text,
  p_password text,
  p_full_name text,
  p_company_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(coalesce(p_full_name, '')), '');
  v_company text := nullif(trim(coalesce(p_company_name, '')), '');
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_uid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF v_email IS NULL OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Contact name is required';
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
      'full_name', v_name,
      'role', 'employer',
      'phone', v_phone,
      'mobile_verified', (v_phone IS NOT NULL)
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

  UPDATE public.employer_profiles
  SET
    company_name = COALESCE(v_company, company_name),
    contact_full_name = COALESCE(v_name, contact_full_name),
    business_email = COALESCE(v_email, business_email),
    uae_mobile = COALESCE(v_phone, uae_mobile),
    updated_at = now()
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'employer'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.employer_profiles (
      user_id, company_name, contact_full_name, business_email, uae_mobile
    ) VALUES (
      v_uid, v_company, v_name, v_email, v_phone
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_uid,
    'email', v_email
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_employer(text, text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_employer(text, text, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_employer(text, text, text, text, text)
  TO service_role;
