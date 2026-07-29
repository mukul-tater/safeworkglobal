
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS aadhaar_last4 text,
  ADD COLUMN IF NOT EXISTS kyc_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'worker_profiles_kyc_status_check'
  ) THEN
    ALTER TABLE public.worker_profiles
      ADD CONSTRAINT worker_profiles_kyc_status_check
      CHECK (kyc_status IN ('not_started','submitted','verified','rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'worker_profiles_pan_format_check'
  ) THEN
    ALTER TABLE public.worker_profiles
      ADD CONSTRAINT worker_profiles_pan_format_check
      CHECK (pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'worker_profiles_aadhaar_last4_check'
  ) THEN
    ALTER TABLE public.worker_profiles
      ADD CONSTRAINT worker_profiles_aadhaar_last4_check
      CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^[0-9]{4}$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS worker_profiles_kyc_status_idx ON public.worker_profiles (kyc_status);
