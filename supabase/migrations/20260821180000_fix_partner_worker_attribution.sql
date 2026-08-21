-- Partner-created workers were missing from My Workers.
-- handle_new_user inserts worker_profiles as organic; partner_attach then UPDATEs
-- source_partner_id / source_type, but prevent_worker_profile_privileged_changes
-- blocked that update. The listing RPC only returns attributed workers.

CREATE OR REPLACE FUNCTION public.prevent_worker_profile_privileged_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('safework.allow_partner_worker_attach', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL
     OR pg_trigger_depth() > 1
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    RAISE EXCEPTION 'Review status can only be changed by SafeWork staff.';
  END IF;

  IF NEW.source_type IS DISTINCT FROM OLD.source_type
     OR NEW.source_partner_id IS DISTINCT FROM OLD.source_partner_id THEN
    RAISE EXCEPTION 'Worker source attribution cannot be changed.';
  END IF;

  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     AND NEW.kyc_status <> 'submitted' THEN
    RAISE EXCEPTION 'Verification status can only be changed by SafeWork staff.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.partner_attach_registered_worker(
  p_worker_user_id uuid,
  p_full_name text,
  p_mobile text,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_org_id uuid;
  v_source text;
  v_digits text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(auth.uid(), 'partner') THEN
    RAISE EXCEPTION 'Only partners can attach registered workers';
  END IF;
  IF p_worker_user_id IS NULL THEN
    RAISE EXCEPTION 'Worker id is required';
  END IF;

  v_digits := regexp_replace(COALESCE(p_mobile, ''), '\D', '', 'g');
  IF length(v_digits) >= 10 THEN
    v_digits := right(v_digits, 10);
  END IF;

  SELECT id INTO v_pp_id
  FROM public.partner_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  SELECT id INTO v_org_id
  FROM public.partners
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_pp_id IS NULL AND v_org_id IS NULL THEN
    RAISE EXCEPTION 'No partner organisation found for this account';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.worker_profiles wp
    WHERE wp.user_id = p_worker_user_id
      AND (
        (wp.source_partner_id IS NOT NULL AND wp.source_partner_id IS DISTINCT FROM v_pp_id)
        OR (wp.added_by_org_id IS NOT NULL AND wp.added_by_org_id IS DISTINCT FROM v_org_id)
      )
  ) THEN
    RAISE EXCEPTION 'Worker is already attributed to another partner';
  END IF;

  v_source := CASE WHEN v_pp_id IS NOT NULL THEN 'emitra' ELSE 'partner' END;

  -- Let this UPDATE set source/review fields that workers cannot self-edit.
  PERFORM set_config('safework.allow_partner_worker_attach', 'on', true);

  INSERT INTO public.worker_profiles (
    user_id, country, nationality, source_type, source_partner_id, added_by_org_id,
    onboarded_at, review_status
  )
  VALUES (
    p_worker_user_id,
    'India',
    'India',
    v_source,
    v_pp_id,
    v_org_id,
    now(),
    CASE WHEN v_source = 'emitra' THEN 'approved' ELSE 'not_required' END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    source_type = CASE
      WHEN public.worker_profiles.source_type IN ('organic') THEN EXCLUDED.source_type
      ELSE public.worker_profiles.source_type
    END,
    source_partner_id = COALESCE(public.worker_profiles.source_partner_id, EXCLUDED.source_partner_id),
    added_by_org_id = COALESCE(public.worker_profiles.added_by_org_id, EXCLUDED.added_by_org_id),
    onboarded_at = COALESCE(public.worker_profiles.onboarded_at, EXCLUDED.onboarded_at),
    review_status = CASE
      WHEN public.worker_profiles.review_status IN ('not_required', 'pending')
        THEN EXCLUDED.review_status
      ELSE public.worker_profiles.review_status
    END;

  UPDATE public.profiles
     SET full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
         phone = COALESCE(NULLIF(v_digits, ''), phone),
         email = COALESCE(NULLIF(lower(TRIM(p_email)), ''), email),
         mobile_verified = true
   WHERE id = p_worker_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.partner_attach_registered_worker(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_attach_registered_worker(uuid, text, text, text) TO authenticated;
