-- The fee a worker owes is the service charge saved on their job.
-- Missing or invalid amounts are 0. Country presets no longer replace it.

CREATE OR REPLACE FUNCTION public.assessment_fee_for_worker(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_fee numeric;
BEGIN
  SELECT j.service_charge
    INTO v_fee
    FROM public.worker_verification wv
    LEFT JOIN public.jobs j ON j.id = wv.journey_job_id
   WHERE wv.user_id = p_user_id;

  IF v_fee IS NULL OR v_fee < 0 THEN
    RETURN 0;
  END IF;
  RETURN round(v_fee);
END;
$$;

-- Saving Fees & payments no longer rewrites the service charge on existing jobs.
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
END;
$$;

CREATE OR REPLACE FUNCTION public.public_employer_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'slug', ep.public_slug,
    'name', ep.company_name,
    'logo_url', ep.company_logo_url,
    'industry', ep.industry,
    'location', COALESCE(ep.emirate, ep.country),
    'country', ep.country,
    'description', ep.public_description,
    'verified', ep.public_verified,
    'jobs', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', j.id, 'slug', j.slug, 'title', j.title, 'location', j.location,
      'country', j.country, 'category', j.category, 'salary_min', j.salary_min,
      'salary_max', j.salary_max, 'currency', j.currency, 'job_type', j.job_type,
      'experience_level', j.experience_level, 'posted_at', j.posted_at,
      'description', j.description, 'visa_sponsorship', j.visa_sponsorship,
      'service_charge', j.service_charge
    ) ORDER BY j.posted_at DESC)
    FROM public.jobs j
    WHERE j.employer_id = ep.user_id AND j.status = 'ACTIVE'
      AND (j.expires_at IS NULL OR j.expires_at >= now()) AND j.indexable), '[]'::jsonb)
  )
  FROM public.employer_profiles ep
  WHERE ep.public_slug = p_slug AND ep.is_public = true
  LIMIT 1;
$$;
