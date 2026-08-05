-- 1) job_applications: collapse permissive INSERT policies into one strict policy
DROP POLICY IF EXISTS "Employers cannot create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Workers can create applications when GCC ready" ON public.job_applications;

CREATE POLICY "Workers can create own applications when eligible"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = worker_id
  AND public.worker_can_apply_to_jobs(auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'employer'::app_role
  )
);

-- 2) partner_profiles: force non-admin inserts to a non-privileged status
CREATE OR REPLACE FUNCTION public.enforce_partner_profile_insert_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NULL OR NEW.status NOT IN ('applied'::partner_status, 'under_review'::partner_status) THEN
    NEW.status := 'applied'::partner_status;
  END IF;

  NEW.partner_code := NULL;
  NEW.approved_by := NULL;
  NEW.approved_at := NULL;
  NEW.lsp_verified_at := NULL;
  NEW.total_incentives_earned := 0;
  NEW.workers_placed := 0;
  NEW.workers_registered := 0;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_partner_profile_insert_status ON public.partner_profiles;
CREATE TRIGGER trg_enforce_partner_profile_insert_status
BEFORE INSERT ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_profile_insert_status();

-- 3) worker_profiles: block self-edits of review/kyc/source fields
CREATE OR REPLACE FUNCTION public.prevent_worker_profile_privileged_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

  -- Workers may only submit KYC; approval/rejection is staff-only
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     AND NEW.kyc_status <> 'submitted' THEN
    RAISE EXCEPTION 'Verification status can only be changed by SafeWork staff.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_worker_profile_privileged_changes ON public.worker_profiles;
CREATE TRIGGER trg_prevent_worker_profile_privileged_changes
BEFORE UPDATE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_worker_profile_privileged_changes();