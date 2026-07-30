-- Test worker for portal / GCC journey QA
-- Email:    kailash@safeworkglobal.com
-- Password: Worker@2024!
--
-- Run in Supabase Dashboard → SQL Editor (project etpiadoqryvtlpmiuxia).
-- Note: this sets the account to role "worker" (removes admin/partner/employer
-- for this email). Use admin@safeworkglobal.com for admin login.

DO $$
DECLARE
  v_uid uuid;
  v_email text := 'kailash@safeworkglobal.com';
  v_pass text := 'Worker@2024!';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email;

  IF v_uid IS NULL THEN
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
      extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Kailash Test Worker', 'role', 'worker'),
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
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('full_name', 'Kailash Test Worker', 'role', 'worker'),
      updated_at = now(),
      banned_until = null
    WHERE id = v_uid;

    IF NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = v_uid AND provider = 'email'
    ) THEN
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
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, mobile_verified)
  VALUES (v_uid, v_email, 'Kailash Test Worker', '9999990001', true)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = coalesce(public.profiles.phone, EXCLUDED.phone),
      mobile_verified = true;

  DELETE FROM public.user_roles WHERE user_id = v_uid AND role <> 'worker'::app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'worker'::app_role)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.worker_profiles (user_id, country, nationality)
  VALUES (v_uid, 'India', 'India')
  ON CONFLICT (user_id) DO NOTHING;

  -- Optional: seed verification row if migration is applied
  BEGIN
    INSERT INTO public.worker_verification (user_id, stage, email)
    VALUES (v_uid, 'essentials', v_email)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'worker_verification table missing — run migration 20260730120000_worker_verification_pipeline.sql';
  END;
END $$;

-- Confirm
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS confirmed,
  p.mobile_verified,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE lower(u.email) = 'kailash@safeworkglobal.com';
