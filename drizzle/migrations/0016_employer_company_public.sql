-- Public, non-sensitive company name projection for job detail pages.
-- Exposes only the company name of public-verified employers so visitors can
-- see which company posted a job. No contact or business data is exposed.
CREATE OR REPLACE VIEW public.employer_profiles_public
WITH (security_barrier = true)
AS
SELECT
  id,
  company_name
FROM public.employer_profiles
WHERE public_verified = true;

GRANT SELECT ON public.employer_profiles_public TO anon, authenticated, service_role;