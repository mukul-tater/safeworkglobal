-- Prevent partners from modifying sensitive identity/financial fields on their own profile after initial submission
CREATE OR REPLACE FUNCTION public.prevent_partner_sensitive_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive identity and bank fields by the partner themselves
  IF NEW.aadhaar_number IS DISTINCT FROM OLD.aadhaar_number
     OR NEW.pan_number IS DISTINCT FROM OLD.pan_number
     OR NEW.account_number IS DISTINCT FROM OLD.account_number
     OR NEW.ifsc IS DISTINCT FROM OLD.ifsc
     OR NEW.account_holder IS DISTINCT FROM OLD.account_holder
     OR NEW.aadhaar_front_url IS DISTINCT FROM OLD.aadhaar_front_url
     OR NEW.aadhaar_back_url IS DISTINCT FROM OLD.aadhaar_back_url
     OR NEW.pan_card_url IS DISTINCT FROM OLD.pan_card_url
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
  THEN
    RAISE EXCEPTION 'Cannot modify sensitive identity, bank, status, or incentive fields. Contact support to update these.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_partner_sensitive_field_changes ON public.partner_profiles;
CREATE TRIGGER trg_prevent_partner_sensitive_field_changes
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_partner_sensitive_field_changes();