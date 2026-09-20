-- Grant admin to Mukul Tater.
-- Admin is not minted from a client RPC; this trigger + backfill is the
-- explicit grant for the founder inbox.

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
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = 'mukultater@safeworkglobal.com';

  IF v_uid IS NULL THEN
    RAISE NOTICE 'No auth user for mukultater@safeworkglobal.com yet; admin will be granted on signup.';
    RETURN;
  END IF;

  DELETE FROM public.user_roles
   WHERE user_id = v_uid
     AND role IS DISTINCT FROM 'admin'::app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::app_role)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_uid, 'mukultater@safeworkglobal.com', 'Mukul Tater')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = now();
END $$;
