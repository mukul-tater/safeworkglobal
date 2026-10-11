-- One person, one identity. Email and mobile cannot be reused across worker,
-- employer, and partner accounts. Signup raises a specific error for each.

CREATE OR REPLACE FUNCTION public.signup_email_taken(
  p_email text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  WITH needle AS (
    SELECT lower(trim(coalesce(p_email, ''))) AS email
  )
  SELECT EXISTS (
    SELECT 1
    FROM needle n
    WHERE n.email <> ''
      AND (
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE lower(u.email) = n.email
            AND (p_except_user_id IS NULL OR u.id <> p_except_user_id)
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE lower(trim(coalesce(p.email, ''))) = n.email
            AND (p_except_user_id IS NULL OR p.id <> p_except_user_id)
        )
        OR EXISTS (
          SELECT 1 FROM public.worker_verification wv
          WHERE lower(trim(coalesce(wv.email, ''))) = n.email
            AND (p_except_user_id IS NULL OR wv.user_id <> p_except_user_id)
        )
        OR EXISTS (
          SELECT 1 FROM public.partner_profiles pp
          WHERE lower(trim(coalesce(pp.email, ''))) = n.email
            AND (p_except_user_id IS NULL OR pp.user_id <> p_except_user_id)
        )
        OR EXISTS (
          SELECT 1
          FROM public.partner_profiles_ext ppe
          JOIN public.partners pt ON pt.id = ppe.partner_id
          WHERE lower(trim(coalesce(ppe.email, ''))) = n.email
            AND (p_except_user_id IS NULL OR pt.user_id IS NULL OR pt.user_id <> p_except_user_id)
        )
        OR EXISTS (
          SELECT 1 FROM public.employer_profiles ep
          WHERE lower(trim(coalesce(ep.business_email, ''))) = n.email
            AND (p_except_user_id IS NULL OR ep.user_id <> p_except_user_id)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.signup_mobile_taken(
  p_phone text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
BEGIN
  IF length(digits) <> 10 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = digits
      AND (p_except_user_id IS NULL OR p.id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.partner_profiles pp
    WHERE (
      right(regexp_replace(coalesce(pp.mobile, ''), '\D', '', 'g'), 10) = digits
      OR right(regexp_replace(coalesce(pp.whatsapp, ''), '\D', '', 'g'), 10) = digits
    )
    AND (p_except_user_id IS NULL OR pp.user_id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.partner_profiles_ext ppe
    JOIN public.partners pt ON pt.id = ppe.partner_id
    WHERE right(regexp_replace(coalesce(ppe.mobile, ''), '\D', '', 'g'), 10) = digits
      AND (p_except_user_id IS NULL OR pt.user_id IS NULL OR pt.user_id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) IN (
      'm' || digits || '@workers.safeworkglobal.app',
      'emitra' || digits || '@partners.safeworkglobal.app'
    )
    AND (p_except_user_id IS NULL OR u.id <> p_except_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_signup_identity_available(
  p_email text,
  p_phone text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
BEGIN
  IF v_email <> '' AND public.signup_email_taken(v_email, p_except_user_id) THEN
    IF v_email ~ '^m[6-9][0-9]{9}@workers\.safeworkglobal\.app$'
       OR v_email ~ '^emitra[6-9][0-9]{9}@partners\.safeworkglobal\.app$' THEN
      RAISE EXCEPTION 'mobile already registered';
    END IF;
    RAISE EXCEPTION 'email already registered';
  END IF;

  IF length(v_phone) = 10 AND public.signup_mobile_taken(v_phone, p_except_user_id) THEN
    RAISE EXCEPTION 'mobile already registered';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_email_taken(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signup_mobile_taken(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_signup_identity_available(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.signup_email_taken(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.signup_mobile_taken(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_signup_identity_available(text, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.block_duplicate_signup_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text := coalesce(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
BEGIN
  PERFORM public.assert_signup_identity_available(NEW.email, v_phone, NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_duplicate_signup_identity ON auth.users;
CREATE TRIGGER block_duplicate_signup_identity
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_duplicate_signup_identity();

CREATE OR REPLACE FUNCTION public.guard_profile_identity_unique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email THEN
    IF public.signup_email_taken(NEW.email, NEW.id) THEN
      RAISE EXCEPTION 'email already registered';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone THEN
    IF public.signup_mobile_taken(NEW.phone, NEW.id) THEN
      RAISE EXCEPTION 'mobile already registered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_identity_unique ON public.profiles;
CREATE TRIGGER trg_guard_profile_identity_unique
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_identity_unique();

CREATE OR REPLACE FUNCTION public.guard_partner_profile_identity_unique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email THEN
    IF public.signup_email_taken(NEW.email, NEW.user_id) THEN
      RAISE EXCEPTION 'email already registered';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.mobile IS DISTINCT FROM OLD.mobile OR NEW.whatsapp IS DISTINCT FROM OLD.whatsapp THEN
    IF public.signup_mobile_taken(NEW.mobile, NEW.user_id)
       OR public.signup_mobile_taken(NEW.whatsapp, NEW.user_id) THEN
      RAISE EXCEPTION 'mobile already registered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_partner_profile_identity_unique ON public.partner_profiles;
CREATE TRIGGER trg_guard_partner_profile_identity_unique
  BEFORE INSERT OR UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_partner_profile_identity_unique();

CREATE OR REPLACE FUNCTION public.guard_partner_ext_identity_unique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT pt.user_id INTO v_uid
  FROM public.partners pt
  WHERE pt.id = NEW.partner_id;

  IF TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email THEN
    IF public.signup_email_taken(NEW.email, v_uid) THEN
      RAISE EXCEPTION 'email already registered';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.mobile IS DISTINCT FROM OLD.mobile THEN
    IF public.signup_mobile_taken(NEW.mobile, v_uid) THEN
      RAISE EXCEPTION 'mobile already registered';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_partner_ext_identity_unique ON public.partner_profiles_ext;
CREATE TRIGGER trg_guard_partner_ext_identity_unique
  BEFORE INSERT OR UPDATE ON public.partner_profiles_ext
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_partner_ext_identity_unique();


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

  PERFORM public.assert_signup_identity_available(v_email, v_phone, NULL);

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
    RAISE EXCEPTION 'email already registered';
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

  PERFORM public.assert_signup_identity_available(v_email, v_phone, NULL);

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
    RAISE EXCEPTION 'email already registered';
END;
$$;

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

  PERFORM public.assert_signup_identity_available(v_email, NULL, NULL);

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
    RAISE EXCEPTION 'email already registered';
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_continue(
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_raw text := lower(trim(coalesce(p_email, '')));
  phone_raw text := trim(coalesce(p_phone, ''));
  digits text := right(regexp_replace(phone_raw, '\D', '', 'g'), 10);
  role_raw text := lower(trim(coalesce(p_role, '')));
  v_lookup_key text;
  attempt_count integer;
  phone_ids uuid[];
  email_ids uuid[];
  phone_id uuid;
  email_id uuid;
  matched_id uuid;
  matched_role text;
  portal text;
BEGIN
  IF email_raw = '' AND digits = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'empty'
    );
  END IF;

  IF email_raw <> '' AND position('@' in email_raw) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_email'
    );
  END IF;

  IF phone_raw <> '' AND length(digits) <> 10 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_mobile'
    );
  END IF;

  IF role_raw NOT IN ('worker', 'employer', 'partner') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_role'
    );
  END IF;

  v_lookup_key := md5(role_raw || '|' || email_raw || '|' || digits);

  DELETE FROM public.auth_continue_attempts
  WHERE lookup_key = v_lookup_key
    AND attempted_at < now() - interval '15 minutes';

  INSERT INTO public.auth_continue_attempts (lookup_key) VALUES (v_lookup_key);

  SELECT count(*)::integer INTO attempt_count
  FROM public.auth_continue_attempts
  WHERE lookup_key = v_lookup_key
    AND attempted_at > now() - interval '15 minutes';

  IF attempt_count > 25 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'RATE_LIMITED'
    );
  END IF;

  IF length(digits) = 10 THEN
    SELECT coalesce(array_agg(DISTINCT uid), ARRAY[]::uuid[])
    INTO phone_ids
    FROM (
      SELECT p.id AS uid
      FROM public.profiles p
      WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = digits
      UNION
      SELECT u.id AS uid
      FROM auth.users u
      WHERE lower(u.email) IN (
        'm' || digits || '@workers.safeworkglobal.app',
        'emitra' || digits || '@partners.safeworkglobal.app'
      )
      UNION
      SELECT pp.user_id AS uid
      FROM public.partner_profiles pp
      WHERE right(regexp_replace(coalesce(pp.mobile, ''), '\D', '', 'g'), 10) = digits
         OR right(regexp_replace(coalesce(pp.whatsapp, ''), '\D', '', 'g'), 10) = digits
      UNION
      SELECT pt.user_id AS uid
      FROM public.partner_profiles_ext ppe
      JOIN public.partners pt ON pt.id = ppe.partner_id
      WHERE right(regexp_replace(coalesce(ppe.mobile, ''), '\D', '', 'g'), 10) = digits
    ) phone_hits;
  ELSE
    phone_ids := ARRAY[]::uuid[];
  END IF;

  IF email_raw <> '' THEN
    SELECT coalesce(array_agg(DISTINCT uid), ARRAY[]::uuid[])
    INTO email_ids
    FROM (
      SELECT u.id AS uid
      FROM auth.users u
      WHERE lower(u.email) = email_raw
      UNION
      SELECT p.id AS uid
      FROM public.profiles p
      WHERE lower(trim(coalesce(p.email, ''))) = email_raw
      UNION
      SELECT wv.user_id AS uid
      FROM public.worker_verification wv
      WHERE lower(trim(coalesce(wv.email, ''))) = email_raw
      UNION
      SELECT pp.user_id AS uid
      FROM public.partner_profiles pp
      WHERE lower(trim(coalesce(pp.email, ''))) = email_raw
      UNION
      SELECT pt.user_id AS uid
      FROM public.partner_profiles_ext ppe
      JOIN public.partners pt ON pt.id = ppe.partner_id
      WHERE lower(trim(coalesce(ppe.email, ''))) = email_raw
      UNION
      SELECT ep.user_id AS uid
      FROM public.employer_profiles ep
      WHERE lower(trim(coalesce(ep.business_email, ''))) = email_raw
    ) email_hits;
  ELSE
    email_ids := ARRAY[]::uuid[];
  END IF;

  IF coalesce(array_length(phone_ids, 1), 0) > 1
     OR coalesce(array_length(email_ids, 1), 0) > 1 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'ACCOUNT_CONFLICT'
    );
  END IF;

  phone_id := CASE WHEN coalesce(array_length(phone_ids, 1), 0) = 1 THEN phone_ids[1] ELSE NULL END;
  email_id := CASE WHEN coalesce(array_length(email_ids, 1), 0) = 1 THEN email_ids[1] ELSE NULL END;

  IF phone_id IS NOT NULL AND email_id IS NOT NULL AND phone_id <> email_id THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'ACCOUNT_CONFLICT'
    );
  END IF;

  matched_id := coalesce(phone_id, email_id);

  IF matched_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', false,
      'next_step', 'SIGNUP'
    );
  END IF;

  SELECT ur.role::text INTO matched_role
  FROM public.user_roles ur
  WHERE ur.user_id = matched_id
  ORDER BY CASE ur.role::text
    WHEN 'worker' THEN 1
    WHEN 'employer' THEN 2
    WHEN 'partner' THEN 3
    ELSE 4
  END
  LIMIT 1;

  IF matched_role IS NOT NULL AND matched_role <> role_raw THEN
    portal := CASE
      WHEN matched_role IN ('worker', 'employer', 'partner') THEN matched_role
      ELSE NULL
    END;
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'WRONG_PORTAL',
      'portal', portal
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'exists', true,
    'next_step', 'LOGIN'
  );
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
REVOKE ALL ON FUNCTION public.create_email_verified_employer_account(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_email_verified_employer_account(text, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.auth_continue(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_continue(text, text, text) TO anon, authenticated;
