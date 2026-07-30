-- 1) lsp_hmac_hex: fix mutable search_path
CREATE OR REPLACE FUNCTION public.lsp_hmac_hex(p_message text, p_secret text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT encode(extensions.hmac(convert_to(p_message, 'UTF8'), convert_to(p_secret, 'UTF8'), 'sha256'), 'hex');
$function$;

-- 2) lsp_partners_public: enforce querying user's permissions (no SECURITY DEFINER view)
ALTER VIEW public.lsp_partners_public SET (security_invoker = true);
REVOKE ALL ON public.lsp_partners_public FROM anon;

-- 3) employer_company_info: restrict broad authenticated read
DROP POLICY IF EXISTS "Authenticated can view safe employer company info" ON public.employer_company_info;

CREATE POLICY "Employers view own company info"
  ON public.employer_company_info
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all company info"
  ON public.employer_company_info
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Related workers view company info"
  ON public.employer_company_info
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE j.employer_id = employer_company_info.user_id
        AND ja.worker_id = auth.uid()
    )
  );

REVOKE SELECT ON public.employer_company_info FROM anon;

-- Safe, name-only lookup so public job listings can still show company names
CREATE OR REPLACE FUNCTION public.get_employer_company_names(p_employer_ids uuid[])
RETURNS TABLE(user_id uuid, company_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT eci.user_id, eci.company_name
  FROM public.employer_company_info eci
  WHERE eci.user_id = ANY(p_employer_ids)
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.employer_id = eci.user_id
        AND j.status = 'ACTIVE'
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_employer_company_names(uuid[]) TO anon, authenticated;

-- 4) partner_reward_config: restrict to admins and partners
DROP POLICY IF EXISTS "Authenticated can read reward config" ON public.partner_reward_config;

CREATE POLICY "Partners can read reward config"
  ON public.partner_reward_config
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.user_id = auth.uid()
    )
  );

REVOKE SELECT ON public.partner_reward_config FROM anon;