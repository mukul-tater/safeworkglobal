-- Relax partner sensitive-field trigger: allow FIRST write (when OLD value is NULL),
-- block subsequent edits. Status / tier / partner_code / incentive fields stay always-locked.
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

  -- Always-locked fields (only admins can change these)
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
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
END;
$$;

-- FX rates table (admin-managed, future). Empty for now.
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL UNIQUE,
  inr_per_unit NUMERIC(12,4) NOT NULL,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fx_rates TO authenticated, anon;
GRANT ALL ON public.fx_rates TO service_role;

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FX rates readable by everyone"
  ON public.fx_rates FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage FX rates"
  ON public.fx_rates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
