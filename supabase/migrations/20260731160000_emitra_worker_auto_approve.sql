-- eMitra partner OTP onboarding is trusted: new workers should be approved at create.
-- Approve existing pending emitra workers so they can sign in (partner already verified mobile).

UPDATE public.worker_profiles
SET
  review_status = 'approved',
  onboarded_at = COALESCE(onboarded_at, now())
WHERE source_type = 'emitra'
  AND review_status = 'pending';
