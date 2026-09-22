-- Persist Essentials gender + district (district was collected in UI but not saved).

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.worker_verification
  DROP CONSTRAINT IF EXISTS worker_verification_gender_check;

ALTER TABLE public.worker_verification
  ADD CONSTRAINT worker_verification_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.worker_profiles
  DROP CONSTRAINT IF EXISTS worker_profiles_gender_check;

ALTER TABLE public.worker_profiles
  ADD CONSTRAINT worker_profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
