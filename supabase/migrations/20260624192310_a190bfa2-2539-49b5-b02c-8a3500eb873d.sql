
-- 1) employer_company_info: remove anonymous read access
DROP POLICY IF EXISTS "Public can view safe employer company info" ON public.employer_company_info;
CREATE POLICY "Authenticated can view safe employer company info"
  ON public.employer_company_info
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.employer_company_info FROM anon;

-- 2) withdrawal_requests: hide admin_notes from partners (column-level)
REVOKE SELECT (admin_notes) ON public.withdrawal_requests FROM authenticated;
REVOKE SELECT (admin_notes) ON public.withdrawal_requests FROM anon;
GRANT SELECT (admin_notes) ON public.withdrawal_requests TO service_role;

-- 3) worker_profiles: drop direct partner SELECT, expose safe fields via RPC
DROP POLICY IF EXISTS "Partners view their workers" ON public.worker_profiles;

CREATE OR REPLACE FUNCTION public.partner_list_my_workers()
RETURNS TABLE (
  user_id uuid,
  primary_work_type text,
  current_location text,
  current_city text,
  review_status text,
  review_rejection_reason text,
  review_notes text,
  source_partner_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.user_id,
         wp.primary_work_type,
         wp.current_location,
         wp.current_city,
         wp.review_status,
         wp.review_rejection_reason,
         wp.review_notes,
         wp.source_partner_id,
         wp.created_at,
         wp.updated_at
  FROM public.worker_profiles wp
  WHERE wp.source_type = 'emitra'
    AND wp.source_partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    );
$$;

REVOKE EXECUTE ON FUNCTION public.partner_list_my_workers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_list_my_workers() TO authenticated;
