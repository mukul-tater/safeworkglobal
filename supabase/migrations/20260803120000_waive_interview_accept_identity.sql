-- Allow pilot interview waive when KYC is done but stage still on identity
-- (UI shows interview via kycDone recovery; RPC previously required awaiting_interview only).

CREATE OR REPLACE FUNCTION public.waive_assessment_interview_pilot()
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.worker_verification;
  trade_required boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO row FROM public.worker_verification WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;

  IF row.stage IS DISTINCT FROM 'awaiting_interview'
     AND row.stage IS DISTINCT FROM 'identity' THEN
    RAISE EXCEPTION 'Interview stage is not active (current: %)', row.stage;
  END IF;

  -- Identity UI can show interview when KYC is submitted but stage advance lagged.
  IF row.stage = 'identity' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.user_id = uid
        AND wp.kyc_status IN ('submitted', 'verified')
    ) THEN
      RAISE EXCEPTION 'Complete Identity (KYC) before continuing to interview';
    END IF;
  END IF;

  trade_required := COALESCE(row.trade_test_required, true);

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  UPDATE public.worker_verification
  SET
    interview_score = COALESCE(interview_score, 80),
    interview_notes = COALESCE(interview_notes, 'Pilot waive — interview skipped'),
    interview_rated_at = COALESCE(interview_rated_at, now()),
    trade_test_required = trade_required,
    trade_test_status = CASE
      WHEN trade_required THEN COALESCE(trade_test_status, 'pending')
      ELSE 'not_required'
    END,
    stage = 'awaiting_payment',
    updated_at = now()
  WHERE id = row.id
  RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.waive_assessment_interview_pilot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waive_assessment_interview_pilot() TO authenticated;
