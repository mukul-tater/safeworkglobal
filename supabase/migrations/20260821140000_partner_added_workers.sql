-- Link workers registered by any partner org (SSVN, ITI, SRN, consultant, …)
-- and let those partners list them. E-Mitra keeps source_partner_id.

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS added_by_org_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_worker_profiles_added_by_org
  ON public.worker_profiles(added_by_org_id)
  WHERE added_by_org_id IS NOT NULL;

-- Attach a just-created auth user to the calling partner (used when email
-- confirmation means signUp returns no worker session).
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

  v_source := CASE WHEN v_pp_id IS NOT NULL THEN 'emitra' ELSE 'partner' END;

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
    source_type = EXCLUDED.source_type,
    source_partner_id = COALESCE(EXCLUDED.source_partner_id, public.worker_profiles.source_partner_id),
    added_by_org_id = COALESCE(EXCLUDED.added_by_org_id, public.worker_profiles.added_by_org_id),
    onboarded_at = COALESCE(public.worker_profiles.onboarded_at, EXCLUDED.onboarded_at);

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

DROP FUNCTION IF EXISTS public.partner_list_my_workers();

CREATE FUNCTION public.partner_list_my_workers()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  phone text,
  email text,
  primary_work_type text,
  current_location text,
  current_city text,
  review_status text,
  review_rejection_reason text,
  review_notes text,
  source_partner_id uuid,
  added_by_org_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.user_id,
         pr.full_name,
         pr.phone,
         pr.email,
         wp.primary_work_type,
         wp.current_location,
         wp.current_city,
         wp.review_status,
         wp.review_rejection_reason,
         wp.review_notes,
         wp.source_partner_id,
         wp.added_by_org_id,
         wp.created_at,
         wp.updated_at
  FROM public.worker_profiles wp
  LEFT JOIN public.profiles pr ON pr.id = wp.user_id
  WHERE (
    wp.source_partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
    OR wp.added_by_org_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );
$$;

REVOKE ALL ON FUNCTION public.partner_list_my_workers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_list_my_workers() TO authenticated;
