
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

  -- System / cascade context (migrations or nested trigger): allow.
  -- pg_trigger_depth() > 1 means this UPDATE was fired from inside another trigger
  -- (e.g. eMitra placement reward updating partner counters).
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Always-locked fields for direct user updates
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
     OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
  THEN
    RAISE EXCEPTION 'Cannot modify status, tier, partner code, or incentive fields. Contact support.';
  END IF;

  -- Identity / bank fields: allow first write, block subsequent change
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
END $$;
