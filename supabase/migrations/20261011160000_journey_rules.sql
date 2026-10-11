-- Admin-editable journey rules: trade-test trades, medical copy,
-- deployment checklist labels, and worker terms.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS deploy_extra jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.journey_rules (
  id int PRIMARY KEY CHECK (id = 1),
  trade_test_skills text[] NOT NULL,
  medical_intro text NOT NULL,
  medical_tests jsonb NOT NULL,
  deployment_checklist jsonb NOT NULL,
  terms_version text NOT NULL,
  terms_summary text NOT NULL,
  terms_sections jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.journey_rules (
  id,
  trade_test_skills,
  medical_intro,
  medical_tests,
  deployment_checklist,
  terms_version,
  terms_summary,
  terms_sections
)
VALUES (
  1,
  ARRAY[
    'Electrician', 'Welder', 'MIG Welder', 'TIG Welder', 'Plumber', 'Pipe Fitter',
    'Mason', 'Mason (tiles/marble)', 'Mason (bricks/plaster)', 'Steel Fixer',
    'Carpenter', 'Shuttering Carpenter', 'Furniture Carpenter - Finishing, All Rounder',
    'HVAC Technician', 'AC Technician', 'Aluminium Fixer/Fabricator'
  ],
  'Get these tests done at any nearest laboratory, then upload the reports on this portal.',
  '[
    {"title":"Blood test","body":"Screens for HIV, Syphilis, and Hepatitis B & C. Additional vaccinations or tests may apply for specific professions like food handlers or healthcare workers."},
    {"title":"Chest X-ray","body":"Screens for active or pulmonary Tuberculosis (TB)."}
  ]'::jsonb,
  '[
    {"key":"offer","label":"Offer letter"},
    {"key":"contract","label":"Employment contract"},
    {"key":"emigration","label":"Emigration / PoE clearance"},
    {"key":"visa","label":"Visa"},
    {"key":"insurance","label":"Insurance"},
    {"key":"ticket","label":"Flight ticket"}
  ]'::jsonb,
  'worker-v1-2026-07',
  'I confirm I am medically fit for overseas skilled work and will provide truthful information. I agree to SafeWork Global’s terms, privacy policy, and fair-recruitment rules (no unauthorized fees). I understand skill checks, interviews, and document verification are part of becoming GCC-ready.',
  '[
    {"id":"platform","title":"Platform terms","body":"By creating an account you agree to SafeWork Global’s Terms of Service and Privacy Policy. SafeWork connects verified workers with overseas employers and partners. We do not guarantee a job offer."},
    {"id":"medical","title":"Medical fitness","body":"You declare that you are medically fit to travel and work abroad in your trade, subject to formal medical examination when required. You will disclose known conditions that may affect fitness for work."},
    {"id":"truthful","title":"Truthful information","body":"All details you provide (identity, skills, experience, documents, media) must be accurate. False information may lead to rejection or removal from the platform."},
    {"id":"fees","title":"No unauthorized fees","body":"You will not pay any agent or person unauthorized fees for jobs, visas, or placement. Report any such demand to SafeWork immediately. Official assessment or process fees are only those shown inside this portal."},
    {"id":"skills","title":"Skill verification","body":"You agree to complete skill checks (quiz, media, video interview) and, if required, physical trade tests and medical tests arranged through SafeWork or approved partners (including E-Mitra)."},
    {"id":"bond","title":"Agreement — Indemnity Bond","body":"When selected for placement you must execute an Indemnity Bond (consent, employment continuation bond and guarantee) on ₹100 stamp paper, get it notarised, and upload it or send it with Aadhaar copies of the worker and the guarantor."},
    {"id":"contact","title":"Contact","body":"For questions, use in-app support or Contact Us on safeworkglobal.com."}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.journey_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read journey rules" ON public.journey_rules;
CREATE POLICY "Anyone can read journey rules"
  ON public.journey_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.journey_rules FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.journey_rules TO anon, authenticated;
GRANT ALL ON public.journey_rules TO service_role;

CREATE OR REPLACE FUNCTION public.admin_save_journey_rules(
  p_trade_test_skills text[],
  p_medical_intro text,
  p_medical_tests jsonb,
  p_deployment_checklist jsonb,
  p_terms_version text,
  p_terms_summary text,
  p_terms_sections jsonb
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

  UPDATE public.journey_rules
  SET
    trade_test_skills = v_skills,
    medical_intro = v_intro,
    medical_tests = p_medical_tests,
    deployment_checklist = p_deployment_checklist,
    terms_version = v_version,
    terms_summary = v_summary,
    terms_sections = p_terms_sections,
    updated_at = now()
  WHERE id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_journey_rules(text[], text, jsonb, jsonb, text, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_deploy_extra(
  p_user_id uuid,
  p_extra jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_value text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF p_extra IS NULL OR jsonb_typeof(p_extra) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'extra checklist must be an object';
  END IF;
  FOR v_key, v_value IN SELECT key, value FROM jsonb_each_text(p_extra)
  LOOP
    IF v_key !~ '^[a-z][a-z0-9_]{0,40}$' THEN
      RAISE EXCEPTION 'invalid checklist key';
    END IF;
    IF v_value NOT IN ('pending', 'in_progress', 'completed') THEN
      RAISE EXCEPTION 'checklist status must be pending, in progress, or completed';
    END IF;
  END LOOP;

  UPDATE public.worker_verification
  SET deploy_extra = p_extra, updated_at = now()
  WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'worker journey not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_deploy_extra(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_deploy_extra(uuid, jsonb) TO authenticated;
