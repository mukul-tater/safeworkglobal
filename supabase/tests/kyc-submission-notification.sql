-- Transaction-only regression checks: worker changes, notifications and
-- pg_net email requests are all rolled back; no email is delivered.
BEGIN;
SELECT set_config('app.verification_guard_bypass', '1', true);
DO $$
DECLARE
  worker_id uuid;
  before_count integer;
  after_count integer;
  before_requests bigint;
  after_requests bigint;
BEGIN
  SELECT user_id INTO worker_id FROM public.worker_profiles
  WHERE kyc_status IN ('pending', 'not_started') LIMIT 1;
  IF worker_id IS NULL THEN RAISE EXCEPTION 'A pending worker is needed for this rollback-only test'; END IF;
  SELECT count(*) INTO before_count FROM public.notifications
  WHERE user_id = worker_id AND data->>'event' = 'kyc_submitted';

  SELECT count(*) INTO before_requests FROM net.http_request_queue;
  UPDATE public.worker_profiles SET kyc_status = 'submitted' WHERE user_id = worker_id;
  SELECT count(*) INTO after_requests FROM net.http_request_queue;
  IF after_requests <= before_requests THEN RAISE EXCEPTION 'KYC submission must enqueue an email request'; END IF;
  SELECT count(*) INTO after_count FROM public.notifications
  WHERE user_id = worker_id AND data->>'event' = 'kyc_submitted';
  IF after_count <> before_count + 1 THEN RAISE EXCEPTION 'KYC submission must create exactly one notification'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.worker_profiles WHERE user_id = worker_id AND kyc_status = 'submitted') THEN
    RAISE EXCEPTION 'Submission must not approve identity';
  END IF;

  UPDATE public.worker_profiles SET kyc_status = 'submitted' WHERE user_id = worker_id;
  SELECT count(*) INTO after_count FROM public.notifications
  WHERE user_id = worker_id AND data->>'event' = 'kyc_submitted';
  IF after_count <> before_count + 1 THEN RAISE EXCEPTION 'Unchanged submission status must not send duplicates'; END IF;

  UPDATE public.worker_profiles SET kyc_status = 'rejected' WHERE user_id = worker_id;
  UPDATE public.worker_profiles SET kyc_status = 'submitted' WHERE user_id = worker_id;
  SELECT count(*) INTO after_count FROM public.notifications
  WHERE user_id = worker_id AND data->>'event' = 'kyc_submitted';
  IF after_count <> before_count + 2 THEN RAISE EXCEPTION 'Resubmission after rejection must notify again'; END IF;
END;
$$;
ROLLBACK;