-- Stored service_charge is the amount the worker pays (base + 18% GST).
-- Listings show the base as "₹30,000 + GST" and do not itemize GST.
-- UAE trades: ₹30,000 + GST = ₹35,400
-- Dubai bike delivery: ₹80,000 + GST = ₹94,400
-- Ukraine: ₹2,00,000 + GST = ₹2,36,000
-- Czech Republic (Europe listings): ₹3,00,000 + GST = ₹3,54,000

UPDATE public.jobs
SET service_charge = 94400
WHERE id = 'a1e10000-2026-4000-8000-000000000030'::uuid
   OR slug LIKE '%bike-rider%'
   OR (
     lower(btrim(COALESCE(country, ''))) = 'uae'
     AND (
       lower(btrim(COALESCE(title, ''))) IN ('bike rider', 'delivery')
       OR lower(COALESCE(title, '')) LIKE '%bike rider%'
       OR lower(COALESCE(title, '')) LIKE '%delivery rider%'
       OR lower(COALESCE(title, '')) LIKE '%bike delivery%'
       OR lower(COALESCE(title, '')) LIKE '%delivery boy%'
     )
   );

UPDATE public.jobs
SET service_charge = 35400
WHERE (
    lower(btrim(COALESCE(country, ''))) = 'uae'
    OR slug LIKE 'uae-listed-%'
  )
  AND id IS DISTINCT FROM 'a1e10000-2026-4000-8000-000000000030'::uuid
  AND COALESCE(slug, '') NOT LIKE '%bike-rider%'
  AND lower(btrim(COALESCE(title, ''))) NOT IN ('bike rider', 'delivery')
  AND lower(COALESCE(title, '')) NOT LIKE '%bike rider%'
  AND lower(COALESCE(title, '')) NOT LIKE '%delivery rider%'
  AND lower(COALESCE(title, '')) NOT LIKE '%bike delivery%'
  AND lower(COALESCE(title, '')) NOT LIKE '%delivery boy%';

UPDATE public.jobs
SET service_charge = 236000
WHERE lower(btrim(COALESCE(country, ''))) = 'ukraine'
   OR slug LIKE 'ukraine-listed-%';

UPDATE public.jobs
SET service_charge = 354000
WHERE lower(btrim(COALESCE(country, ''))) = 'europe'
   OR slug LIKE 'europe-listed-%';

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
  v_title_l text;
BEGIN
  SELECT j.id, j.slug, j.title, j.country, j.service_charge
    INTO v_job_id, v_slug, v_title, v_country, v_fee
    FROM public.worker_verification wv
    LEFT JOIN public.jobs j ON j.id = wv.journey_job_id
   WHERE wv.user_id = p_user_id;

  v_title_l := lower(btrim(COALESCE(v_title, '')));

  IF lower(btrim(COALESCE(v_country, ''))) = 'ukraine'
     OR COALESCE(v_slug, '') LIKE 'ukraine-listed-%' THEN
    RETURN 236000;
  END IF;

  IF lower(btrim(COALESCE(v_country, ''))) = 'europe'
     OR COALESCE(v_slug, '') LIKE 'europe-listed-%' THEN
    RETURN 354000;
  END IF;

  IF v_job_id = 'a1e10000-2026-4000-8000-000000000030'::uuid
     OR COALESCE(v_slug, '') LIKE '%bike-rider%'
     OR v_title_l IN ('bike rider', 'delivery')
     OR v_title_l LIKE '%bike rider%'
     OR v_title_l LIKE '%delivery rider%'
     OR v_title_l LIKE '%bike delivery%'
     OR v_title_l LIKE '%delivery boy%' THEN
    RETURN 94400;
  END IF;

  IF lower(btrim(COALESCE(v_country, ''))) = 'uae'
     OR COALESCE(v_slug, '') LIKE 'uae-listed-%' THEN
    RETURN 35400;
  END IF;

  IF v_fee IS NULL OR v_fee < 1 THEN
    RETURN 35400;
  END IF;
  RETURN round(v_fee);
END;
$$;
