-- Create / reset demo Admin + Interviewer accounts for local / Lovable testing.
-- Run in Supabase → SQL Editor (Lovable Cloud).
--
-- Admin:       admin@safeworkglobal.demo       / DemoAdmin@1234
-- Interviewer: interviewer@safeworkglobal.demo / DemoInterview@1234
--
-- Login: /admin/login (admin) — interviewer portal can use same auth until dedicated UI ships;
--        assign role in user_roles so has_role(..., 'interviewer') works.

DO $$
DECLARE
  v_admin_uid uuid;
  v_int_uid uuid;
  v_admin_email text := 'admin@safeworkglobal.demo';
  v_int_email text := 'interviewer@safeworkglobal.demo';
  v_admin_pass text := 'DemoAdmin@1234';
  v_int_pass text := 'DemoInterview@1234';
BEGIN
  -- Requires migration 20260803121000_add_interviewer_app_role.sql first.
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'interviewer'
  ) THEN
    RAISE EXCEPTION
      'Run migration 20260803121000_add_interviewer_app_role.sql first (adds interviewer to app_role).';
  END IF;

  -- ——— Admin ———
  SELECT id INTO v_admin_uid FROM auth.users WHERE lower(email) = v_admin_email;
  IF v_admin_uid IS NULL THEN
    v_admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_uid,
      'authenticated',
      'authenticated',
      v_admin_email,
      extensions.crypt(v_admin_pass, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'SafeWork Admin', 'role', 'admin'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_admin_uid,
      jsonb_build_object('sub', v_admin_uid::text, 'email', v_admin_email),
      'email', v_admin_uid::text, now(), now(), now()
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = extensions.crypt(v_admin_pass, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_admin_uid;
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_uid AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_admin_uid,
        jsonb_build_object('sub', v_admin_uid::text, 'email', v_admin_email),
        'email', v_admin_uid::text, now(), now(), now()
      );
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_admin_uid, v_admin_email, 'SafeWork Admin')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_uid, 'admin'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;

  -- ——— Interviewer ———
  SELECT id INTO v_int_uid FROM auth.users WHERE lower(email) = v_int_email;
  IF v_int_uid IS NULL THEN
    v_int_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_int_uid,
      'authenticated',
      'authenticated',
      v_int_email,
      extensions.crypt(v_int_pass, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'SafeWork Interviewer', 'role', 'interviewer'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_int_uid,
      jsonb_build_object('sub', v_int_uid::text, 'email', v_int_email),
      'email', v_int_uid::text, now(), now(), now()
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = extensions.crypt(v_int_pass, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_int_uid;
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_int_uid AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_int_uid,
        jsonb_build_object('sub', v_int_uid::text, 'email', v_int_email),
        'email', v_int_uid::text, now(), now(), now()
      );
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_int_uid, v_int_email, 'SafeWork Interviewer')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_int_uid, 'interviewer'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'interviewer'::app_role;
END $$;
