-- Phase 0: restrict auto-admin promotion to production admin accounts only.

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN (
    'gurpreetsinghelectrician@gmail.com',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();

CREATE OR REPLACE FUNCTION public.ensure_whitelisted_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(email) INTO v_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_email IS NULL OR v_email NOT IN (
    'gurpreetsinghelectrician@gmail.com',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_whitelisted_admin() TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN (
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
