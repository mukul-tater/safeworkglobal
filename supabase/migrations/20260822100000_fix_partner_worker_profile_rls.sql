-- Partner kiosk: "Continue to Test 1" failed with
--   new row violates row-level security policy for table "worker_profiles"
--
-- Two bugs:
-- 1) partner_manages_worker was LANGUAGE sql. Postgres inlines SQL helpers
--    into RLS policies, so they run as the caller. Partners have no SELECT
--    on worker_profiles, the EXISTS sees nothing, INSERT/UPDATE WITH CHECK fails.
-- 2) Partners lost SELECT on worker_profiles (listing moved to an RPC), so
--    upsert ON CONFLICT cannot see the existing attributed row and takes the
--    INSERT path instead of UPDATE.

CREATE OR REPLACE FUNCTION public.partner_manages_worker(_worker_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _worker_user_id IS NULL THEN
    RETURN false;
  END IF;
  IF NOT public.has_role(auth.uid(), 'partner'::app_role) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.worker_profiles wp
    WHERE wp.user_id = _worker_user_id
      AND (
        (
          wp.source_partner_id IS NOT NULL
          AND wp.source_partner_id IN (
            SELECT pp.id FROM public.partner_profiles pp WHERE pp.user_id = auth.uid()
          )
        )
        OR (
          wp.added_by_org_id IS NOT NULL
          AND wp.added_by_org_id IN (
            SELECT p.id FROM public.partners p WHERE p.user_id = auth.uid()
          )
        )
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.partner_manages_worker(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_manages_worker(uuid) TO authenticated;

DROP POLICY IF EXISTS "Partners read attributed worker profiles" ON public.worker_profiles;
CREATE POLICY "Partners read attributed worker profiles"
  ON public.worker_profiles FOR SELECT TO authenticated
  USING (public.partner_manages_worker(user_id));
