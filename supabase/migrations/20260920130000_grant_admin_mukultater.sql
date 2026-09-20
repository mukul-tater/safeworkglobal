-- Create / reset the Mukul Tater admin account.
--
-- Email:    mukultater@safeworkglobal.com
-- Password: MukulTater99500
-- Login:    /admin/login

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(NEW.email) = 'mukultater@safeworkglobal.com' THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.id
       AND role IS DISTINCT FROM 'admin'::app_role;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();

DO $$
DECLARE
  v_uid uuid;
  v_email text := 'mukultater@safeworkglobal.com';
  v_password text := 'MukulTater99500';
  v_name text := 'Mukul Tater';
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
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name, 'role', 'admin'),
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
    UPDATE auth.users SET
      encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('full_name', v_name, 'role', 'admin'),
      updated_at = now()
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
  VALUES (v_uid, v_email, v_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = now();

  DELETE FROM public.user_roles
   WHERE user_id = v_uid
     AND role IS DISTINCT FROM 'admin'::app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::app_role)
  ON CONFLICT DO NOTHING;
END $$;
