-- Ensure E-Mitra onboarding v2 columns exist on partner_profiles.
-- Safe to re-run. Does not recreate RLS policies (those were tightened later).

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS csc_id text,
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS panchayat text,
  ADD COLUMN IF NOT EXISTS city_town text,
  ADD COLUMN IF NOT EXISTS has_webcam boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS cancelled_cheque_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_url text,
  ADD COLUMN IF NOT EXISTS inside_shop_photo_url text,
  ADD COLUMN IF NOT EXISTS training_declaration boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_mea_guidelines boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_platform_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_confidentiality boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_accepted_via_otp boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS agree_no_misrepresentation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_accurate_info boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_not_sub_agent boolean DEFAULT false;

COMMENT ON COLUMN public.partner_profiles.csc_id IS 'Optional CSC ID collected during E-Mitra onboarding';
COMMENT ON COLUMN public.partner_profiles.agreement_accepted_via_otp IS 'Partner accepted SafeWork–Vesta–E-Mitra agreement via SMS OTP';

-- Partners may submit (applied/rejected → under_review) and set source_lsp_id once.
CREATE OR REPLACE FUNCTION public.partner_profile_self_update_allowed(_new public.partner_profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old public.partner_profiles%ROWTYPE;
  _status_ok boolean;
  _source_ok boolean;
BEGIN
  SELECT * INTO _old FROM public.partner_profiles WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  _status_ok :=
    _new.status IS NOT DISTINCT FROM _old.status
    OR (
      _old.status IN ('applied'::partner_status, 'rejected'::partner_status)
      AND _new.status = 'under_review'::partner_status
    );

  _source_ok :=
    _new.source_lsp_id IS NOT DISTINCT FROM _old.source_lsp_id
    OR _old.source_lsp_id IS NULL;

  RETURN _new.user_id IS NOT DISTINCT FROM _old.user_id
     AND _status_ok
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
     AND _source_ok
     AND _new.total_incentives_earned IS NOT DISTINCT FROM _old.total_incentives_earned
     AND _new.workers_placed IS NOT DISTINCT FROM _old.workers_placed
     AND _new.workers_registered IS NOT DISTINCT FROM _old.workers_registered
     AND _new.total_placements IS NOT DISTINCT FROM _old.total_placements
     AND _new.leaderboard_rank IS NOT DISTINCT FROM _old.leaderboard_rank;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_partner_sensitive_field_changes()
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

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
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
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
     OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
     OR NEW.total_placements IS DISTINCT FROM OLD.total_placements
     OR NEW.leaderboard_rank IS DISTINCT FROM OLD.leaderboard_rank
  THEN
    RAISE EXCEPTION 'Cannot modify approval, review, tier, commission, incentive, or leaderboard fields. Contact support.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (
       OLD.status IN ('applied'::partner_status, 'rejected'::partner_status)
       AND NEW.status = 'under_review'::partner_status
     )
  THEN
    RAISE EXCEPTION 'Cannot modify approval, review, tier, commission, incentive, or leaderboard fields. Contact support.';
  END IF;

  IF NEW.source_lsp_id IS DISTINCT FROM OLD.source_lsp_id
     AND OLD.source_lsp_id IS NOT NULL
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

NOTIFY pgrst, 'reload schema';
