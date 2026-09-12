-- eMitra kiosk workers must be able to sign in with mobile + password immediately.
-- 1) Default new emitra profiles to approved (OTP already verified at the centre).
-- 2) Backfill pending emitra workers to approved.
-- 3) Confirm Auth email so Confirm-email projects do not block signInWithPassword.
-- 4) Ensure resolve_worker_auth_email is live (maps mobile → real Auth email).

CREATE OR REPLACE FUNCTION public.set_emitra_worker_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_type = 'emitra' THEN
    IF NEW.review_status IS NULL OR NEW.review_status = 'not_required' THEN
      NEW.review_status := 'approved';
    END IF;
    IF NEW.onboarded_at IS NULL THEN
      NEW.onboarded_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.worker_profiles
SET review_status = 'approved'
WHERE source_type = 'emitra'
  AND review_status = 'pending';

UPDATE auth.users u
SET
  email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
  banned_until = NULL,
  raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('mobile_verified', true)
FROM public.worker_profiles wp
WHERE u.id = wp.user_id
  AND wp.source_type = 'emitra';

UPDATE public.profiles p
SET mobile_verified = true
FROM public.worker_profiles wp
WHERE p.id = wp.user_id
  AND wp.source_type = 'emitra'
  AND COALESCE(p.mobile_verified, false) = false;

-- Mobile login must resolve to the Auth email (real contact email or synthetic m…@workers…).
CREATE OR REPLACE FUNCTION public.resolve_worker_auth_email(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw text := lower(trim(coalesce(p_identifier, '')));
  digits text;
  auth_email text;
BEGIN
  IF raw = '' THEN
    RETURN NULL;
  END IF;

  digits := regexp_replace(raw, '\D', '', 'g');

  IF position('@' in raw) = 0 AND length(digits) >= 10 THEN
    digits := right(digits, 10);

    SELECT u.email INTO auth_email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = digits
    LIMIT 1;

    IF auth_email IS NOT NULL THEN
      RETURN auth_email;
    END IF;

    RETURN 'm' || digits || '@workers.safeworkglobal.app';
  END IF;

  IF position('@' in raw) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO auth_email
  FROM auth.users u
  WHERE lower(u.email) = raw
  LIMIT 1;
  IF auth_email IS NOT NULL THEN
    RETURN auth_email;
  END IF;

  SELECT u.email INTO auth_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(trim(p.email)) = raw
  LIMIT 1;
  IF auth_email IS NOT NULL THEN
    RETURN auth_email;
  END IF;

  SELECT u.email INTO auth_email
  FROM public.worker_verification wv
  JOIN auth.users u ON u.id = wv.user_id
  WHERE lower(trim(wv.email)) = raw
  LIMIT 1;

  RETURN auth_email;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_worker_auth_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_worker_auth_email(text) TO anon, authenticated;
