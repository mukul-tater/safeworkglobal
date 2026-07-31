-- Pilot: workers can skip waiting for admin video-interview scoring.
-- Advances awaiting_interview → awaiting_payment with a pilot score.

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

  IF row.stage IS DISTINCT FROM 'awaiting_interview' THEN
    RAISE EXCEPTION 'Interview stage is not active';
  END IF;

  -- Keep skill-based trade-test rule (same as admin score path)
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
