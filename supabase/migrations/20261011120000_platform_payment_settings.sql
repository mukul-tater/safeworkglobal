-- Admin-editable money settings: service charges, GST label, Razorpay extra,
-- bank transfer account, fee inclusions, indemnity stamp, and FX rates.

CREATE TABLE IF NOT EXISTS public.platform_payment_settings (
  id int PRIMARY KEY CHECK (id = 1),
  default_service_charge_inr integer NOT NULL DEFAULT 35400,
  uae_service_charge_inr integer NOT NULL DEFAULT 35400,
  uae_delivery_service_charge_inr integer NOT NULL DEFAULT 94400,
  ukraine_service_charge_inr integer NOT NULL DEFAULT 236000,
  europe_service_charge_inr integer NOT NULL DEFAULT 354000,
  gst_rate_pct numeric(5,2) NOT NULL DEFAULT 18,
  razorpay_gateway_fee_pct numeric(5,2) NOT NULL DEFAULT 2.5,
  bank_beneficiary text NOT NULL DEFAULT 'AGRIFOX SMART SOLUTIONS PVT LTD',
  bank_account_number text NOT NULL DEFAULT '0897002100019045',
  bank_name text NOT NULL DEFAULT 'Punjab National Bank',
  bank_ifsc text NOT NULL DEFAULT 'PUNB0089700',
  fee_inclusions text[] NOT NULL DEFAULT ARRAY[
    'Visa',
    'Flight tickets',
    'All documentation',
    'Insurance',
    'All government fees',
    'Emigration clearance',
    'Trade test charges',
    'Visa processing and documentation',
    'Pre-departure assistance'
  ]::text[],
  indemnity_bond_stamp_inr integer NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_payment_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- The public read policy references inr_per_unit, so the type change is blocked
-- until that policy is dropped. Recreate it without a fixed currency list so
-- CZK and any rate saved from Fees & payments are visible on public pages.
DROP POLICY IF EXISTS "FX rates readable by everyone" ON public.fx_rates;
DROP POLICY IF EXISTS "Read supported FX rates" ON public.fx_rates;

ALTER TABLE public.fx_rates
  ALTER COLUMN inr_per_unit TYPE numeric(16,8);

CREATE POLICY "Read supported FX rates"
  ON public.fx_rates FOR SELECT TO anon, authenticated
  USING (
    inr_per_unit > 0
    AND updated_at <= now()
  );

INSERT INTO public.fx_rates (currency_code, inr_per_unit, source)
VALUES
  ('AED', 23, 'platform default'),
  ('CZK', 4.43333333, '150 CZK = ₹665')
ON CONFLICT (currency_code) DO NOTHING;

ALTER TABLE public.platform_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read platform payment settings" ON public.platform_payment_settings;
CREATE POLICY "Anyone can read platform payment settings"
  ON public.platform_payment_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.platform_payment_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_payment_settings TO anon, authenticated;
GRANT ALL ON public.platform_payment_settings TO service_role;

CREATE OR REPLACE FUNCTION public.listed_delivery_job(p_id uuid, p_title text, p_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_id = 'a1e10000-2026-4000-8000-000000000030'::uuid
    OR position('bike-rider' IN lower(coalesce(p_slug, ''))) > 0
    OR lower(trim(coalesce(p_title, ''))) IN ('delivery', 'bike rider')
    OR position('bike rider' IN lower(coalesce(p_title, ''))) > 0
    OR position('delivery rider' IN lower(coalesce(p_title, ''))) > 0
    OR position('bike delivery' IN lower(coalesce(p_title, ''))) > 0
    OR position('delivery boy' IN lower(coalesce(p_title, ''))) > 0;
$$;

REVOKE ALL ON FUNCTION public.listed_delivery_job(uuid, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.admin_save_platform_payment_settings(
  p_default_service_charge_inr integer,
  p_uae_service_charge_inr integer,
  p_uae_delivery_service_charge_inr integer,
  p_ukraine_service_charge_inr integer,
  p_europe_service_charge_inr integer,
  p_gst_rate_pct numeric,
  p_razorpay_gateway_fee_pct numeric,
  p_bank_beneficiary text,
  p_bank_account_number text,
  p_bank_name text,
  p_bank_ifsc text,
  p_fee_inclusions text[],
  p_indemnity_bond_stamp_inr integer,
  p_fx jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_code text;
  v_rate numeric;
  v_inclusions text[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF p_default_service_charge_inr < 1 OR p_default_service_charge_inr > 500000
     OR p_uae_service_charge_inr < 1 OR p_uae_service_charge_inr > 500000
     OR p_uae_delivery_service_charge_inr < 1 OR p_uae_delivery_service_charge_inr > 500000
     OR p_ukraine_service_charge_inr < 1 OR p_ukraine_service_charge_inr > 500000
     OR p_europe_service_charge_inr < 1 OR p_europe_service_charge_inr > 500000
  THEN
    RAISE EXCEPTION 'service charge must be between 1 and 500000';
  END IF;

  IF p_gst_rate_pct < 0 OR p_gst_rate_pct > 40 THEN
    RAISE EXCEPTION 'GST percent must be between 0 and 40';
  END IF;

  IF p_razorpay_gateway_fee_pct < 0 OR p_razorpay_gateway_fee_pct > 15 THEN
    RAISE EXCEPTION 'Razorpay extra percent must be between 0 and 15';
  END IF;

  IF p_indemnity_bond_stamp_inr < 1 OR p_indemnity_bond_stamp_inr > 100000 THEN
    RAISE EXCEPTION 'stamp amount must be between 1 and 100000';
  END IF;

  IF length(trim(coalesce(p_bank_beneficiary, ''))) < 2
     OR length(trim(coalesce(p_bank_name, ''))) < 2
  THEN
    RAISE EXCEPTION 'bank beneficiary and bank name are required';
  END IF;

  IF coalesce(p_bank_account_number, '') !~ '^[0-9]{6,22}$' THEN
    RAISE EXCEPTION 'account number must be 6 to 22 digits';
  END IF;

  IF upper(trim(coalesce(p_bank_ifsc, ''))) !~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'IFSC must be 11 characters, with 0 as the fifth character';
  END IF;

  SELECT coalesce(array_agg(item), '{}'::text[])
  INTO v_inclusions
  FROM (
    SELECT trim(item) AS item
    FROM unnest(coalesce(p_fee_inclusions, '{}'::text[])) AS item
    WHERE length(trim(item)) > 0
  ) cleaned;

  IF cardinality(v_inclusions) < 1 OR cardinality(v_inclusions) > 20 THEN
    RAISE EXCEPTION 'enter between 1 and 20 fee inclusions';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(v_inclusions) AS item WHERE length(item) > 80
  ) THEN
    RAISE EXCEPTION 'each fee inclusion must be 80 characters or fewer';
  END IF;

  UPDATE public.platform_payment_settings
  SET
    default_service_charge_inr = p_default_service_charge_inr,
    uae_service_charge_inr = p_uae_service_charge_inr,
    uae_delivery_service_charge_inr = p_uae_delivery_service_charge_inr,
    ukraine_service_charge_inr = p_ukraine_service_charge_inr,
    europe_service_charge_inr = p_europe_service_charge_inr,
    gst_rate_pct = p_gst_rate_pct,
    razorpay_gateway_fee_pct = p_razorpay_gateway_fee_pct,
    bank_beneficiary = trim(p_bank_beneficiary),
    bank_account_number = p_bank_account_number,
    bank_name = trim(p_bank_name),
    bank_ifsc = upper(trim(p_bank_ifsc)),
    fee_inclusions = v_inclusions,
    indemnity_bond_stamp_inr = p_indemnity_bond_stamp_inr,
    updated_at = now()
  WHERE id = 1;

  IF p_fx IS NOT NULL THEN
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_fx)
    LOOP
      v_code := upper(trim(coalesce(v_item->>'code', '')));
      v_rate := NULLIF(v_item->>'inr_per_unit', '')::numeric;
      IF v_code !~ '^[A-Z]{3}$' THEN
        RAISE EXCEPTION 'currency code must be 3 letters';
      END IF;
      IF v_rate IS NULL OR v_rate <= 0 OR v_rate > 100000 THEN
        RAISE EXCEPTION 'exchange rate for % must be greater than 0', v_code;
      END IF;
      INSERT INTO public.fx_rates (currency_code, inr_per_unit, source, updated_at)
      VALUES (v_code, v_rate, 'admin', now())
      ON CONFLICT (currency_code) DO UPDATE
        SET inr_per_unit = EXCLUDED.inr_per_unit,
            source = 'admin',
            updated_at = now();
    END LOOP;
  END IF;

  -- Listed-country presets override the stored job charge, same order as checkout.
  UPDATE public.jobs
  SET service_charge = p_uae_service_charge_inr
  WHERE lower(trim(coalesce(country, ''))) = 'uae'
     OR coalesce(slug, '') LIKE 'uae-listed-%';

  UPDATE public.jobs
  SET service_charge = p_uae_delivery_service_charge_inr
  WHERE public.listed_delivery_job(id, title, slug);

  UPDATE public.jobs
  SET service_charge = p_europe_service_charge_inr
  WHERE lower(trim(coalesce(country, ''))) = 'europe'
     OR coalesce(slug, '') LIKE 'europe-listed-%';

  UPDATE public.jobs
  SET service_charge = p_ukraine_service_charge_inr
  WHERE lower(trim(coalesce(country, ''))) = 'ukraine'
     OR coalesce(slug, '') LIKE 'ukraine-listed-%';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_platform_payment_settings(
  integer, integer, integer, integer, integer, numeric, numeric,
  text, text, text, text, text[], integer, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_platform_payment_settings(
  integer, integer, integer, integer, integer, numeric, numeric,
  text, text, text, text, text[], integer, jsonb
) TO authenticated;
