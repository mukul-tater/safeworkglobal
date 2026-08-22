-- 1) Pin search_path on the requirement reference generator (SUPA_function_search_path_mutable)
ALTER FUNCTION public.generate_employer_requirement_ref() SET search_path = public;

-- 2) Row-comparison helpers used inside WITH CHECK clauses so policy-level
--    enforcement (not just triggers) blocks privileged self-edits.

CREATE OR REPLACE FUNCTION public.partner_profile_self_update_allowed(_new public.partner_profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old public.partner_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _old FROM public.partner_profiles WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN _new.user_id IS NOT DISTINCT FROM _old.user_id
     AND _new.status IS NOT DISTINCT FROM _old.status
     AND _new.tier IS NOT DISTINCT FROM _old.tier
     AND _new.commission_rate IS NOT DISTINCT FROM _old.commission_rate
     AND _new.partner_code IS NOT DISTINCT FROM _old.partner_code
     AND _new.approved_by IS NOT DISTINCT FROM _old.approved_by
     AND _new.approved_at IS NOT DISTINCT FROM _old.approved_at
     AND _new.approval_notes IS NOT DISTINCT FROM _old.approval_notes
     AND _new.reviewed_by IS NOT DISTINCT FROM _old.reviewed_by
     AND _new.reviewed_at IS NOT DISTINCT FROM _old.reviewed_at
     AND _new.rejection_reason IS NOT DISTINCT FROM _old.rejection_reason
     AND _new.info_request_message IS NOT DISTINCT FROM _old.info_request_message
     AND _new.lsp_verified_at IS NOT DISTINCT FROM _old.lsp_verified_at
     AND _new.source_lsp_id IS NOT DISTINCT FROM _old.source_lsp_id
     AND _new.total_incentives_earned IS NOT DISTINCT FROM _old.total_incentives_earned
     AND _new.workers_placed IS NOT DISTINCT FROM _old.workers_placed
     AND _new.workers_registered IS NOT DISTINCT FROM _old.workers_registered
     AND _new.total_placements IS NOT DISTINCT FROM _old.total_placements
     AND _new.leaderboard_rank IS NOT DISTINCT FROM _old.leaderboard_rank;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_profile_self_update_allowed(public.partner_profiles) TO authenticated;

CREATE OR REPLACE FUNCTION public.partners_self_update_allowed(_new public.partners)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old public.partners%ROWTYPE;
BEGIN
  SELECT * INTO _old FROM public.partners WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN _new.user_id IS NOT DISTINCT FROM _old.user_id
     AND _new.status IS NOT DISTINCT FROM _old.status
     AND _new.verification_status IS NOT DISTINCT FROM _old.verification_status
     AND _new.partner_code IS NOT DISTINCT FROM _old.partner_code
     AND _new.partner_type_id IS NOT DISTINCT FROM _old.partner_type_id
     AND _new.rating IS NOT DISTINCT FROM _old.rating
     AND _new.approved_by IS NOT DISTINCT FROM _old.approved_by
     AND _new.approved_at IS NOT DISTINCT FROM _old.approved_at
     AND _new.rejection_reason IS NOT DISTINCT FROM _old.rejection_reason
     AND _new.created_at IS NOT DISTINCT FROM _old.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partners_self_update_allowed(public.partners) TO authenticated;

-- 3) Tighten partner self-update policies (partner_profiles_self_approval)
DROP POLICY IF EXISTS "Partners can update own profile pre-approval" ON public.partner_profiles;
CREATE POLICY "Partners can update own profile pre-approval"
ON public.partner_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('applied'::partner_status, 'under_review'::partner_status, 'rejected'::partner_status)
)
WITH CHECK (
  auth.uid() = user_id
  AND public.partner_profile_self_update_allowed(partner_profiles)
);

DROP POLICY IF EXISTS "Partners can update own operational profile" ON public.partner_profiles;
CREATE POLICY "Partners can update own operational profile"
ON public.partner_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.partner_profile_self_update_allowed(partner_profiles)
);

-- 4) Tighten partner organization self-update policy (partners_table_self_approval)
DROP POLICY IF EXISTS "partners self update limited" ON public.partners;
CREATE POLICY "partners self update limited"
ON public.partners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND public.partners_self_update_allowed(partners)
);

-- 5) Bond security: workers/partners can never self-approve (worker_bond_security_self_approval)
DROP POLICY IF EXISTS "Workers update own bond security drafts" ON public.worker_bond_security;
CREATE POLICY "Workers update own bond security drafts"
ON public.worker_bond_security
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'in_progress', 'resubmission_required', 'rejected')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'in_progress', 'resubmission_required', 'rejected')
  AND approved_by IS NULL
  AND approved_at IS NULL
);

DROP POLICY IF EXISTS "Partners manage attributed bond security" ON public.worker_bond_security;
CREATE POLICY "Partners manage attributed bond security"
ON public.worker_bond_security
FOR ALL
TO authenticated
USING (partner_manages_worker(user_id))
WITH CHECK (
  partner_manages_worker(user_id)
  AND status <> 'approved'
  AND approved_by IS NULL
  AND approved_at IS NULL
);

-- 6) Trigger guard as defense-in-depth for bond approval / verification fields
CREATE OR REPLACE FUNCTION public.prevent_bond_security_privileged_changes()
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

  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Only admins can approve bond security.';
  END IF;

  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Only admins can set bond approval fields.';
  END IF;

  IF NEW.bond_doc_status = 'verified' AND OLD.bond_doc_status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Only admins can verify bond documents.';
  END IF;

  IF NEW.courier_status IN ('received', 'verified')
     AND OLD.courier_status IS DISTINCT FROM NEW.courier_status THEN
    RAISE EXCEPTION 'Only admins can mark the bond original as received or verified.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_bond_privileged_changes ON public.worker_bond_security;
CREATE TRIGGER trg_prevent_bond_privileged_changes
BEFORE UPDATE ON public.worker_bond_security
FOR EACH ROW
EXECUTE FUNCTION public.prevent_bond_security_privileged_changes();