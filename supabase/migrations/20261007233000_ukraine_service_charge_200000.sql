-- Ukraine listings are charged ₹2,00,000, not the platform default.

UPDATE public.jobs
SET service_charge = 200000
WHERE lower(btrim(country)) = 'ukraine'
   OR slug LIKE 'ukraine-listed-%';

CREATE OR REPLACE FUNCTION public.assessment_fee_for_worker(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_fee numeric;
  v_job_id uuid;
  v_slug text;
  v_title text;
  v_country text;
BEGIN
  SELECT j.id, j.slug, j.title, j.country, j.service_charge
    INTO v_job_id, v_slug, v_title, v_country, v_fee
    FROM public.worker_verification wv
    LEFT JOIN public.jobs j ON j.id = wv.journey_job_id
   WHERE wv.user_id = p_user_id;

  IF lower(btrim(COALESCE(v_country, ''))) = 'ukraine'
     OR COALESCE(v_slug, '') LIKE 'ukraine-listed-%' THEN
    RETURN 200000;
  END IF;

  IF v_job_id = 'a1e10000-2026-4000-8000-000000000030'::uuid
     OR v_slug IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000')
     OR lower(btrim(COALESCE(v_title, ''))) IN ('bike rider', 'delivery') THEN
    RETURN 80000;
  END IF;

  IF v_fee IS NULL OR v_fee < 1 THEN
    RETURN 35400;
  END IF;
  RETURN round(v_fee);
END;
$$;
