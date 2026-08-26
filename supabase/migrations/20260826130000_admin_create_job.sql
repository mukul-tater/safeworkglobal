-- Admins can post jobs on behalf of an employer, and every job records
-- whether it was created by an employer or an admin.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS posted_by_role text NOT NULL DEFAULT 'employer',
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_posted_by_role_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_posted_by_role_check
  CHECK (posted_by_role IN ('employer', 'admin'));

COMMENT ON COLUMN public.jobs.posted_by_role IS
  'Who created the listing: employer (self-serve) or admin (posted on behalf of the employer).';
COMMENT ON COLUMN public.jobs.created_by IS
  'User id of the person who created the job.';

CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_role ON public.jobs (posted_by_role);

-- Stamp attribution on insert; employers cannot spoof or rewrite it.
CREATE OR REPLACE FUNCTION public.stamp_job_posted_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    IF public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.posted_by_role := COALESCE(NULLIF(NEW.posted_by_role, ''), 'admin');
    ELSIF auth.uid() IS NOT NULL THEN
      NEW.posted_by_role := 'employer';
    ELSE
      NEW.posted_by_role := COALESCE(NULLIF(NEW.posted_by_role, ''), 'employer');
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() IS NOT NULL THEN
      NEW.posted_by_role := OLD.posted_by_role;
      NEW.created_by := OLD.created_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_job_posted_by ON public.jobs;
CREATE TRIGGER trg_stamp_job_posted_by
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_job_posted_by();

DROP POLICY IF EXISTS "Admins can create jobs" ON public.jobs;
CREATE POLICY "Admins can create jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

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
    openings,
    visa_sponsorship,
    remote_allowed,
    status,
    posted_at,
    expires_at,
    posted_by_role,
    created_by
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
    auth.uid()
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

REVOKE EXECUTE ON FUNCTION public.admin_create_job(uuid, jsonb, text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_create_job(uuid, jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_job(uuid, jsonb, text[]) TO service_role;
