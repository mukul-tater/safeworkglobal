-- Phase 3: journey wording an admin can edit. Null journey_copy keeps the built-in sentences.
-- Step order and stage timing are unchanged.

ALTER TABLE public.journey_rules
  ADD COLUMN IF NOT EXISTS journey_copy jsonb;

DROP FUNCTION IF EXISTS public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb, jsonb);

CREATE FUNCTION public.admin_save_journey_rules(
  p_trade_test_skills text[],
  p_medical_intro text,
  p_medical_tests jsonb,
  p_deployment_checklist jsonb,
  p_terms_version text,
  p_terms_summary text,
  p_terms_sections jsonb,
  p_stage_expectations jsonb DEFAULT NULL,
  p_journey_copy jsonb DEFAULT NULL
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

  IF p_journey_copy IS NOT NULL AND jsonb_typeof(p_journey_copy) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'journey copy must be an object';
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
    journey_copy = CASE WHEN p_journey_copy IS NULL THEN journey_copy ELSE p_journey_copy END,
    updated_at = now()
  WHERE id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb, jsonb, jsonb) TO authenticated;
