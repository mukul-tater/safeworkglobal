-- Split Test 3 into trade_test + medical; store result file URLs.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS trade_test_result_url text,
  ADD COLUMN IF NOT EXISTS medical_result_url text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;

UPDATE public.worker_verification
SET stage = CASE
  WHEN COALESCE(trade_test_required, true) THEN 'trade_test'
  ELSE 'medical'
END
WHERE stage = 'tests';

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
    'trade_test',
    'medical',
    'tests',
    'bond',
    'gcc_ready'
  ));
