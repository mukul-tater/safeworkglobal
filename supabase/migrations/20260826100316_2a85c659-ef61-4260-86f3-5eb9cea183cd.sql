-- Make the fail-closed intent of auth_continue_attempts explicit:
-- only admins may read it; no client insert/update/delete path exists.
DROP POLICY IF EXISTS "auth_continue_attempts admin read" ON public.auth_continue_attempts;
CREATE POLICY "auth_continue_attempts admin read"
ON public.auth_continue_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.auth_continue_attempts FROM anon, authenticated;
GRANT SELECT ON public.auth_continue_attempts TO authenticated;
GRANT ALL ON public.auth_continue_attempts TO service_role;