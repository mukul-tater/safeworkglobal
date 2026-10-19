-- Per-job accommodation photos and uploaded work videos from the admin job form.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.jobs.video_urls IS
  'Video files an admin uploaded for this job. YouTube links stay in youtube_urls.';

CREATE OR REPLACE FUNCTION public.normalize_job_file_urls(p_urls jsonb)
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  item text;
  trimmed text;
  result text[] := '{}';
BEGIN
  IF p_urls IS NULL OR p_urls = 'null'::jsonb THEN
    RETURN '{}'::text[];
  END IF;
  IF jsonb_typeof(p_urls) <> 'array' THEN
    RAISE EXCEPTION 'Media links must be a list';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements_text(p_urls)
  LOOP
    trimmed := btrim(item);
    IF trimmed = '' THEN
      CONTINUE;
    END IF;
    IF trimmed !~ '^https://' OR length(trimmed) > 1000 THEN
      RAISE EXCEPTION 'Each uploaded file must be an https link';
    END IF;
    IF NOT trimmed = ANY (result) THEN
      result := array_append(result, trimmed);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-media',
  'job-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read job media" ON storage.objects;
CREATE POLICY "Public read job media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'job-media');

DROP POLICY IF EXISTS "Admins upload job media" ON storage.objects;
CREATE POLICY "Admins upload job media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-media'
    AND public.has_role(auth.uid(), 'admin'::app_role)
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[2] IN ('accommodation', 'videos')
  );

DROP POLICY IF EXISTS "Admins update job media" ON storage.objects;
CREATE POLICY "Admins update job media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'job-media'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins delete job media" ON storage.objects;
CREATE POLICY "Admins delete job media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'job-media'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

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
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.youtube_urls := '{}';
      NEW.video_urls := '{}';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() IS NOT NULL THEN
      NEW.posted_by_role := OLD.posted_by_role;
      NEW.created_by := OLD.created_by;
      NEW.service_charge := OLD.service_charge;
      NEW.youtube_urls := OLD.youtube_urls;
      NEW.video_urls := OLD.video_urls;
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
    local_salary_min = CASE
      WHEN p_patch ? 'local_salary_min' THEN NULLIF(p_patch->>'local_salary_min', '')::numeric
      ELSE local_salary_min
    END,
    local_salary_max = CASE
      WHEN p_patch ? 'local_salary_max' THEN NULLIF(p_patch->>'local_salary_max', '')::numeric
      ELSE local_salary_max
    END,
    local_salary_currency = CASE
      WHEN p_patch ? 'local_salary_currency' THEN NULLIF(p_patch->>'local_salary_currency', '')
      ELSE local_salary_currency
    END,
    salary_display = CASE
      WHEN p_patch ? 'salary_display' THEN NULLIF(p_patch->>'salary_display', '')
      ELSE salary_display
    END,
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
    youtube_urls = CASE
      WHEN p_patch ? 'youtube_urls' THEN public.normalize_job_youtube_urls(p_patch->'youtube_urls')
      ELSE youtube_urls
    END,
    title_hi = CASE WHEN p_patch ? 'title_hi' THEN NULLIF(p_patch->>'title_hi', '') ELSE title_hi END,
    processing_time = CASE WHEN p_patch ? 'processing_time' THEN NULLIF(p_patch->>'processing_time', '') ELSE processing_time END,
    processing_time_hi = CASE WHEN p_patch ? 'processing_time_hi' THEN NULLIF(p_patch->>'processing_time_hi', '') ELSE processing_time_hi END,
    work_phrase = CASE WHEN p_patch ? 'work_phrase' THEN NULLIF(p_patch->>'work_phrase', '') ELSE work_phrase END,
    benefits_hi = CASE WHEN p_patch ? 'benefits_hi' THEN NULLIF(p_patch->>'benefits_hi', '') ELSE benefits_hi END,
    quiz_skill_code = CASE WHEN p_patch ? 'quiz_skill_code' THEN NULLIF(p_patch->>'quiz_skill_code', '') ELSE quiz_skill_code END,
    card_image_url = CASE WHEN p_patch ? 'card_image_url' THEN NULLIF(p_patch->>'card_image_url', '') ELSE card_image_url END,
    category = CASE WHEN p_patch ? 'category' THEN NULLIF(p_patch->>'category', '') ELSE category END,
    city = CASE WHEN p_patch ? 'city' THEN NULLIF(p_patch->>'city', '') ELSE city END,
    slug = CASE WHEN p_patch ? 'slug' THEN NULLIF(p_patch->>'slug', '') ELSE slug END,
    seo_title = CASE WHEN p_patch ? 'seo_title' THEN NULLIF(p_patch->>'seo_title', '') ELSE seo_title END,
    seo_description = CASE WHEN p_patch ? 'seo_description' THEN NULLIF(p_patch->>'seo_description', '') ELSE seo_description END,
    indexable = CASE
      WHEN p_patch ? 'indexable' THEN COALESCE((p_patch->>'indexable')::boolean, true)
      ELSE indexable
    END,
    hidden_from_public = CASE
      WHEN p_patch ? 'hidden_from_public' THEN COALESCE((p_patch->>'hidden_from_public')::boolean, false)
      ELSE hidden_from_public
    END,
    use_saved_copy = CASE
      WHEN p_patch ? 'use_saved_copy' THEN COALESCE((p_patch->>'use_saved_copy')::boolean, false)
      ELSE use_saved_copy
    END,
    quiz_pass_score = CASE
      WHEN p_patch ? 'quiz_pass_score' THEN NULLIF(p_patch->>'quiz_pass_score', '')::integer
      ELSE quiz_pass_score
    END,
    age_min = CASE
      WHEN p_patch ? 'age_min' THEN NULLIF(p_patch->>'age_min', '')::integer
      ELSE age_min
    END,
    age_max = CASE
      WHEN p_patch ? 'age_max' THEN NULLIF(p_patch->>'age_max', '')::integer
      ELSE age_max
    END,
    accommodation_image_urls = CASE
      WHEN p_patch ? 'accommodation_image_urls' THEN COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(p_patch->'accommodation_image_urls')),
        '{}'::text[]
      )
      ELSE accommodation_image_urls
    END,
    video_urls = CASE
      WHEN p_patch ? 'video_urls' THEN public.normalize_job_file_urls(p_patch->'video_urls')
      ELSE video_urls
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
    local_salary_min,
    local_salary_max,
    local_salary_currency,
    salary_display,
    openings,
    visa_sponsorship,
    remote_allowed,
    status,
    posted_at,
    expires_at,
    posted_by_role,
    created_by,
    service_charge,
    youtube_urls,
    title_hi,
    processing_time,
    processing_time_hi,
    work_phrase,
    benefits_hi,
    quiz_skill_code,
    card_image_url,
    category,
    city,
    slug,
    seo_title,
    seo_description,
    indexable,
    hidden_from_public,
    use_saved_copy,
    quiz_pass_score,
    age_min,
    age_max,
    accommodation_image_urls,
    video_urls
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
    NULLIF(p_patch->>'local_salary_min', '')::numeric,
    NULLIF(p_patch->>'local_salary_max', '')::numeric,
    NULLIF(p_patch->>'local_salary_currency', ''),
    NULLIF(p_patch->>'salary_display', ''),
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
    COALESCE(NULLIF(p_patch->>'service_charge', '')::numeric, 35400),
    CASE
      WHEN p_patch ? 'youtube_urls' THEN public.normalize_job_youtube_urls(p_patch->'youtube_urls')
      ELSE '{}'::text[]
    END,
    NULLIF(p_patch->>'title_hi', ''),
    NULLIF(p_patch->>'processing_time', ''),
    NULLIF(p_patch->>'processing_time_hi', ''),
    NULLIF(p_patch->>'work_phrase', ''),
    NULLIF(p_patch->>'benefits_hi', ''),
    NULLIF(p_patch->>'quiz_skill_code', ''),
    NULLIF(p_patch->>'card_image_url', ''),
    NULLIF(p_patch->>'category', ''),
    NULLIF(p_patch->>'city', ''),
    NULLIF(p_patch->>'slug', ''),
    NULLIF(p_patch->>'seo_title', ''),
    NULLIF(p_patch->>'seo_description', ''),
    COALESCE((p_patch->>'indexable')::boolean, true),
    COALESCE((p_patch->>'hidden_from_public')::boolean, false),
    COALESCE((p_patch->>'use_saved_copy')::boolean, true),
    CASE
      WHEN NULLIF(p_patch->>'quiz_pass_score', '') IS NULL THEN NULL
      ELSE (p_patch->>'quiz_pass_score')::integer
    END,
    NULLIF(p_patch->>'age_min', '')::integer,
    NULLIF(p_patch->>'age_max', '')::integer,
    CASE
      WHEN p_patch ? 'accommodation_image_urls' THEN COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(p_patch->'accommodation_image_urls')),
        '{}'::text[]
      )
      ELSE '{}'::text[]
    END,
    CASE
      WHEN p_patch ? 'video_urls' THEN public.normalize_job_file_urls(p_patch->'video_urls')
      ELSE '{}'::text[]
    END
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

