-- E-Mitra onboarding v3: centre maps, owner DOB, and partner declaration flags.
-- Safe to re-run.

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS agree_no_misrepresentation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_accurate_info boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_not_sub_agent boolean DEFAULT false;

COMMENT ON COLUMN public.partner_profiles.google_maps_url IS 'Google Maps URL or coordinates for the E-Mitra / CSC centre';
COMMENT ON COLUMN public.partner_profiles.agree_not_sub_agent IS 'Partner acknowledges they are not automatically a sub-agent of the RA';

NOTIFY pgrst, 'reload schema';
