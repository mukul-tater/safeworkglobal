ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS journey_requirements jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_journey_requirements_object
  CHECK (jsonb_typeof(journey_requirements) = 'object');

COMMENT ON COLUMN public.jobs.journey_requirements IS
  'Job-specific worker eligibility checks collected after pre-placement declarations.';

DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.admin_create_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  IF definition IS NOT NULL THEN
    definition := replace(definition, '  RETURNING id INTO v_job_id;', '  RETURNING id INTO v_job_id;' || chr(10) || '  IF p_patch ? ''journey_requirements'' THEN' || chr(10) || '    UPDATE public.jobs SET journey_requirements = CASE WHEN jsonb_typeof(p_patch->''journey_requirements'') = ''object'' THEN p_patch->''journey_requirements'' ELSE ''{}''::jsonb END WHERE id = v_job_id;' || chr(10) || '  END IF;');
    EXECUTE definition;
  END IF;

  SELECT pg_get_functiondef('public.admin_update_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  IF definition IS NOT NULL THEN
    definition := replace(definition, '    updated_at = now()', '    journey_requirements = CASE WHEN p_patch ? ''journey_requirements'' AND jsonb_typeof(p_patch->''journey_requirements'') = ''object'' THEN p_patch->''journey_requirements'' ELSE journey_requirements END,' || chr(10) || '    updated_at = now()');
    EXECUTE definition;
  END IF;
END;
$migration$;
