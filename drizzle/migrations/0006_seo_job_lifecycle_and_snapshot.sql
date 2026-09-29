ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'FILLED', 'CLOSED', 'EXPIRED', 'REJECTED'));

UPDATE public.jobs
SET city = COALESCE(NULLIF(btrim(city), ''), NULLIF(btrim(location), '')),
    first_published_at = COALESCE(first_published_at, posted_at, created_at)
WHERE city IS NULL OR first_published_at IS NULL;

UPDATE public.jobs
SET category = CASE
  WHEN lower(title) LIKE '%electrician%' THEN 'Electrician'
  WHEN lower(title) LIKE '%plumber%' THEN 'Plumber'
  WHEN lower(title) LIKE '%welder%' OR lower(title) LIKE '%mig%tig%' THEN 'Welder'
  WHEN lower(title) LIKE '%mason%' THEN 'Mason'
  WHEN lower(title) LIKE '%carpenter%' THEN 'Carpenter'
  WHEN lower(title) LIKE '%scaffold%' THEN 'Scaffolder'
  WHEN lower(title) LIKE '%painter%' THEN 'Painter'
  WHEN lower(title) LIKE '%ac technician%' OR lower(title) LIKE '%hvac%' THEN 'AC Technician'
  WHEN lower(title) LIKE '%fitter%' THEN 'Fitter'
  WHEN lower(title) LIKE '%cleaner%' THEN 'Cleaner'
  WHEN lower(title) LIKE '%driver%' OR lower(title) LIKE '%warehouse%' THEN 'Driver & Logistics'
  WHEN lower(title) LIKE '%construction%' OR lower(title) LIKE '%civil labour%' OR lower(title) LIKE '%steel fixer%' THEN 'Construction'
  ELSE category
END
WHERE category IS NULL;

CREATE OR REPLACE FUNCTION public.expire_public_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.jobs
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'ACTIVE' AND expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_public_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_public_jobs() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_seo_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'jobs', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'slug', j.slug, 'updated_at', j.updated_at, 'title', j.title,
      'country', j.country, 'city', COALESCE(j.city, j.location), 'category', j.category
    ) ORDER BY j.updated_at DESC)
    FROM public.jobs j
    WHERE j.status = 'ACTIVE' AND j.indexable = true
      AND j.slug IS NOT NULL AND (j.expires_at IS NULL OR j.expires_at >= now())), '[]'::jsonb),
    'pages', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'slug', p.slug, 'page_type', p.page_type, 'updated_at', p.updated_at
    ) ORDER BY p.slug)
    FROM public.seo_pages p WHERE p.indexable = true), '[]'::jsonb),
    'employers', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'slug', ep.public_slug, 'updated_at', ep.updated_at
    ) ORDER BY ep.public_slug)
    FROM public.employer_profiles ep
    WHERE ep.is_public = true AND ep.public_slug IS NOT NULL), '[]'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.public_seo_snapshot() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_job_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', j.id, 'slug', j.slug, 'title', j.title, 'description', j.description,
    'requirements', j.requirements, 'responsibilities', j.responsibilities,
    'benefits', j.benefits, 'location', j.location,
    'city', COALESCE(j.city, j.location), 'country', j.country, 'category', j.category,
    'job_type', j.job_type, 'experience_level', j.experience_level,
    'salary_min', j.salary_min, 'salary_max', j.salary_max,
    'salary_display', j.salary_display, 'currency', j.currency,
    'openings', j.openings, 'visa_sponsorship', j.visa_sponsorship,
    'remote_allowed', j.remote_allowed,
    'status', CASE WHEN j.status = 'ACTIVE' AND j.expires_at IS NOT NULL AND j.expires_at < now() THEN 'EXPIRED' ELSE j.status END,
    'posted_at', j.posted_at, 'updated_at', j.updated_at, 'expires_at', j.expires_at,
    'first_published_at', j.first_published_at, 'seo_title', j.seo_title,
    'seo_description', j.seo_description, 'canonical_url', j.canonical_url,
    'indexable', j.indexable, 'noindex_reason', j.noindex_reason,
    'service_charge', j.service_charge,
    'employer', CASE WHEN ep.is_public THEN jsonb_build_object(
      'slug', ep.public_slug, 'name', ep.company_name, 'logo_url', ep.company_logo_url,
      'industry', ep.industry, 'location', COALESCE(ep.emirate, ep.country),
      'description', ep.public_description, 'verified', ep.public_verified
    ) ELSE NULL END,
    'skills', COALESCE((SELECT jsonb_agg(js.skill_name ORDER BY js.skill_name)
      FROM public.job_skills js WHERE js.job_id = j.id), '[]'::jsonb)
  )
  FROM public.jobs j
  LEFT JOIN public.employer_profiles ep ON ep.user_id = j.employer_id
  WHERE j.slug = p_slug AND j.first_published_at IS NOT NULL
    AND j.status IN ('ACTIVE','PAUSED','FILLED','CLOSED','EXPIRED')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.public_job_by_slug(text) TO anon, authenticated, service_role;