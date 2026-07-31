-- Reset / ensure admin@safeworkglobal.com for /admin/login
--
-- Password is NOT stored in this repo. Before running:
--   select set_config('app.admin_bootstrap_password', 'YOUR_STRONG_PASSWORD', false);
-- Then run this script in Supabase / Lovable SQL Editor.

DO $$
DECLARE
  v_uid uuid;
  v_email text := 'admin@safeworkglobal.com';
  v_pass text := current_setting('app.admin_bootstrap_password', true);
BEGIN
  IF v_pass IS NULL OR length(v_pass) < 8 THEN
    RAISE EXCEPTION
      'Set a strong password first: select set_config(''app.admin_bootstrap_password'', ''YOUR_STRONG_PASSWORD'', false);';
  END IF;

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
      jsonb_build_object('full_name', 'SafeWork Admin', 'role', 'admin'),
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

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_uid, v_email, 'SafeWork Admin')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = coalesce(public.profiles.full_name, EXCLUDED.full_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::app_role)
  ON CONFLICT DO NOTHING;
END $$;

SELECT id, email, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
WHERE lower(email) = 'admin@safeworkglobal.com';
