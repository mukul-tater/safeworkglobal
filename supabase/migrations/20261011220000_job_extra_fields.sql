-- Extra requirements an admin can add to one job.
-- Each row is a photo or a short text answer the worker must provide to apply.

CREATE TABLE IF NOT EXISTS public.job_extra_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  label text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('photo', 'text')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_extra_fields_label_len CHECK (char_length(label) BETWEEN 1 AND 120)
);

CREATE UNIQUE INDEX IF NOT EXISTS job_extra_fields_job_label_key
  ON public.job_extra_fields (job_id, lower(label));

CREATE INDEX IF NOT EXISTS idx_job_extra_fields_job
  ON public.job_extra_fields (job_id, sort_order);

CREATE TABLE IF NOT EXISTS public.job_application_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.job_extra_fields(id) ON DELETE CASCADE,
  text_value text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, field_id),
  CONSTRAINT job_application_answers_one_value CHECK (
    (text_value IS NOT NULL AND file_path IS NULL)
    OR (file_path IS NOT NULL AND text_value IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_job_application_answers_application
  ON public.job_application_answers (application_id);

CREATE INDEX IF NOT EXISTS idx_job_application_answers_field
  ON public.job_application_answers (field_id);

CREATE OR REPLACE FUNCTION public.normalize_job_extra_field()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.label := btrim(NEW.label);
  IF char_length(NEW.label) < 1 OR char_length(NEW.label) > 120 THEN
    RAISE EXCEPTION 'Each requirement needs a label of 1 to 120 characters';
  END IF;
  IF NEW.value_type NOT IN ('photo', 'text') THEN
    RAISE EXCEPTION 'Requirement type must be photo or text';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_job_extra_field ON public.job_extra_fields;
CREATE TRIGGER normalize_job_extra_field
  BEFORE INSERT OR UPDATE ON public.job_extra_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_job_extra_field();

CREATE OR REPLACE FUNCTION public.clear_job_extra_answers_on_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.value_type IS DISTINCT FROM NEW.value_type THEN
    DELETE FROM public.job_application_answers WHERE field_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clear_job_extra_answers_on_type_change ON public.job_extra_fields;
CREATE TRIGGER clear_job_extra_answers_on_type_change
  BEFORE UPDATE ON public.job_extra_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_job_extra_answers_on_type_change();

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

DROP TRIGGER IF EXISTS validate_job_application_answer ON public.job_application_answers;
CREATE TRIGGER validate_job_application_answer
  BEFORE INSERT OR UPDATE ON public.job_application_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_application_answer();

ALTER TABLE public.job_extra_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_answers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.job_extra_fields FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_extra_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_extra_fields TO authenticated;

REVOKE ALL ON public.job_application_answers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_application_answers TO authenticated;

DROP POLICY IF EXISTS "Read extra fields on visible jobs" ON public.job_extra_fields;
CREATE POLICY "Read extra fields on visible jobs"
  ON public.job_extra_fields FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_extra_fields.job_id
        AND (
          j.status = 'ACTIVE'
          OR j.employer_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  );

DROP POLICY IF EXISTS "Admins manage job extra fields" ON public.job_extra_fields;
CREATE POLICY "Admins manage job extra fields"
  ON public.job_extra_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Read own or admin job answers" ON public.job_application_answers;
CREATE POLICY "Read own or admin job answers"
  ON public.job_application_answers FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_answers.application_id
        AND ja.worker_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workers write own job answers" ON public.job_application_answers;
CREATE POLICY "Workers write own job answers"
  ON public.job_application_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_extra_fields f ON f.id = job_application_answers.field_id
      WHERE ja.id = job_application_answers.application_id
        AND ja.worker_id = auth.uid()
        AND ja.job_id = f.job_id
    )
  );

DROP POLICY IF EXISTS "Workers update own job answers" ON public.job_application_answers;
CREATE POLICY "Workers update own job answers"
  ON public.job_application_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = job_application_answers.application_id
        AND ja.worker_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_extra_fields f ON f.id = job_application_answers.field_id
      WHERE ja.id = job_application_answers.application_id
        AND ja.worker_id = auth.uid()
        AND ja.job_id = f.job_id
    )
  );
