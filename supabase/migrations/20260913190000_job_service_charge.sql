-- Per-job SafeWork Global service charge (INR). Admins can set this on any listing.
-- Workers see it on Find jobs; Razorpay charges the selected journey job's amount.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS service_charge numeric NOT NULL DEFAULT 35400;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_service_charge_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_service_charge_check
  CHECK (service_charge >= 1 AND service_charge <= 500000);

COMMENT ON COLUMN public.jobs.service_charge IS
  'SafeWork Global service / assessment fee in INR for this job. Admin-only; default ₹35,400.';

-- Employers must not rewrite the fee on self-serve updates.
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
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.service_charge := 35400;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() IS NOT NULL THEN
      NEW.posted_by_role := OLD.posted_by_role;
      NEW.created_by := OLD.created_by;
      NEW.service_charge := OLD.service_charge;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

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
    openings,
    visa_sponsorship,
    remote_allowed,
    status,
    posted_at,
    expires_at,
    posted_by_role,
    created_by,
    service_charge
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
    auth.uid(),
    COALESCE(NULLIF(p_patch->>'service_charge', '')::numeric, 35400)
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
