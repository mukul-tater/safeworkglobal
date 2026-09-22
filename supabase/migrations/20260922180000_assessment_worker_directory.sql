-- Trade-test lists need the worker's real name. Centre staff cannot SELECT
-- arbitrary profiles, so this SECURITY DEFINER directory is limited to
-- workers on assessments the caller is allowed to see (or any worker for admin).

CREATE OR REPLACE FUNCTION public.assessment_worker_directory(p_worker_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  phone text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    NULLIF(btrim(COALESCE(p.full_name, '')), ''),
    NULLIF(btrim(COALESCE(p.phone, '')), ''),
    p.email
  FROM public.profiles p
  WHERE p_worker_ids IS NOT NULL
    AND p.id = ANY (p_worker_ids)
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR p.id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.assessments a
        WHERE a.worker_id = p.id
          AND a.partner_id IN (
            SELECT pr.id FROM public.partners pr WHERE pr.user_id = auth.uid()
          )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.assessment_worker_directory(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assessment_worker_directory(uuid[]) TO authenticated;
