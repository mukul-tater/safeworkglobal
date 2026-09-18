-- Scheduling a new interview must not silently rewind a worker who already
-- passed interview / payment / trade test. Admin must pass p_confirm_rewind.

DROP FUNCTION IF EXISTS public.admin_schedule_worker_interview(uuid, timestamptz, text, uuid);

CREATE OR REPLACE FUNCTION public.admin_schedule_worker_interview(
  p_user_id uuid,
  p_scheduled_at timestamptz,
  p_meeting_url text,
  p_interviewer_user_id uuid,
  p_confirm_rewind boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kyc text;
  v_attempt integer;
  v_id uuid;
  v_interviewer_name text;
  v_stage text;
  v_payment text;
  v_paid_at timestamptz;
  v_interview_status text;
  v_trade_status text;
  v_medical_status text;
  v_past boolean;
  v_new_stage text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT kyc_status, interview_attempts, stage, payment_status, paid_at,
         interview_status, trade_test_status, medical_status
    INTO v_kyc, v_attempt, v_stage, v_payment, v_paid_at,
         v_interview_status, v_trade_status, v_medical_status
    FROM public.worker_verification WHERE user_id = p_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC must be verified before scheduling the interview';
  END IF;

  v_past := v_stage IN (
              'awaiting_payment', 'trade_test', 'medical', 'tests',
              'bond', 'pdot', 'deployment', 'gcc_ready'
            )
         OR v_payment = 'paid'
         OR v_paid_at IS NOT NULL
         OR v_interview_status = 'approved'
         OR v_trade_status = 'passed'
         OR v_medical_status = 'passed';

  IF v_past AND NOT COALESCE(p_confirm_rewind, false) THEN
    RAISE EXCEPTION
      'This worker has already progressed past the interview (currently %). Confirm rewind to send them back.',
      COALESCE(v_stage, 'unknown');
  END IF;

  SELECT COALESCE(
           NULLIF(trim(p.full_name), ''),
           NULLIF(split_part(COALESCE(p.email, ''), '@', 1), ''),
           'Interviewer'
         )
    INTO v_interviewer_name
    FROM public.profiles p
   WHERE p.id = p_interviewer_user_id;

  IF v_interviewer_name IS NULL THEN
    v_interviewer_name := 'Interviewer';
  END IF;

  INSERT INTO public.worker_verification_interviews
    (user_id, scheduled_at, meeting_link, meeting_url, interviewer_user_id, status, attempt_no)
  VALUES (p_user_id, p_scheduled_at, p_meeting_url, p_meeting_url, p_interviewer_user_id, 'scheduled', COALESCE(v_attempt, 0) + 1)
  RETURNING id INTO v_id;

  IF v_past AND COALESCE(p_confirm_rewind, false) THEN
    v_new_stage := 'awaiting_interview';
  ELSE
    v_new_stage := CASE WHEN v_stage IN ('identity','awaiting_interview') THEN 'awaiting_interview' ELSE v_stage END;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_scheduled_at = p_scheduled_at,
         interview_meeting_url = p_meeting_url,
         interviewer_user_id = p_interviewer_user_id,
         interviewer_name = v_interviewer_name,
         interview_status = 'scheduled',
         interview_attempts = COALESCE(interview_attempts, 0) + 1,
         stage = v_new_stage,
         updated_at = now()
   WHERE user_id = p_user_id;

  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_schedule_worker_interview(uuid, timestamptz, text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_schedule_worker_interview(uuid, timestamptz, text, uuid, boolean) TO authenticated;

-- Recording an interview decision must not pull a later-stage worker back to payment.
CREATE OR REPLACE FUNCTION public.interviewer_record_decision(
  p_interview_id uuid,
  p_approved boolean,
  p_reason text DEFAULT NULL,
  p_score numeric DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.worker_verification_interviews;
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_stage text;
  v_payment text;
  v_paid_at timestamptz;
  v_trade_status text;
  v_trade_required boolean;
  v_medical_status text;
  v_next_stage text;
BEGIN
  SELECT * INTO v_row FROM public.worker_verification_interviews WHERE id = p_interview_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Interview not found';
  END IF;
  IF NOT v_is_admin AND v_row.interviewer_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not assigned to this interview';
  END IF;

  UPDATE public.worker_verification_interviews
     SET decision = CASE WHEN p_approved THEN 'approved' ELSE 'not_approved' END,
         decision_reason = p_reason,
         decided_at = now(),
         status = 'completed',
         score = COALESCE(p_score, score),
         rated_by = auth.uid(),
         updated_at = now()
   WHERE id = p_interview_id;

  SELECT stage, payment_status, paid_at, trade_test_status, trade_test_required, medical_status
    INTO v_stage, v_payment, v_paid_at, v_trade_status, v_trade_required, v_medical_status
    FROM public.worker_verification
   WHERE user_id = v_row.user_id;

  v_next_stage := COALESCE(v_stage, 'awaiting_interview');

  IF p_approved THEN
    IF v_stage IN ('identity', 'awaiting_interview', 'media', 'quiz') THEN
      IF v_payment = 'paid' OR v_paid_at IS NOT NULL THEN
        IF COALESCE(v_trade_required, true)
           AND COALESCE(v_trade_status, 'pending') NOT IN ('passed', 'not_required') THEN
          v_next_stage := 'trade_test';
        ELSIF v_medical_status = 'passed' THEN
          v_next_stage := 'bond';
        ELSE
          v_next_stage := 'medical';
        END IF;
      ELSE
        v_next_stage := 'awaiting_payment';
      END IF;
    END IF;
  ELSE
    IF v_stage IN ('identity', 'awaiting_interview') THEN
      v_next_stage := 'awaiting_interview';
    END IF;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         interview_score = COALESCE(p_score, interview_score),
         interview_notes = COALESCE(p_reason, interview_notes),
         interview_rated_at = now(),
         stage = v_next_stage,
         updated_at = now()
   WHERE user_id = v_row.user_id;
END; $$;
