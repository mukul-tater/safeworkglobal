-- Allow 'date' type for job extra requirements (e.g. driving license expiry/issue dates)

DO $$
BEGIN
  ALTER TABLE public.job_extra_fields DROP CONSTRAINT IF EXISTS job_extra_fields_value_type_check;
  ALTER TABLE public.job_extra_fields ADD CONSTRAINT job_extra_fields_value_type_check CHECK (value_type IN ('photo', 'text', 'date'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_job_extra_field()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.label := btrim(NEW.label);
  IF char_length(NEW.label) < 1 OR char_length(NEW.label) > 120 THEN
    RAISE EXCEPTION 'Each requirement needs a label of 1 to 120 characters';
  END IF;
  IF NEW.value_type NOT IN ('photo', 'text', 'date') THEN
    RAISE EXCEPTION 'Requirement type must be photo, text, or date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_job_application_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_job_id uuid;
  v_worker uuid;
  v_app_job uuid;
BEGIN
  SELECT value_type, job_id INTO v_type, v_job_id
  FROM public.job_extra_fields
  WHERE id = NEW.field_id;

  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Requirement not found';
  END IF;

  SELECT job_id, worker_id INTO v_app_job, v_worker
  FROM public.job_applications
  WHERE id = NEW.application_id;

  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_app_job IS DISTINCT FROM v_job_id THEN
    RAISE EXCEPTION 'This requirement does not belong to the job';
  END IF;

  IF v_type = 'text' THEN
    NEW.file_path := NULL;
    NEW.text_value := btrim(COALESCE(NEW.text_value, ''));
    IF char_length(NEW.text_value) < 1 OR char_length(NEW.text_value) > 2000 THEN
      RAISE EXCEPTION 'Enter an answer of 1 to 2000 characters';
    END IF;
  ELSIF v_type = 'date' THEN
    NEW.file_path := NULL;
    NEW.text_value := btrim(COALESCE(NEW.text_value, ''));
    IF char_length(NEW.text_value) < 1 OR char_length(NEW.text_value) > 50 THEN
      RAISE EXCEPTION 'Enter a valid date';
    END IF;
  ELSIF v_type = 'photo' THEN
    NEW.text_value := NULL;
    NEW.file_path := btrim(COALESCE(NEW.file_path, ''));
    IF NEW.file_path !~ ('^' || v_worker::text || '/job-extra/') THEN
      RAISE EXCEPTION 'Photo must be uploaded for this worker';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

