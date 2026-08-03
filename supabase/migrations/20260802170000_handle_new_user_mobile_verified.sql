-- When signup metadata says mobile was OTP-verified, persist it on profiles.
-- Fixes workers bouncing to /worker/bind-mobile after Firebase OTP signup.
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
  v_mobile_verified boolean;
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
  v_mobile_verified := COALESCE(
    (NEW.raw_user_meta_data->>'mobile_verified')::boolean,
    false
  );

  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, mobile_verified)
  VALUES (NEW.id, NEW.email, v_full_name, v_phone, v_avatar_url, v_mobile_verified)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    mobile_verified = public.profiles.mobile_verified OR EXCLUDED.mobile_verified,
    updated_at = now();

  -- Only allow self-assignment of non-admin roles. Silently ignore admin
  -- attempts so signup still succeeds without privilege escalation.
  IF v_role IS NOT NULL AND v_role IN ('worker', 'employer', 'agent') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF v_role = 'employer' THEN
      INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'worker' THEN
      INSERT INTO public.worker_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'agent' THEN
      INSERT INTO public.agent_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
