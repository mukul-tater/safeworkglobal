
CREATE OR REPLACE FUNCTION public.prevent_partner_sensitive_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.lsp_verified_at IS DISTINCT FROM OLD.lsp_verified_at
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
     OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
  THEN
    RAISE EXCEPTION 'Cannot modify status, tier, commission, approval, partner code, or incentive fields. Contact support.';
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

CREATE OR REPLACE FUNCTION public.prevent_partners_privileged_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.partner_type_id IS DISTINCT FROM OLD.partner_type_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
  THEN
    RAISE EXCEPTION 'Cannot modify approval, verification, rating, or partner type fields. Contact support.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_partners_privileged_field_changes ON public.partners;
CREATE TRIGGER trg_prevent_partners_privileged_field_changes
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.prevent_partners_privileged_field_changes();
