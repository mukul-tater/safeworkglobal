-- Show the company name on public job pages whenever the employer has one.
CREATE OR REPLACE VIEW public.employer_profiles_public
WITH (security_barrier = true)
AS
SELECT
  id,
  company_name
FROM public.employer_profiles
WHERE company_name IS NOT NULL AND btrim(company_name) <> '';

GRANT SELECT ON public.employer_profiles_public TO anon, authenticated, service_role;