-- Jobs reference the employer's user id, so expose it for the public join.
DROP VIEW IF EXISTS public.employer_profiles_public;

CREATE VIEW public.employer_profiles_public
WITH (security_barrier = true)
AS
SELECT
  id,
  user_id,
  company_name
FROM public.employer_profiles
WHERE company_name IS NOT NULL AND btrim(company_name) <> '';

GRANT SELECT ON public.employer_profiles_public TO anon, authenticated, service_role;