-- Field-level log of changes a worker, or a partner acting for them, makes
-- to profile, documents, journey answers, and job applications.
-- Admin and system writes are not recorded.

CREATE TABLE IF NOT EXISTS public.worker_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Plain uuid: the same user is often both worker and actor. A second FK
  -- with a different ON DELETE action would block deleting that user.
  actor_id uuid,
  actor_kind text NOT NULL CHECK (actor_kind IN ('worker', 'partner')),
  area text NOT NULL CHECK (area IN ('profile', 'document', 'journey', 'application')),
  action text NOT NULL CHECK (action IN ('created', 'updated', 'removed')),
  field text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worker_change_log_worker_idx
  ON public.worker_change_log (worker_id, created_at DESC);

ALTER TABLE public.worker_change_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.worker_change_log TO authenticated;

DROP POLICY IF EXISTS "Admins read worker change log" ON public.worker_change_log;
CREATE POLICY "Admins read worker change log"
  ON public.worker_change_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.worker_change_clip(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_value IS NULL THEN NULL ELSE left(p_value, 500) END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_bool(p_value boolean)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_value IS NULL THEN NULL WHEN p_value THEN 'Yes' ELSE 'No' END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_num(p_value numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_value IS NULL THEN NULL ELSE trim(to_char(p_value, 'FM999999990.##')) END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_list(p_value text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(btrim(array_to_string(p_value, ', ')), '');
$$;

CREATE OR REPLACE FUNCTION public.worker_change_mask(p_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits text := regexp_replace(COALESCE(p_value, ''), '\s', '', 'g');
BEGIN
  IF v_digits = '' THEN
    RETURN NULL;
  END IF;
  IF length(v_digits) <= 4 THEN
    RETURN '••••';
  END IF;
  RETURN '••••' || right(v_digits, 4);
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_salary(
  p_min numeric,
  p_max numeric,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_min text := public.worker_change_num(p_min);
  v_max text := public.worker_change_num(p_max);
  v_currency text := NULLIF(btrim(COALESCE(p_currency, '')), '');
BEGIN
  IF v_min IS NULL AND v_max IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN trim(both ' ' FROM concat_ws(' ',
    CASE
      WHEN v_min IS NOT NULL AND v_max IS NOT NULL AND v_min IS DISTINCT FROM v_max THEN v_min || '–' || v_max
      ELSE COALESCE(v_min, v_max)
    END,
    COALESCE(v_currency, 'INR')
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_job_title(p_job_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(btrim(title), ''), 'Untitled job')
  FROM public.jobs
  WHERE id = p_job_id;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_doc_label(p_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(btrim(COALESCE(p_type, '')))
    WHEN 'aadhaar' THEN 'Aadhaar'
    WHEN 'aadhaar_front' THEN 'Aadhaar front'
    WHEN 'aadhaar_back' THEN 'Aadhaar back'
    WHEN 'aadhar' THEN 'Aadhaar'
    WHEN 'pan' THEN 'PAN'
    WHEN 'pan card' THEN 'PAN'
    WHEN 'passport' THEN 'Passport'
    WHEN 'passport_front' THEN 'Passport front'
    WHEN 'passport_last' THEN 'Passport last page'
    WHEN 'selfie' THEN 'Selfie'
    WHEN 'tenth_marksheet' THEN '10th marksheet'
    WHEN 'certificate' THEN 'Certificate'
    WHEN 'id_proof' THEN 'ID proof'
    WHEN 'id_card' THEN 'ID card'
    WHEN 'identity card' THEN 'ID card'
    WHEN 'national_id' THEN 'National ID'
    WHEN 'driving license' THEN 'Driving licence'
    WHEN 'medical_report' THEN 'Medical report'
    WHEN '' THEN 'Document'
    ELSE initcap(replace(btrim(p_type), '_', ' '))
  END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_file_name(p_path text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(p_path, ''), '^.*/', ''), '');
$$;

-- Records one line when the signed-in user is the worker or their partner.
CREATE OR REPLACE FUNCTION public.worker_change_log_write(
  p_worker_id uuid,
  p_area text,
  p_action text,
  p_field text,
  p_old text,
  p_new text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_kind text;
  v_old text := public.worker_change_clip(p_old);
  v_new text := public.worker_change_clip(p_new);
BEGIN
  IF p_worker_id IS NULL OR v_actor IS NULL THEN
    RETURN;
  END IF;

  IF v_actor = p_worker_id THEN
    v_kind := 'worker';
  ELSIF public.has_role(v_actor, 'admin'::app_role) THEN
    RETURN;
  ELSIF public.partner_manages_worker(p_worker_id) THEN
    v_kind := 'partner';
  ELSE
    RETURN;
  END IF;

  IF p_action = 'updated' AND v_old IS NOT DISTINCT FROM v_new THEN
    RETURN;
  END IF;

  -- The same save often writes one fact onto two tables.
  IF EXISTS (
    SELECT 1
    FROM public.worker_change_log l
    WHERE l.worker_id = p_worker_id
      AND l.field = p_field
      AND l.action = p_action
      AND l.old_value IS NOT DISTINCT FROM v_old
      AND l.new_value IS NOT DISTINCT FROM v_new
      AND l.created_at >= now() - interval '3 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.worker_change_log (
    worker_id, actor_id, actor_kind, area, action, field, old_value, new_value
  ) VALUES (
    p_worker_id, v_actor, v_kind, p_area, p_action, p_field, v_old, v_new
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_change_log_diff(
  p_worker_id uuid,
  p_area text,
  p_field text,
  p_old text,
  p_new text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_old IS NOT DISTINCT FROM p_new THEN
    RETURN;
  END IF;
  PERFORM public.worker_change_log_write(p_worker_id, p_area, 'updated', p_field, p_old, p_new);
END;
$$;

REVOKE ALL ON FUNCTION public.worker_change_clip(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_bool(boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_num(numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_list(text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_mask(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_salary(numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_job_title(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_doc_label(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_file_name(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_log_write(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_change_log_diff(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_worker_profile_account_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(NEW.id, 'worker'::app_role)
    OR EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.user_id = NEW.id)
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.worker_change_log_diff(NEW.id, 'profile', 'Name', OLD.full_name, NEW.full_name);
  PERFORM public.worker_change_log_diff(NEW.id, 'profile', 'Phone', OLD.phone, NEW.phone);
  PERFORM public.worker_change_log_diff(NEW.id, 'profile', 'Email', OLD.email, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_profile_account_change ON public.profiles;
CREATE TRIGGER trg_log_worker_profile_account_change
  AFTER UPDATE OF full_name, phone, email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_profile_account_change();

CREATE OR REPLACE FUNCTION public.log_worker_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.worker_change_log_write(NEW.user_id, 'profile', 'created', 'Profile', NULL, NULL);
    RETURN NEW;
  END IF;

  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'City', OLD.current_city, NEW.current_city);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Gender', OLD.gender, NEW.gender);
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Languages',
    public.worker_change_list(OLD.languages),
    public.worker_change_list(NEW.languages)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Years of experience',
    public.worker_change_num(OLD.years_of_experience),
    public.worker_change_num(NEW.years_of_experience)
  );
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Trade', OLD.primary_work_type, NEW.primary_work_type);
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Other skills',
    public.worker_change_list(OLD.secondary_skills),
    public.worker_change_list(NEW.secondary_skills)
  );
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Skill level', OLD.skill_level, NEW.skill_level);
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Expected salary',
    public.worker_change_salary(OLD.expected_salary_min, OLD.expected_salary_max, OLD.currency),
    public.worker_change_salary(NEW.expected_salary_min, NEW.expected_salary_max, NEW.currency)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', '10th pass',
    public.worker_change_bool(OLD.tenth_pass_confirmed),
    public.worker_change_bool(NEW.tenth_pass_confirmed)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Aadhaar',
    public.worker_change_mask(OLD.aadhaar_number),
    public.worker_change_mask(NEW.aadhaar_number)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'PAN',
    public.worker_change_mask(OLD.pan_number),
    public.worker_change_mask(NEW.pan_number)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Passport number',
    public.worker_change_mask(OLD.passport_number),
    public.worker_change_mask(NEW.passport_number)
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Passport expiry',
    OLD.passport_expiry::text,
    NEW.passport_expiry::text
  );
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Has passport',
    public.worker_change_bool(OLD.has_passport),
    public.worker_change_bool(NEW.has_passport)
  );
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Bio', OLD.bio, NEW.bio);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Nationality', OLD.nationality, NEW.nationality);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Country', OLD.country, NEW.country);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Availability', OLD.availability, NEW.availability);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Preferred shift', OLD.preferred_shift, NEW.preferred_shift);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'profile', 'Preferred city', OLD.preferred_work_city, NEW.preferred_work_city);
  PERFORM public.worker_change_log_diff(
    NEW.user_id, 'profile', 'Preferred countries',
    public.worker_change_list(OLD.visa_countries),
    public.worker_change_list(NEW.visa_countries)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_profile_created ON public.worker_profiles;
CREATE TRIGGER trg_log_worker_profile_created
  AFTER INSERT ON public.worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_profile_change();

DROP TRIGGER IF EXISTS trg_log_worker_profile_change ON public.worker_profiles;
CREATE TRIGGER trg_log_worker_profile_change
  AFTER UPDATE OF
    current_city, gender, languages, years_of_experience, primary_work_type, secondary_skills, skill_level,
    expected_salary_min, expected_salary_max, currency, tenth_pass_confirmed,
    aadhaar_number, pan_number, passport_number, passport_expiry, has_passport,
    bio, nationality, country, availability, preferred_shift, preferred_work_city, visa_countries
  ON public.worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_profile_change();

-- ---------------------------------------------------------------------------
-- Journey answers (worker-edited columns only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_worker_journey_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'City', OLD.city, NEW.city);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'District', OLD.district, NEW.district);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'State', OLD.state, NEW.state);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'Education', OLD.education_level, NEW.education_level);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'Gender', OLD.gender, NEW.gender);
  PERFORM public.worker_change_log_diff(NEW.user_id, 'journey', 'Trade', OLD.primary_skill, NEW.primary_skill);

  -- A job switch clears the score. That is not a new Test 1 result.
  IF NEW.quiz_score IS NOT NULL AND OLD.quiz_score IS DISTINCT FROM NEW.quiz_score THEN
    PERFORM public.worker_change_log_write(
      NEW.user_id,
      'journey',
      'updated',
      'Test 1',
      public.worker_change_num(OLD.quiz_score),
      public.worker_change_num(NEW.quiz_score)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_journey_change ON public.worker_verification;
CREATE TRIGGER trg_log_worker_journey_change
  AFTER UPDATE OF city, district, state, education_level, gender, primary_skill, quiz_score
  ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_journey_change();

-- ---------------------------------------------------------------------------
-- Documents and skill proof
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_worker_document_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.worker_change_log_write(
      OLD.worker_id, 'document', 'removed',
      public.worker_change_doc_label(OLD.document_type),
      OLD.document_name, NULL
    );
    RETURN OLD;
  END IF;

  v_label := public.worker_change_doc_label(NEW.document_type);
  IF TG_OP = 'INSERT' THEN
    PERFORM public.worker_change_log_write(
      NEW.worker_id, 'document', 'created', v_label, NULL, NEW.document_name
    );
    RETURN NEW;
  END IF;

  IF OLD.file_url IS DISTINCT FROM NEW.file_url
     OR OLD.document_name IS DISTINCT FROM NEW.document_name
     OR OLD.document_type IS DISTINCT FROM NEW.document_type THEN
    PERFORM public.worker_change_log_write(
      NEW.worker_id, 'document', 'updated', v_label, OLD.document_name, NEW.document_name
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_document_change ON public.worker_documents;
CREATE TRIGGER trg_log_worker_document_change
  AFTER INSERT OR UPDATE OR DELETE ON public.worker_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_document_change();

CREATE OR REPLACE FUNCTION public.log_worker_skill_media_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_label := CASE WHEN OLD.media_type = 'video' THEN 'Skill video' ELSE 'Skill photo' END;
    PERFORM public.worker_change_log_write(
      OLD.worker_id, 'document', 'removed', v_label,
      public.worker_change_file_name(OLD.file_path), NULL
    );
    RETURN OLD;
  END IF;

  v_label := CASE WHEN NEW.media_type = 'video' THEN 'Skill video' ELSE 'Skill photo' END;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.worker_change_log_write(
      NEW.worker_id, 'document', 'created', v_label,
      NULL, public.worker_change_file_name(NEW.file_path)
    );
    RETURN NEW;
  END IF;

  IF OLD.file_path IS DISTINCT FROM NEW.file_path OR OLD.media_type IS DISTINCT FROM NEW.media_type THEN
    PERFORM public.worker_change_log_write(
      NEW.worker_id, 'document', 'updated', v_label,
      public.worker_change_file_name(OLD.file_path),
      public.worker_change_file_name(NEW.file_path)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_skill_media_change ON public.worker_skill_media;
CREATE TRIGGER trg_log_worker_skill_media_change
  AFTER INSERT OR UPDATE OR DELETE ON public.worker_skill_media
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_skill_media_change();

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_worker_application_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  PERFORM public.worker_change_log_write(
    NEW.worker_id,
    'application',
    'created',
    'Application',
    NULL,
    COALESCE(public.worker_change_job_title(NEW.job_id), 'Untitled job')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_application_change ON public.job_applications;
CREATE TRIGGER trg_log_worker_application_change
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_application_change();

CREATE OR REPLACE FUNCTION public.log_worker_job_switch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The first choice is already "Applied to {job}".
  IF NEW.from_job_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.worker_change_log_write(
    NEW.worker_id,
    'application',
    'updated',
    'Job',
    public.worker_change_job_title(NEW.from_job_id),
    COALESCE(public.worker_change_job_title(NEW.to_job_id), 'Untitled job')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_worker_job_switch ON public.worker_journey_job_changes;
CREATE TRIGGER trg_log_worker_job_switch
  AFTER INSERT ON public.worker_journey_job_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_job_switch();

-- ---------------------------------------------------------------------------
-- Backfill what is already on file. Older profile and document edits are not
-- invented, because the previous values were never stored.
-- ---------------------------------------------------------------------------

INSERT INTO public.worker_change_log (
  worker_id, actor_id, actor_kind, area, action, field, old_value, new_value, created_at
)
SELECT
  ja.worker_id,
  ja.worker_id,
  'worker',
  'application',
  'created',
  'Application',
  NULL,
  COALESCE(NULLIF(btrim(j.title), ''), 'Untitled job'),
  COALESCE(ja.applied_at, ja.updated_at, now())
FROM public.job_applications ja
LEFT JOIN public.jobs j ON j.id = ja.job_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.worker_change_log existing
  WHERE existing.worker_id = ja.worker_id
    AND existing.field = 'Application'
    AND existing.action = 'created'
    AND existing.new_value = COALESCE(NULLIF(btrim(j.title), ''), 'Untitled job')
    AND existing.created_at = COALESCE(ja.applied_at, ja.updated_at, now())
);

INSERT INTO public.worker_change_log (
  worker_id, actor_id, actor_kind, area, action, field, old_value, new_value, created_at
)
SELECT
  ch.worker_id,
  CASE
    WHEN ch.created_by IS NOT NULL
      AND (
        ch.created_by = ch.worker_id
        OR public.has_role(ch.created_by, 'partner'::app_role)
      )
    THEN ch.created_by
    ELSE ch.worker_id
  END,
  CASE
    WHEN ch.created_by IS NOT NULL
      AND ch.created_by IS DISTINCT FROM ch.worker_id
      AND public.has_role(ch.created_by, 'partner'::app_role)
    THEN 'partner'
    ELSE 'worker'
  END,
  'application',
  'updated',
  'Job',
  public.worker_change_job_title(ch.from_job_id),
  COALESCE(public.worker_change_job_title(ch.to_job_id), 'Untitled job'),
  ch.created_at
FROM public.worker_journey_job_changes ch
WHERE ch.from_job_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.worker_change_log existing
    WHERE existing.worker_id = ch.worker_id
      AND existing.field = 'Job'
      AND existing.created_at = ch.created_at
  );
