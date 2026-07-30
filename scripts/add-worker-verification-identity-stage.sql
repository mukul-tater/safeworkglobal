-- Add identity (KYC) stage to worker verification pipeline (after skill proof, before Test 2).

ALTER TABLE public.worker_verification
  DROP CONSTRAINT IF EXISTS worker_verification_stage_check;

ALTER TABLE public.worker_verification
  ADD CONSTRAINT worker_verification_stage_check
  CHECK (stage IN (
    'essentials',
    'quiz',
    'media',
    'identity',
    'awaiting_interview',
    'awaiting_payment',
    'tests',
    'bond',
    'gcc_ready'
  ));

-- Workers who already passed media (or later) without KYC stay on their stage;
-- the app will prompt Identity when applying / when kyc_status is incomplete.

NOTIFY pgrst, 'reload schema';
