-- Admin-provisioned job listing fields, plus journey stage wait copy.
-- Existing UAE catalog pages keep their trade templates until use_saved_copy is turned on.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS title_hi text,
  ADD COLUMN IF NOT EXISTS processing_time text,
  ADD COLUMN IF NOT EXISTS processing_time_hi text,
  ADD COLUMN IF NOT EXISTS work_phrase text,
  ADD COLUMN IF NOT EXISTS benefits_hi text,
  ADD COLUMN IF NOT EXISTS quiz_skill_code text,
  ADD COLUMN IF NOT EXISTS card_image_url text,
  ADD COLUMN IF NOT EXISTS hidden_from_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_saved_copy boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.jobs.title_hi IS 'Hindi job name shown beside the English title.';
COMMENT ON COLUMN public.jobs.processing_time IS 'Worker-facing processing time for this job, e.g. 4–6 weeks.';
COMMENT ON COLUMN public.jobs.processing_time_hi IS 'Hindi processing time for this job.';
COMMENT ON COLUMN public.jobs.work_phrase IS 'Skill-proof phrase, e.g. welding. Fits “doing {phrase}”.';
COMMENT ON COLUMN public.jobs.benefits_hi IS 'Hindi benefit lines, one per line, aligned with benefits.';
COMMENT ON COLUMN public.jobs.quiz_skill_code IS 'Test 1 paper. Empty means infer from the title.';
COMMENT ON COLUMN public.jobs.card_image_url IS 'Optional card image URL. Trade artwork is used when empty.';
COMMENT ON COLUMN public.jobs.hidden_from_public IS 'Hide this listing from Find jobs and the journey picker.';
COMMENT ON COLUMN public.jobs.use_saved_copy IS 'When true, public pages use the saved title, description, duties, benefits and pay.';

UPDATE public.jobs
SET title_hi = CASE lower(trim(title))
  WHEN 'electrician' THEN 'इलेक्ट्रीशियन'
  WHEN 'welder' THEN 'वेल्डर'
  WHEN 'mig welder' THEN 'MIG वेल्डर'
  WHEN 'tig welder' THEN 'TIG वेल्डर'
  WHEN 'plumber' THEN 'प्लंबर'
  WHEN 'shuttering carpenter' THEN 'शटरिंग (साँचा बढ़ई)'
  WHEN 'mason (tiles/marble)' THEN 'राजमिस्त्री (टाइल्स एंड मार्बल)'
  WHEN 'mason (bricks/plaster)' THEN 'ईंट प्लास्टर राजमिस्त्री'
  WHEN 'construction labour/helper' THEN 'कंस्ट्रक्शन लेबर / हेल्पर'
  WHEN 'pipe fitter' THEN 'GI स्टील पाइप फिटर'
  WHEN 'furniture carpenter - finishing, all rounder' THEN 'फर्नीचर कारपेंटर'
  WHEN 'steel fixer' THEN 'सरिया बांधने वाला'
  WHEN 'ac technician' THEN 'एसी मिस्त्री'
  WHEN 'warehouse helper' THEN 'वेयरहाउस हेल्पर'
  WHEN 'cleaner (male)' THEN 'क्लीनर (सफाई वाला)'
  WHEN 'cleaner (female)' THEN 'क्लीनर (सफाई वाली)'
  WHEN 'scaffolder' THEN 'पाड़ बाँधने वाला / मचान बनाने वाला'
  WHEN 'painter' THEN 'पेंटर'
  WHEN 'aluminium fixer/fabricator' THEN 'एल्युमिनियम फिक्सर'
  WHEN 'delivery' THEN 'बाइक डिलीवरी (खाना और पार्सल)'
  ELSE title_hi
END
WHERE title_hi IS NULL;

UPDATE public.jobs
SET hidden_from_public = true
WHERE hidden_from_public = false
  AND (slug = 'uae-listed-carpenter' OR lower(trim(title)) = 'carpenter');

CREATE OR REPLACE FUNCTION public.admin_update_job(
  p_job_id uuid,
  p_patch jsonb,
  p_skills text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'Job id is required';
  END IF;

  UPDATE public.jobs
  SET
    title = COALESCE(p_patch->>'title', title),
    description = COALESCE(p_patch->>'description', description),
    requirements = CASE
      WHEN p_patch ? 'requirements' THEN NULLIF(p_patch->>'requirements', '')
      ELSE requirements
    END,
    benefits = CASE
      WHEN p_patch ? 'benefits' THEN NULLIF(p_patch->>'benefits', '')
      ELSE benefits
    END,
    responsibilities = CASE
      WHEN p_patch ? 'responsibilities' THEN NULLIF(p_patch->>'responsibilities', '')
      ELSE responsibilities
    END,
    location = COALESCE(p_patch->>'location', location),
    country = COALESCE(p_patch->>'country', country),
    job_type = COALESCE(p_patch->>'job_type', job_type),
    experience_level = COALESCE(p_patch->>'experience_level', experience_level),
    salary_min = CASE
      WHEN p_patch ? 'salary_min' THEN NULLIF(p_patch->>'salary_min', '')::numeric
      ELSE salary_min
    END,
    salary_max = CASE
      WHEN p_patch ? 'salary_max' THEN NULLIF(p_patch->>'salary_max', '')::numeric
      ELSE salary_max
    END,
    currency = COALESCE(p_patch->>'currency', currency),
    local_salary_min = CASE
      WHEN p_patch ? 'local_salary_min' THEN NULLIF(p_patch->>'local_salary_min', '')::numeric
      ELSE local_salary_min
    END,
    local_salary_max = CASE
      WHEN p_patch ? 'local_salary_max' THEN NULLIF(p_patch->>'local_salary_max', '')::numeric
      ELSE local_salary_max
    END,
    local_salary_currency = CASE
      WHEN p_patch ? 'local_salary_currency' THEN NULLIF(p_patch->>'local_salary_currency', '')
      ELSE local_salary_currency
    END,
    salary_display = CASE
      WHEN p_patch ? 'salary_display' THEN NULLIF(p_patch->>'salary_display', '')
      ELSE salary_display
    END,
    openings = COALESCE(NULLIF(p_patch->>'openings', '')::integer, openings),
    visa_sponsorship = COALESCE((p_patch->>'visa_sponsorship')::boolean, visa_sponsorship),
    remote_allowed = COALESCE((p_patch->>'remote_allowed')::boolean, remote_allowed),
    status = COALESCE(p_patch->>'status', status),
    posted_at = CASE
      WHEN p_patch ? 'posted_at' THEN NULLIF(p_patch->>'posted_at', '')::timestamptz
      ELSE posted_at
    END,
    expires_at = CASE
      WHEN NOT (p_patch ? 'expires_at') THEN expires_at
      WHEN NULLIF(p_patch->>'expires_at', '') IS NULL THEN NULL
      ELSE (p_patch->>'expires_at')::timestamptz
    END,
    service_charge = CASE
      WHEN p_patch ? 'service_charge' THEN NULLIF(p_patch->>'service_charge', '')::numeric
      ELSE service_charge
    END,
    youtube_urls = CASE
      WHEN p_patch ? 'youtube_urls' THEN public.normalize_job_youtube_urls(p_patch->'youtube_urls')
      ELSE youtube_urls
    END,
    title_hi = CASE WHEN p_patch ? 'title_hi' THEN NULLIF(p_patch->>'title_hi', '') ELSE title_hi END,
    processing_time = CASE WHEN p_patch ? 'processing_time' THEN NULLIF(p_patch->>'processing_time', '') ELSE processing_time END,
    processing_time_hi = CASE WHEN p_patch ? 'processing_time_hi' THEN NULLIF(p_patch->>'processing_time_hi', '') ELSE processing_time_hi END,
    work_phrase = CASE WHEN p_patch ? 'work_phrase' THEN NULLIF(p_patch->>'work_phrase', '') ELSE work_phrase END,
    benefits_hi = CASE WHEN p_patch ? 'benefits_hi' THEN NULLIF(p_patch->>'benefits_hi', '') ELSE benefits_hi END,
    quiz_skill_code = CASE WHEN p_patch ? 'quiz_skill_code' THEN NULLIF(p_patch->>'quiz_skill_code', '') ELSE quiz_skill_code END,
    card_image_url = CASE WHEN p_patch ? 'card_image_url' THEN NULLIF(p_patch->>'card_image_url', '') ELSE card_image_url END,
    category = CASE WHEN p_patch ? 'category' THEN NULLIF(p_patch->>'category', '') ELSE category END,
    city = CASE WHEN p_patch ? 'city' THEN NULLIF(p_patch->>'city', '') ELSE city END,
    slug = CASE WHEN p_patch ? 'slug' THEN NULLIF(p_patch->>'slug', '') ELSE slug END,
    seo_title = CASE WHEN p_patch ? 'seo_title' THEN NULLIF(p_patch->>'seo_title', '') ELSE seo_title END,
    seo_description = CASE WHEN p_patch ? 'seo_description' THEN NULLIF(p_patch->>'seo_description', '') ELSE seo_description END,
    indexable = CASE
      WHEN p_patch ? 'indexable' THEN COALESCE((p_patch->>'indexable')::boolean, true)
      ELSE indexable
    END,
    hidden_from_public = CASE
      WHEN p_patch ? 'hidden_from_public' THEN COALESCE((p_patch->>'hidden_from_public')::boolean, false)
      ELSE hidden_from_public
    END,
    use_saved_copy = CASE
      WHEN p_patch ? 'use_saved_copy' THEN COALESCE((p_patch->>'use_saved_copy')::boolean, false)
      ELSE use_saved_copy
    END,
    updated_at = now()
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF p_skills IS NOT NULL THEN
    DELETE FROM public.job_skills WHERE job_id = p_job_id;
    INSERT INTO public.job_skills (job_id, skill_name)
    SELECT p_job_id, trim(s)
    FROM unnest(p_skills) AS s
    WHERE length(trim(s)) > 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_job(
  p_employer_id uuid,
  p_patch jsonb,
  p_skills text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
  v_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_employer_id IS NULL THEN
    RAISE EXCEPTION 'Employer is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.employer_profiles WHERE user_id = p_employer_id
  ) THEN
    RAISE EXCEPTION 'Employer not found';
  END IF;

  IF NULLIF(p_patch->>'title', '') IS NULL OR NULLIF(p_patch->>'description', '') IS NULL THEN
    RAISE EXCEPTION 'Title and description are required';
  END IF;

  IF NULLIF(p_patch->>'location', '') IS NULL OR NULLIF(p_patch->>'country', '') IS NULL THEN
    RAISE EXCEPTION 'Location and country are required';
  END IF;

  IF NULLIF(p_patch->>'job_type', '') IS NULL OR NULLIF(p_patch->>'experience_level', '') IS NULL THEN
    RAISE EXCEPTION 'Job type and experience level are required';
  END IF;

  v_status := COALESCE(NULLIF(p_patch->>'status', ''), 'ACTIVE');

  INSERT INTO public.jobs (
    employer_id,
    title,
    description,
    requirements,
    benefits,
    responsibilities,
    location,
    country,
    job_type,
    experience_level,
    salary_min,
    salary_max,
    currency,
    local_salary_min,
    local_salary_max,
    local_salary_currency,
    salary_display,
    openings,
    visa_sponsorship,
    remote_allowed,
    status,
    posted_at,
    expires_at,
    posted_by_role,
    created_by,
    service_charge,
    youtube_urls,
    title_hi,
    processing_time,
    processing_time_hi,
    work_phrase,
    benefits_hi,
    quiz_skill_code,
    card_image_url,
    category,
    city,
    slug,
    seo_title,
    seo_description,
    indexable,
    hidden_from_public,
    use_saved_copy
  ) VALUES (
    p_employer_id,
    p_patch->>'title',
    p_patch->>'description',
    NULLIF(p_patch->>'requirements', ''),
    NULLIF(p_patch->>'benefits', ''),
    NULLIF(p_patch->>'responsibilities', ''),
    p_patch->>'location',
    p_patch->>'country',
    p_patch->>'job_type',
    p_patch->>'experience_level',
    NULLIF(p_patch->>'salary_min', '')::numeric,
    NULLIF(p_patch->>'salary_max', '')::numeric,
    COALESCE(NULLIF(p_patch->>'currency', ''), 'INR'),
    NULLIF(p_patch->>'local_salary_min', '')::numeric,
    NULLIF(p_patch->>'local_salary_max', '')::numeric,
    NULLIF(p_patch->>'local_salary_currency', ''),
    NULLIF(p_patch->>'salary_display', ''),
    COALESCE(NULLIF(p_patch->>'openings', '')::integer, 1),
    COALESCE((p_patch->>'visa_sponsorship')::boolean, false),
    COALESCE((p_patch->>'remote_allowed')::boolean, false),
    v_status,
    CASE
      WHEN p_patch ? 'posted_at' THEN NULLIF(p_patch->>'posted_at', '')::timestamptz
      WHEN v_status = 'ACTIVE' THEN now()
      ELSE NULL
    END,
    CASE
      WHEN NOT (p_patch ? 'expires_at') THEN NULL
      WHEN NULLIF(p_patch->>'expires_at', '') IS NULL THEN NULL
      ELSE (p_patch->>'expires_at')::timestamptz
    END,
    'admin',
    auth.uid(),
    COALESCE(NULLIF(p_patch->>'service_charge', '')::numeric, 35400),
    CASE
      WHEN p_patch ? 'youtube_urls' THEN public.normalize_job_youtube_urls(p_patch->'youtube_urls')
      ELSE '{}'::text[]
    END,
    NULLIF(p_patch->>'title_hi', ''),
    NULLIF(p_patch->>'processing_time', ''),
    NULLIF(p_patch->>'processing_time_hi', ''),
    NULLIF(p_patch->>'work_phrase', ''),
    NULLIF(p_patch->>'benefits_hi', ''),
    NULLIF(p_patch->>'quiz_skill_code', ''),
    NULLIF(p_patch->>'card_image_url', ''),
    NULLIF(p_patch->>'category', ''),
    NULLIF(p_patch->>'city', ''),
    NULLIF(p_patch->>'slug', ''),
    NULLIF(p_patch->>'seo_title', ''),
    NULLIF(p_patch->>'seo_description', ''),
    COALESCE((p_patch->>'indexable')::boolean, true),
    COALESCE((p_patch->>'hidden_from_public')::boolean, false),
    COALESCE((p_patch->>'use_saved_copy')::boolean, false)
  )
  RETURNING id INTO v_job_id;

  IF p_skills IS NOT NULL THEN
    INSERT INTO public.job_skills (job_id, skill_name)
    SELECT v_job_id, trim(s)
    FROM unnest(p_skills) AS s
    WHERE length(trim(s)) > 0;
  END IF;

  RETURN v_job_id;
END;
$$;

ALTER TABLE public.journey_rules
  ADD COLUMN IF NOT EXISTS stage_expectations jsonb NOT NULL DEFAULT jsonb_build_object(
    'identity', 'Usually within a few hours',
    'interview', 'Usually scheduled within 1–2 days',
    'pdot', 'Batch usually confirmed within a few days',
    'offer', 'SafeWork or the employer uploads the PDF'
  );

DROP FUNCTION IF EXISTS public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb);

CREATE FUNCTION public.admin_save_journey_rules(
  p_trade_test_skills text[],
  p_medical_intro text,
  p_medical_tests jsonb,
  p_deployment_checklist jsonb,
  p_terms_version text,
  p_terms_summary text,
  p_terms_sections jsonb,
  p_stage_expectations jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skills text[];
  v_intro text;
  v_version text;
  v_summary text;
  v_item jsonb;
  v_key text;
  v_keys text[] := ARRAY[]::text[];
  v_ids text[] := ARRAY[]::text[];
  v_stage text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT coalesce(array_agg(item), '{}'::text[])
  INTO v_skills
  FROM (
    SELECT trim(item) AS item
    FROM unnest(coalesce(p_trade_test_skills, '{}'::text[])) AS item
    WHERE length(trim(item)) > 0
  ) cleaned;

  IF cardinality(v_skills) < 1 OR cardinality(v_skills) > 40 THEN
    RAISE EXCEPTION 'choose between 1 and 40 trades that require a physical trade test';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_skills) AS item WHERE length(item) > 80) THEN
    RAISE EXCEPTION 'each trade name must be 80 characters or fewer';
  END IF;

  v_intro := trim(coalesce(p_medical_intro, ''));
  IF length(v_intro) < 10 OR length(v_intro) > 500 THEN
    RAISE EXCEPTION 'medical instructions must be between 10 and 500 characters';
  END IF;
  IF jsonb_typeof(p_medical_tests) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_medical_tests) < 1
     OR jsonb_array_length(p_medical_tests) > 12
  THEN
    RAISE EXCEPTION 'enter between 1 and 12 medical tests';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_medical_tests)
  LOOP
    IF length(trim(coalesce(v_item->>'title', ''))) < 2
       OR length(trim(coalesce(v_item->>'title', ''))) > 80
       OR length(trim(coalesce(v_item->>'body', ''))) < 2
       OR length(trim(coalesce(v_item->>'body', ''))) > 500
    THEN
      RAISE EXCEPTION 'each medical test needs a title and a description';
    END IF;
  END LOOP;

  IF jsonb_typeof(p_deployment_checklist) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_deployment_checklist) < 1
     OR jsonb_array_length(p_deployment_checklist) > 20
  THEN
    RAISE EXCEPTION 'enter between 1 and 20 deployment checklist items';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_deployment_checklist)
  LOOP
    v_key := lower(trim(coalesce(v_item->>'key', '')));
    IF v_key !~ '^[a-z][a-z0-9_]{0,40}$' THEN
      RAISE EXCEPTION 'checklist keys must be short lowercase words';
    END IF;
    IF v_key = ANY (v_keys) THEN
      RAISE EXCEPTION 'checklist keys must be unique';
    END IF;
    IF length(trim(coalesce(v_item->>'label', ''))) < 2
       OR length(trim(coalesce(v_item->>'label', ''))) > 80
    THEN
      RAISE EXCEPTION 'each checklist item needs a label';
    END IF;
    v_keys := array_append(v_keys, v_key);
  END LOOP;

  v_version := trim(coalesce(p_terms_version, ''));
  v_summary := trim(coalesce(p_terms_summary, ''));
  IF length(v_version) < 3 OR length(v_version) > 80 THEN
    RAISE EXCEPTION 'terms version is required';
  END IF;
  IF length(v_summary) < 10 OR length(v_summary) > 1000 THEN
    RAISE EXCEPTION 'terms summary must be between 10 and 1000 characters';
  END IF;
  IF jsonb_typeof(p_terms_sections) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_terms_sections) < 1
     OR jsonb_array_length(p_terms_sections) > 12
  THEN
    RAISE EXCEPTION 'enter between 1 and 12 terms sections';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_terms_sections)
  LOOP
    v_key := lower(trim(coalesce(v_item->>'id', '')));
    IF v_key !~ '^[a-z][a-z0-9_]{0,40}$' OR v_key = ANY (v_ids) THEN
      RAISE EXCEPTION 'each terms section needs a unique id';
    END IF;
    IF length(trim(coalesce(v_item->>'title', ''))) < 2
       OR length(trim(v_item->>'title')) > 80
       OR length(trim(coalesce(v_item->>'body', ''))) < 10
       OR length(trim(v_item->>'body')) > 2000
    THEN
      RAISE EXCEPTION 'each terms section needs a title and a body';
    END IF;
    v_ids := array_append(v_ids, v_key);
  END LOOP;

  IF p_stage_expectations IS NOT NULL THEN
    IF jsonb_typeof(p_stage_expectations) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'stage timing must be an object';
    END IF;
    FOREACH v_stage IN ARRAY ARRAY['identity', 'interview', 'pdot', 'offer']
    LOOP
      IF length(trim(coalesce(p_stage_expectations->>v_stage, ''))) < 3
         OR length(trim(p_stage_expectations->>v_stage)) > 160
      THEN
        RAISE EXCEPTION 'each stage timing line must be between 3 and 160 characters';
      END IF;
    END LOOP;
  END IF;

  UPDATE public.journey_rules
  SET
    trade_test_skills = v_skills,
    medical_intro = v_intro,
    medical_tests = p_medical_tests,
    deployment_checklist = p_deployment_checklist,
    terms_version = v_version,
    terms_summary = v_summary,
    terms_sections = p_terms_sections,
    stage_expectations = COALESCE(p_stage_expectations, stage_expectations),
    updated_at = now()
  WHERE id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb, jsonb) TO authenticated;
