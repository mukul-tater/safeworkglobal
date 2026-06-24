
-- 1) Seed the default admin auth user if missing, then ensure admin role
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'admin@safeworkglobal.com';

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid,
      'authenticated','authenticated','admin@safeworkglobal.com',
      extensions.crypt('Admin@2026!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','SafeWork Global Admin','role','admin'),
      now(), now(),'','','','');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email','admin@safeworkglobal.com'),
      'email', v_uid::text, now(), now(), now());
  ELSE
    -- Reset password to known value so admin can recover
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('Admin@2026!', extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, mobile_verified)
  VALUES (v_uid, 'admin@safeworkglobal.com', 'SafeWork Global Admin', true)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 2) Server-side guard: only allow password reset for whitelisted admin emails
CREATE OR REPLACE FUNCTION public.is_whitelisted_admin_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(p_email) IN (
    'admin@safeworkglobal.com',
    'ops@safeworkglobal.com',
    'admin@safeworkglobal.demo',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com',
    'gurpreetsinghelectrician@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_whitelisted_admin_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_whitelisted_admin_email(text) TO anon, authenticated;
