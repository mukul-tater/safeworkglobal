-- E-Mitra partner onboarding v2 fields (SafeWork partner application)

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS csc_id text,
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS panchayat text,
  ADD COLUMN IF NOT EXISTS city_town text,
  ADD COLUMN IF NOT EXISTS has_webcam boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS cancelled_cheque_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_url text,
  ADD COLUMN IF NOT EXISTS inside_shop_photo_url text,
  ADD COLUMN IF NOT EXISTS training_declaration boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_mea_guidelines boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_platform_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agree_confidentiality boolean DEFAULT false;

COMMENT ON COLUMN public.partner_profiles.aadhaar_number IS 'E-Mitra onboarding v2 — owner Aadhaar';
COMMENT ON COLUMN public.partner_profiles.training_declaration IS 'Agreed to complete SafeWork E-Mitra training before onboarding workers';

NOTIFY pgrst, 'reload schema';
