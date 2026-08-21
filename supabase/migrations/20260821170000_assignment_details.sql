-- Worker-visible assignment details:
-- interviewer display name on verification, centre street address / contact.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS interviewer_name text;

ALTER TABLE public.trade_test_centers
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS instructions text;

-- Copy interviewer display name when admin schedules (workers cannot SELECT other profiles).
CREATE OR REPLACE FUNCTION public.admin_schedule_worker_interview(
  p_user_id uuid, p_scheduled_at timestamptz, p_meeting_url text, p_interviewer_user_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kyc text;
  v_attempt integer;
  v_id uuid;
  v_interviewer_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT kyc_status, interview_attempts INTO v_kyc, v_attempt
    FROM public.worker_verification WHERE user_id = p_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC must be verified before scheduling the interview';
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

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_scheduled_at = p_scheduled_at,
         interview_meeting_url = p_meeting_url,
         interviewer_user_id = p_interviewer_user_id,
         interviewer_name = v_interviewer_name,
         interview_status = 'scheduled',
         interview_attempts = COALESCE(interview_attempts, 0) + 1,
         stage = CASE WHEN stage IN ('identity','awaiting_interview') THEN 'awaiting_interview' ELSE stage END,
         updated_at = now()
   WHERE user_id = p_user_id;

  RETURN v_id;
END; $$;

UPDATE public.worker_verification wv
   SET interviewer_name = COALESCE(
         NULLIF(trim(p.full_name), ''),
         NULLIF(split_part(COALESCE(p.email, ''), '@', 1), ''),
         'Interviewer'
       )
  FROM public.profiles p
 WHERE wv.interviewer_user_id = p.id
   AND wv.interviewer_name IS NULL
   AND wv.interviewer_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_worker_verification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.verification_guard_bypass', true) = '1'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.stage := 'essentials';
  NEW.payment_status := 'pending';
  NEW.payment_amount := NULL;
  NEW.paid_at := NULL;
  NEW.razorpay_payment_id := NULL;
  NEW.razorpay_order_id := NULL;
  NEW.trade_test_status := NULL;
  NEW.medical_status := NULL;
  NEW.interview_score := NULL;
  NEW.interview_notes := NULL;
  NEW.interview_rated_at := NULL;
  NEW.gcc_ready_at := NULL;
  NEW.kyc_status := 'pending';
  NEW.kyc_verified_at := NULL;
  NEW.interview_scheduled_at := NULL;
  NEW.interview_meeting_url := NULL;
  NEW.interviewer_user_id := NULL;
  NEW.interviewer_name := NULL;
  NEW.interview_status := 'pending';
  NEW.interview_attempts := 0;
  NEW.trade_test_scheduled_at := NULL;
  NEW.medical_scheduled_at := NULL;
  NEW.bond_received_at := NULL;
  NEW.pdot_status := 'pending';
  NEW.pdot_completed_at := NULL;
  NEW.deployed_at := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_worker_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  allowed_worker_stages text[] := ARRAY[
    'essentials', 'quiz', 'media', 'identity', 'awaiting_interview', 'bond'
  ];
  allowed_worker_bond_status text[] := ARRAY['pending', 'in_progress', 'submitted'];
BEGIN
  IF current_setting('app.verification_guard_bypass', true) = '1' THEN
    RETURN NEW;
  END IF;

  is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to update another worker verification row';
  END IF;

  IF NEW.interview_score IS DISTINCT FROM OLD.interview_score
     OR NEW.interview_notes IS DISTINCT FROM OLD.interview_notes
     OR NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.gcc_ready_at IS DISTINCT FROM OLD.gcc_ready_at
     OR NEW.kyc_verified_at IS DISTINCT FROM OLD.kyc_verified_at
     OR (NEW.kyc_status IS DISTINCT FROM OLD.kyc_status AND NEW.kyc_status IS DISTINCT FROM 'submitted')
     OR NEW.interview_scheduled_at IS DISTINCT FROM OLD.interview_scheduled_at
     OR NEW.interview_meeting_url IS DISTINCT FROM OLD.interview_meeting_url
     OR NEW.interviewer_user_id IS DISTINCT FROM OLD.interviewer_user_id
     OR NEW.interviewer_name IS DISTINCT FROM OLD.interviewer_name
     OR NEW.interview_status IS DISTINCT FROM OLD.interview_status
     OR NEW.interview_attempts IS DISTINCT FROM OLD.interview_attempts
     OR NEW.trade_test_scheduled_at IS DISTINCT FROM OLD.trade_test_scheduled_at
     OR NEW.trade_test_place IS DISTINCT FROM OLD.trade_test_place
     OR NEW.medical_scheduled_at IS DISTINCT FROM OLD.medical_scheduled_at
     OR NEW.medical_place IS DISTINCT FROM OLD.medical_place
     OR NEW.bond_received_at IS DISTINCT FROM OLD.bond_received_at
     OR NEW.pdot_status IS DISTINCT FROM OLD.pdot_status
     OR NEW.pdot_completed_at IS DISTINCT FROM OLD.pdot_completed_at
     OR NEW.deploy_offer_status IS DISTINCT FROM OLD.deploy_offer_status
     OR NEW.deploy_contract_status IS DISTINCT FROM OLD.deploy_contract_status
     OR NEW.deploy_emigration_status IS DISTINCT FROM OLD.deploy_emigration_status
     OR NEW.deploy_visa_status IS DISTINCT FROM OLD.deploy_visa_status
     OR NEW.deploy_insurance_status IS DISTINCT FROM OLD.deploy_insurance_status
     OR NEW.deploy_ticket_status IS DISTINCT FROM OLD.deploy_ticket_status
     OR NEW.deployed_at IS DISTINCT FROM OLD.deployed_at
     OR (NEW.bond_status IS DISTINCT FROM OLD.bond_status
         AND NOT (NEW.bond_status = ANY (allowed_worker_bond_status)))
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
