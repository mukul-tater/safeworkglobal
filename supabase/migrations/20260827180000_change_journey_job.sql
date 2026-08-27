-- One active journey job at a time. Changing job keeps old applications and
-- identity/payment/medical/bond, but resets Test 1, skill proof, interview, and trade test.

CREATE OR REPLACE FUNCTION public.guard_worker_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  is_subject boolean;
  allowed_worker_stages text[] := ARRAY[
    'essentials', 'find_jobs', 'apply_job', 'quiz', 'media', 'identity',
    'awaiting_interview', 'bond'
  ];
BEGIN
  is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  is_subject := auth.uid() IS NOT DISTINCT FROM OLD.user_id
    OR public.partner_manages_worker(OLD.user_id);

  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT is_subject THEN
    RAISE EXCEPTION 'Not allowed to update another worker verification row';
  END IF;

  IF (NEW.interview_score IS DISTINCT FROM OLD.interview_score AND NEW.interview_score IS NOT NULL)
     OR (NEW.interview_notes IS DISTINCT FROM OLD.interview_notes AND NEW.interview_notes IS NOT NULL)
     OR (NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at AND NEW.interview_rated_at IS NOT NULL)
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.gcc_ready_at IS DISTINCT FROM OLD.gcc_ready_at
     OR (NEW.bond_status IS DISTINCT FROM OLD.bond_status AND NEW.bond_status IS DISTINCT FROM 'submitted')
     OR (NEW.medical_status IS DISTINCT FROM OLD.medical_status AND NEW.medical_status IN ('passed', 'failed'))
     OR (NEW.trade_test_status IS DISTINCT FROM OLD.trade_test_status AND NEW.trade_test_status IN ('passed', 'failed'))
  THEN
    RAISE EXCEPTION 'Not allowed to update privileged verification fields';
  END IF;

  IF NEW.stage IS DISTINCT FROM OLD.stage
     AND NOT (NEW.stage = ANY (allowed_worker_stages))
  THEN
    RAISE EXCEPTION 'Not allowed to advance verification stage to %', NEW.stage;
  END IF;

  IF NEW.stage = 'gcc_ready' AND OLD.stage IS DISTINCT FROM 'gcc_ready' THEN
    RAISE EXCEPTION 'Not allowed to mark GCC ready';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_journey_job(p_job_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_job public.jobs%ROWTYPE;
  v_app_id uuid;
  v_row public.worker_verification%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_subject := COALESCE(p_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to change job for this worker';
  END IF;
  IF NOT public.worker_can_apply_to_jobs(v_subject) THEN
    RAISE EXCEPTION 'Finish Essentials before applying to a job';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_subject;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finish Essentials before applying to a job';
  END IF;
  IF v_row.stage IN ('gcc_ready', 'deployment') OR v_row.gcc_ready_at IS NOT NULL THEN
    RAISE EXCEPTION 'This job cannot be changed after GCC ready';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id AND status = 'ACTIVE';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job is not available';
  END IF;

  SELECT id INTO v_app_id
  FROM public.job_applications
  WHERE worker_id = v_subject AND job_id = p_job_id
  LIMIT 1;

  IF v_app_id IS NULL THEN
    INSERT INTO public.job_applications (job_id, worker_id, employer_id, status, cover_letter)
    VALUES (p_job_id, v_subject, v_job.employer_id, 'PENDING', 'Application submitted through platform')
    RETURNING id INTO v_app_id;
  END IF;

  DELETE FROM public.worker_skill_media WHERE worker_id = v_subject;

  UPDATE public.worker_verification
  SET
    journey_job_id = p_job_id,
    stage = 'quiz',
    quiz_score = NULL,
    quiz_completed_at = NULL,
    media_submitted_at = NULL,
    interview_score = NULL,
    interview_notes = NULL,
    interview_rated_at = NULL,
    interview_scheduled_at = NULL,
    interview_meeting_url = NULL,
    interviewer_user_id = NULL,
    interviewer_name = NULL,
    interview_status = 'pending',
    interview_attempts = 0,
    trade_test_status = 'pending',
    trade_test_result_url = NULL,
    trade_test_center_id = NULL,
    trade_test_center_name = NULL,
    trade_test_reporting_window = NULL,
    trade_test_booked_at = NULL,
    trade_test_scheduled_at = NULL,
    trade_test_place = NULL,
    trade_test_instructions = NULL,
    updated_at = now()
  WHERE user_id = v_subject;

  RETURN v_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.change_journey_job(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_journey_job(uuid, uuid) TO authenticated;
