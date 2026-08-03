-- Mobile login must resolve to the real Auth email (not only synthetic m…@workers…).
-- New signups use contact email as Auth email; keep synthetic fallback for legacy accounts.

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

  -- Mobile path: look up profile by phone → Auth email; else legacy synthetic.
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

    -- Legacy accounts created with synthetic mobile auth email
    RETURN 'm' || digits || '@workers.safeworkglobal.app';
  END IF;

  IF position('@' in raw) = 0 THEN
    RETURN NULL;
  END IF;

  -- Auth users email
  SELECT u.email INTO auth_email
  FROM auth.users u
  WHERE lower(u.email) = raw
  LIMIT 1;
  IF auth_email IS NOT NULL THEN
    RETURN auth_email;
  END IF;

  -- Contact email on profiles
  SELECT u.email INTO auth_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(trim(p.email)) = raw
  LIMIT 1;
  IF auth_email IS NOT NULL THEN
    RETURN auth_email;
  END IF;

  -- Contact email saved on worker_verification essentials
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
