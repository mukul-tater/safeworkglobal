-- Admin chooses which centres can register workers.
-- E-Mitra (SEN) starts enabled. Every other partner type starts off.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS can_add_workers boolean NOT NULL DEFAULT false;

UPDATE public.partners p
SET can_add_workers = true
FROM public.partner_types pt
WHERE pt.id = p.partner_type_id
  AND pt.code = 'SEN';

CREATE OR REPLACE FUNCTION public.partners_default_can_add_workers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM public.partner_types pt
    WHERE pt.id = NEW.partner_type_id AND pt.code = 'SEN'
  ) THEN
    NEW.can_add_workers := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partners_default_can_add_workers ON public.partners;
CREATE TRIGGER trg_partners_default_can_add_workers
BEFORE INSERT ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.partners_default_can_add_workers();

CREATE OR REPLACE FUNCTION public.prevent_partners_privileged_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.partner_type_id IS DISTINCT FROM OLD.partner_type_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.can_add_workers IS DISTINCT FROM OLD.can_add_workers
  THEN
    RAISE EXCEPTION 'Cannot modify approval, verification, rating, or partner type fields. Contact support.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_partner_can_add_workers(
  p_partner_id uuid,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_partner_id IS NULL OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'Partner and enabled flag are required';
  END IF;

  UPDATE public.partners
  SET can_add_workers = p_enabled
  WHERE id = p_partner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_partner_can_add_workers(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_partner_can_add_workers(uuid, boolean) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.current_partner();

CREATE FUNCTION public.current_partner()
RETURNS TABLE (
  id uuid, partner_type_id uuid, partner_type_code text, partner_type_name text,
  partner_code text, status public.partner_org_status,
  verification_status public.partner_verification_status,
  state text, district text, city text, rating numeric,
  company_name text, wallet_available numeric, wallet_pending numeric,
  can_add_workers boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.partner_type_id, pt.code, pt.name,
         p.partner_code, p.status, p.verification_status,
         p.state, p.district, p.city, p.rating,
         ppe.company_name,
         COALESCE(w.available_balance, 0), COALESCE(w.pending_balance, 0),
         p.can_add_workers
  FROM public.partners p
  JOIN public.partner_types pt ON pt.id = p.partner_type_id
  LEFT JOIN public.partner_profiles_ext ppe ON ppe.partner_id = p.id
  LEFT JOIN public.partner_wallets w ON w.partner_id = p.id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_partner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_partner() TO authenticated, service_role;

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
  v_org_code text;
  v_can_add boolean;
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

  SELECT p.id, p.can_add_workers, pt.code
    INTO v_org_id, v_can_add, v_org_code
  FROM public.partners p
  JOIN public.partner_types pt ON pt.id = p.partner_type_id
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_pp_id IS NULL AND v_org_id IS NULL THEN
    RAISE EXCEPTION 'No partner organisation found for this account';
  END IF;

  IF v_org_id IS NOT NULL AND COALESCE(v_can_add, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Adding workers is turned off for this centre';
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

  IF v_org_id IS NOT NULL AND v_org_code IS DISTINCT FROM 'SEN' THEN
    v_source := 'partner';
    v_pp_id := NULL;
  ELSIF v_pp_id IS NOT NULL THEN
    v_source := 'emitra';
  ELSE
    v_source := 'partner';
  END IF;

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
