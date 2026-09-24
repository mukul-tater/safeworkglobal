-- E-Mitra centres become active when registration is completed.
-- Admin can later disable (suspended) or enable (active). Partners cannot change status themselves
-- except through complete_emitra_partner_registration.

CREATE OR REPLACE FUNCTION public.prevent_partner_sensitive_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_self_activate boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  v_self_activate :=
    current_setting('emitra.self_activate', true) = '1'
    AND auth.uid() = OLD.user_id
    AND OLD.status IN ('applied'::partner_status, 'under_review'::partner_status)
    AND NEW.status = 'active'::partner_status
    AND (NEW.partner_code IS NOT DISTINCT FROM OLD.partner_code OR OLD.partner_code IS NULL)
    AND (NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at OR OLD.reviewed_at IS NULL);

  IF NOT v_self_activate
     AND (
       NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
       OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.approval_notes IS DISTINCT FROM OLD.approval_notes
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.info_request_message IS DISTINCT FROM OLD.info_request_message
       OR NEW.lsp_verified_at IS DISTINCT FROM OLD.lsp_verified_at
       OR NEW.source_lsp_id IS DISTINCT FROM OLD.source_lsp_id
       OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
       OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
       OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
       OR NEW.total_placements IS DISTINCT FROM OLD.total_placements
       OR NEW.leaderboard_rank IS DISTINCT FROM OLD.leaderboard_rank
     )
  THEN
    RAISE EXCEPTION 'Cannot modify approval, review, tier, commission, incentive, or leaderboard fields. Contact support.';
  END IF;

  IF v_self_activate
     AND (
       NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.approval_notes IS DISTINCT FROM OLD.approval_notes
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.info_request_message IS DISTINCT FROM OLD.info_request_message
       OR NEW.lsp_verified_at IS DISTINCT FROM OLD.lsp_verified_at
       OR NEW.source_lsp_id IS DISTINCT FROM OLD.source_lsp_id
       OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
       OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
       OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
       OR NEW.total_placements IS DISTINCT FROM OLD.total_placements
       OR NEW.leaderboard_rank IS DISTINCT FROM OLD.leaderboard_rank
     )
  THEN
    RAISE EXCEPTION 'Cannot modify approval, review, tier, commission, incentive, or leaderboard fields. Contact support.';
  END IF;

  IF (OLD.aadhaar_number IS NOT NULL AND NEW.aadhaar_number IS DISTINCT FROM OLD.aadhaar_number)
     OR (OLD.pan_number IS NOT NULL AND NEW.pan_number IS DISTINCT FROM OLD.pan_number)
     OR (OLD.account_number IS NOT NULL AND NEW.account_number IS DISTINCT FROM OLD.account_number)
     OR (OLD.ifsc IS NOT NULL AND NEW.ifsc IS DISTINCT FROM OLD.ifsc)
     OR (OLD.account_holder IS NOT NULL AND NEW.account_holder IS DISTINCT FROM OLD.account_holder)
     OR (OLD.aadhaar_front_url IS NOT NULL AND NEW.aadhaar_front_url IS DISTINCT FROM OLD.aadhaar_front_url)
     OR (OLD.aadhaar_back_url IS NOT NULL AND NEW.aadhaar_back_url IS DISTINCT FROM OLD.aadhaar_back_url)
     OR (OLD.pan_card_url IS NOT NULL AND NEW.pan_card_url IS DISTINCT FROM OLD.pan_card_url)
  THEN
    RAISE EXCEPTION 'Cannot modify identity or bank details after initial submission. Contact support to update these.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_emitra_partner_registration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status public.partner_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status INTO v_status
  FROM public.partner_profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner profile not found';
  END IF;

  IF v_status IN ('suspended'::partner_status, 'rejected'::partner_status) THEN
    RAISE EXCEPTION 'This centre is disabled. Contact SafeWork support.';
  END IF;

  IF v_status IN ('active'::partner_status, 'approved'::partner_status) THEN
    UPDATE public.partner_profiles
    SET submitted_at = COALESCE(submitted_at, now())
    WHERE user_id = auth.uid()
      AND submitted_at IS NULL;
    RETURN;
  END IF;

  PERFORM set_config('emitra.self_activate', '1', true);

  UPDATE public.partner_profiles
  SET
    status = 'active'::partner_status,
    submitted_at = COALESCE(submitted_at, now()),
    partner_code = COALESCE(partner_code, public.generate_partner_code())
  WHERE user_id = auth.uid()
    AND status IN ('applied'::partner_status, 'under_review'::partner_status);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_emitra_partner_registration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_emitra_partner_registration() TO authenticated;
