-- Unified auth continue: backend is the source of truth for account existence.
-- Returns only the next step (no user id, profile, or password details).
-- Does not merge accounts when mobile and email belong to different users.

CREATE TABLE IF NOT EXISTS public.auth_continue_attempts (
  lookup_key text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_continue_attempts_key_at_idx
  ON public.auth_continue_attempts (lookup_key, attempted_at DESC);

ALTER TABLE public.auth_continue_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_continue_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.auth_continue_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.auth_continue(
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_raw text := lower(trim(coalesce(p_email, '')));
  phone_raw text := trim(coalesce(p_phone, ''));
  digits text := right(regexp_replace(phone_raw, '\D', '', 'g'), 10);
  role_raw text := lower(trim(coalesce(p_role, '')));
  v_lookup_key text;
  attempt_count integer;
  phone_ids uuid[];
  email_ids uuid[];
  phone_id uuid;
  email_id uuid;
  matched_id uuid;
  matched_role text;
  portal text;
BEGIN
  IF email_raw = '' AND digits = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'empty'
    );
  END IF;

  IF email_raw <> '' AND position('@' in email_raw) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_email'
    );
  END IF;

  IF phone_raw <> '' AND length(digits) <> 10 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_mobile'
    );
  END IF;

  IF role_raw NOT IN ('worker', 'employer', 'partner') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'ERROR',
      'error', 'invalid_role'
    );
  END IF;

  v_lookup_key := md5(role_raw || '|' || email_raw || '|' || digits);

  DELETE FROM public.auth_continue_attempts
  WHERE lookup_key = v_lookup_key
    AND attempted_at < now() - interval '15 minutes';

  INSERT INTO public.auth_continue_attempts (lookup_key) VALUES (v_lookup_key);

  SELECT count(*)::integer INTO attempt_count
  FROM public.auth_continue_attempts
  WHERE lookup_key = v_lookup_key
    AND attempted_at > now() - interval '15 minutes';

  IF attempt_count > 25 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'exists', false,
      'next_step', 'RATE_LIMITED'
    );
  END IF;

  IF length(digits) = 10 THEN
    SELECT coalesce(array_agg(DISTINCT uid), ARRAY[]::uuid[])
    INTO phone_ids
    FROM (
      SELECT p.id AS uid
      FROM public.profiles p
      WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = digits
      UNION
      SELECT u.id AS uid
      FROM auth.users u
      WHERE lower(u.email) IN (
        'm' || digits || '@workers.safeworkglobal.app',
        'emitra' || digits || '@partners.safeworkglobal.app'
      )
    ) phone_hits;
  ELSE
    phone_ids := ARRAY[]::uuid[];
  END IF;

  IF email_raw <> '' THEN
    SELECT coalesce(array_agg(DISTINCT uid), ARRAY[]::uuid[])
    INTO email_ids
    FROM (
      SELECT u.id AS uid
      FROM auth.users u
      WHERE lower(u.email) = email_raw
      UNION
      SELECT p.id AS uid
      FROM public.profiles p
      WHERE lower(trim(coalesce(p.email, ''))) = email_raw
      UNION
      SELECT wv.user_id AS uid
      FROM public.worker_verification wv
      WHERE lower(trim(coalesce(wv.email, ''))) = email_raw
    ) email_hits;
  ELSE
    email_ids := ARRAY[]::uuid[];
  END IF;

  IF coalesce(array_length(phone_ids, 1), 0) > 1
     OR coalesce(array_length(email_ids, 1), 0) > 1 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'ACCOUNT_CONFLICT'
    );
  END IF;

  phone_id := CASE WHEN coalesce(array_length(phone_ids, 1), 0) = 1 THEN phone_ids[1] ELSE NULL END;
  email_id := CASE WHEN coalesce(array_length(email_ids, 1), 0) = 1 THEN email_ids[1] ELSE NULL END;

  IF phone_id IS NOT NULL AND email_id IS NOT NULL AND phone_id <> email_id THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'ACCOUNT_CONFLICT'
    );
  END IF;

  matched_id := coalesce(phone_id, email_id);

  IF matched_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'exists', false,
      'next_step', 'SIGNUP'
    );
  END IF;

  SELECT ur.role::text INTO matched_role
  FROM public.user_roles ur
  WHERE ur.user_id = matched_id
  ORDER BY CASE ur.role::text
    WHEN 'worker' THEN 1
    WHEN 'employer' THEN 2
    WHEN 'partner' THEN 3
    ELSE 4
  END
  LIMIT 1;

  IF matched_role IS NOT NULL AND matched_role <> role_raw THEN
    portal := CASE
      WHEN matched_role IN ('worker', 'employer', 'partner') THEN matched_role
      ELSE NULL
    END;
    RETURN jsonb_build_object(
      'ok', true,
      'exists', true,
      'next_step', 'WRONG_PORTAL',
      'portal', portal
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'exists', true,
    'next_step', 'LOGIN'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auth_continue(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_continue(text, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.auth_continue(text, text, text) IS
  'Account-existence check for unified auth. Returns next_step only; never merges accounts.';
