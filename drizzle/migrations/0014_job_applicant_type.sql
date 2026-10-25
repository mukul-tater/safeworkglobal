ALTER TABLE public.jobs ADD COLUMN applicant_type text;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_applicant_type_valid CHECK (applicant_type IS NULL OR applicant_type IN ('male', 'female', 'couples'));
COMMENT ON COLUMN public.jobs.applicant_type IS 'Admin-specified applicant group; null means unspecified. Does not change application eligibility.';
DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.admin_create_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  definition := replace(definition, '    video_urls' || chr(10) || '  ) VALUES (', '    video_urls,' || chr(10) || '    applicant_type' || chr(10) || '  ) VALUES (');
  definition := replace(definition, '  RETURNING id INTO v_job_id;', '  RETURNING id INTO v_job_id;' || chr(10) || '  IF p_patch ? ''applicant_type'' THEN' || chr(10) || '    UPDATE public.jobs SET applicant_type = NULLIF(p_patch->>''applicant_type'', '''') WHERE id = v_job_id;' || chr(10) || '  END IF;');
  -- The insert retains its existing columns and values; the new field is applied atomically before return.
  definition := replace(definition, '    video_urls,' || chr(10) || '    applicant_type' || chr(10) || '  ) VALUES (', '    video_urls' || chr(10) || '  ) VALUES (');
  EXECUTE definition;
  SELECT pg_get_functiondef('public.admin_update_job(uuid,jsonb,text[])'::regprocedure) INTO definition;
  definition := replace(definition, '    updated_at = now()', '    applicant_type = CASE WHEN p_patch ? ''applicant_type'' THEN NULLIF(p_patch->>''applicant_type'', '''') ELSE applicant_type END,' || chr(10) || '    updated_at = now()');
  EXECUTE definition;
END;
$migration$;