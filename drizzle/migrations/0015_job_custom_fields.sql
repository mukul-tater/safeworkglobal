ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.jobs.custom_fields IS 'Admin-specified dynamic custom attributes (label/value pairs), including one or more company names.';
DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.admin_create_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  IF definition IS NOT NULL THEN
    definition := replace(definition, '  RETURNING id INTO v_job_id;', '  RETURNING id INTO v_job_id;' || chr(10) || '  IF p_patch ? ''custom_fields'' THEN' || chr(10) || '    UPDATE public.jobs SET custom_fields = COALESCE(p_patch->''custom_fields'', ''[]''::jsonb) WHERE id = v_job_id;' || chr(10) || '  END IF;');
    EXECUTE definition;
  END IF;

  SELECT pg_get_functiondef('public.admin_update_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  IF definition IS NOT NULL THEN
    definition := replace(definition, '    updated_at = now()', '    custom_fields = CASE WHEN p_patch ? ''custom_fields'' THEN COALESCE(p_patch->''custom_fields'', ''[]''::jsonb) ELSE custom_fields END,' || chr(10) || '    updated_at = now()');
    EXECUTE definition;
  END IF;
END;
$migration$;
