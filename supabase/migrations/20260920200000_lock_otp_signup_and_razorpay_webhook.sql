-- Launch locks: signup only after server-verified Firebase OTP, clients cannot
-- tick mobile_verified, and Razorpay webhooks can complete payment idempotently.

-- ---------------------------------------------------------------------------
-- 1) Phone-verified account RPCs: service_role only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_phone text;
  v_role text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);
  v_role := NEW.raw_user_meta_data->>'role';

  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, mobile_verified)
  VALUES (NEW.id, NEW.email, v_full_name, v_phone, v_avatar_url, false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  IF v_role IS NOT NULL AND v_role IN ('worker', 'employer', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF v_role = 'employer' THEN
      INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'worker' THEN
      INSERT INTO public.worker_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'partner' THEN
      INSERT INTO public.partner_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS confirm_mobile_verified_auth_user ON auth.users;
DROP FUNCTION IF EXISTS public.confirm_mobile_verified_auth_user();

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

  UPDATE public.profiles
     SET mobile_verified = true, phone = v_phone, updated_at = now()
   WHERE id = v_uid;

  RETURN v_uid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_phone_verified_partner_account(
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
      'role', 'partner',
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

  UPDATE public.profiles
     SET mobile_verified = true, phone = v_phone, updated_at = now()
   WHERE id = v_uid;

  UPDATE public.partner_profiles
     SET mobile_verified = true
   WHERE user_id = v_uid;

  RETURN v_uid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

REVOKE ALL ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.guard_profile_mobile_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mobile_verified IS DISTINCT FROM OLD.mobile_verified
     AND NEW.mobile_verified IS TRUE
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    RAISE EXCEPTION 'Mobile verification must be completed via OTP';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_mobile_verified ON public.profiles;
CREATE TRIGGER trg_guard_profile_mobile_verified
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_mobile_verified();

-- ---------------------------------------------------------------------------
-- 2) Razorpay webhook idempotency (edge function uses service_role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  payment_id text,
  order_id text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.razorpay_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.razorpay_webhook_events TO service_role;
