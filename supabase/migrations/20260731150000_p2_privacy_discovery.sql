-- P2: private skill media, discovery only shows GCC-ready / approved workers

-- ---------------------------------------------------------------------------
-- 1) Storage: force worker-videos private; kill leftover public policies
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET public = false
WHERE id = 'worker-videos';

DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read worker-videos" ON storage.objects;

-- Ensure core private policies exist (idempotent recreate)
DROP POLICY IF EXISTS "Worker videos: owners manage own" ON storage.objects;
CREATE POLICY "Worker videos: owners manage own"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'worker-videos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'worker-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Worker videos: admin read" ON storage.objects;
CREATE POLICY "Worker videos: admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Worker videos: employer read on application" ON storage.objects;
CREATE POLICY "Worker videos: employer read on application"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-videos'
  AND public.has_role(auth.uid(), 'employer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.employer_id = auth.uid()
      AND ja.worker_id::text = (storage.foldername(name))[1]
  )
);

-- ---------------------------------------------------------------------------
-- 2) worker_videos table: no blanket authenticated SELECT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view videos" ON public.worker_videos;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON public.worker_videos;

DROP POLICY IF EXISTS "Workers can view own videos" ON public.worker_videos;
CREATE POLICY "Workers can view own videos"
  ON public.worker_videos FOR SELECT TO authenticated
  USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "Admins can view all worker videos" ON public.worker_videos;
CREATE POLICY "Admins can view all worker videos"
  ON public.worker_videos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Employers can view videos of their applicants" ON public.worker_videos;
CREATE POLICY "Employers can view videos of their applicants"
  ON public.worker_videos FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.worker_id = worker_videos.worker_id
        AND ja.employer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3) worker_skills: stop world-readable skill rows for every auth user
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view skills" ON public.worker_skills;
DROP POLICY IF EXISTS "Authenticated users can view skills" ON public.worker_skills;

DROP POLICY IF EXISTS "Workers can view own skills" ON public.worker_skills;
CREATE POLICY "Workers can view own skills"
  ON public.worker_skills FOR SELECT TO authenticated
  USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "Admins can view all worker skills" ON public.worker_skills;
CREATE POLICY "Admins can view all worker skills"
  ON public.worker_skills FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Employers can view applicant skills" ON public.worker_skills;
CREATE POLICY "Employers can view applicant skills"
  ON public.worker_skills FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.worker_id = worker_skills.worker_id
        AND ja.employer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Discovery RPC: only GCC-ready, non-blocked workers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_public_workers(p_limit integer DEFAULT 24)
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   avatar_url text,
   nationality text,
   current_location text,
   primary_work_type text,
   years_of_experience numeric,
   skill_level text,
   has_passport boolean,
   has_visa boolean,
   availability text,
   top_skills text[],
   video_url text,
   verified_documents text[],
   certifications_count integer,
   languages text[],
   open_to_relocation boolean,
   preferred_shift text,
   ecr_status text,
   last_active_at timestamptz
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    wp.user_id,
    CASE
      WHEN p.full_name IS NULL OR length(trim(p.full_name)) = 0 THEN 'Worker'
      WHEN position(' ' in trim(p.full_name)) = 0 THEN split_part(trim(p.full_name), ' ', 1)
      ELSE split_part(trim(p.full_name), ' ', 1) || ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
    END AS display_name,
    p.avatar_url,
    wp.nationality,
    COALESCE(wp.current_city, wp.current_location) AS current_location,
    wp.primary_work_type,
    wp.years_of_experience::numeric,
    wp.skill_level,
    COALESCE(wp.has_passport, false) AS has_passport,
    COALESCE(wp.has_visa, false) AS has_visa,
    wp.availability,
    COALESCE(
      (SELECT array_agg(ws.skill_name ORDER BY ws.skill_name)
       FROM (
         SELECT skill_name FROM public.worker_skills
         WHERE worker_id = wp.user_id
         LIMIT 5
       ) ws),
      '{}'::text[]
    ) AS top_skills,
    -- Do not expose raw video URLs in discovery (private bucket / signed URLs only after apply)
    NULL::text AS video_url,
    COALESCE(
      (SELECT array_agg(DISTINCT wd.document_type)
       FROM public.worker_documents wd
       WHERE wd.worker_id = wp.user_id
         AND wd.verification_status = 'verified'),
      '{}'::text[]
    ) AS verified_documents,
    COALESCE(
      (SELECT count(*)::int FROM public.worker_certifications wc
       WHERE wc.worker_id = wp.user_id),
      0
    ) AS certifications_count,
    COALESCE(wp.languages, '{}'::text[]) AS languages,
    COALESCE(wp.open_to_relocation, false) AS open_to_relocation,
    wp.preferred_shift,
    wp.ecr_status,
    wp.updated_at AS last_active_at
  FROM public.worker_profiles wp
  LEFT JOIN public.profiles p ON p.id = wp.user_id
  INNER JOIN public.worker_verification wv ON wv.user_id = wp.user_id
  WHERE (wv.stage = 'gcc_ready' OR wv.gcc_ready_at IS NOT NULL)
    AND NOT (
      wp.source_type = 'emitra'
      AND COALESCE(wp.review_status, 'not_required') IN ('pending', 'rejected')
    )
  ORDER BY wp.updated_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$function$;

REVOKE EXECUTE ON FUNCTION public.list_public_workers(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_public_workers(integer) TO authenticated;
