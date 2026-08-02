-- 1) Role: interviewer
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'interviewer';

-- 2) worker_verification: journey fields
ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS interview_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_meeting_url text,
  ADD COLUMN IF NOT EXISTS interviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interview_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS interview_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trade_test_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS trade_test_place text,
  ADD COLUMN IF NOT EXISTS trade_test_instructions text,
  ADD COLUMN IF NOT EXISTS medical_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS medical_place text,
  ADD COLUMN IF NOT EXISTS medical_instructions text,
  ADD COLUMN IF NOT EXISTS bond_template_id uuid,
  ADD COLUMN IF NOT EXISTS bond_courier_tracking text,
  ADD COLUMN IF NOT EXISTS bond_couriered_at timestamptz,
  ADD COLUMN IF NOT EXISTS bond_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdot_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pdot_provider text,
  ADD COLUMN IF NOT EXISTS pdot_batch text,
  ADD COLUMN IF NOT EXISTS pdot_training_url text,
  ADD COLUMN IF NOT EXISTS pdot_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdot_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdot_proof_url text,
  ADD COLUMN IF NOT EXISTS deploy_offer_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deploy_contract_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deploy_emigration_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deploy_visa_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deploy_insurance_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deploy_ticket_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deployed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deployment_notes text;

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_stage_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_stage_check
  CHECK (stage = ANY (ARRAY['essentials','quiz','media','identity','awaiting_interview','awaiting_payment','trade_test','medical','tests','bond','pdot','deployment','gcc_ready']));

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_kyc_status_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_kyc_status_check
  CHECK (kyc_status = ANY (ARRAY['pending','submitted','verified','rejected']));

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_interview_status_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_interview_status_check
  CHECK (interview_status = ANY (ARRAY['pending','scheduled','approved','rejected']));

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_pdot_status_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_pdot_status_check
  CHECK (pdot_status = ANY (ARRAY['pending','scheduled','completed']));

-- 3) interviews table
ALTER TABLE public.worker_verification_interviews
  ADD COLUMN IF NOT EXISTS interviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS decision text,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_no integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_wvi_interviewer ON public.worker_verification_interviews(interviewer_user_id);

-- 4) worker_profiles: full aadhaar (keep last4)
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS passport_expiry date;

ALTER TABLE public.worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_aadhaar_number_check;
ALTER TABLE public.worker_profiles ADD CONSTRAINT worker_profiles_aadhaar_number_check
  CHECK (aadhaar_number IS NULL OR aadhaar_number ~ '^[0-9]{12}$');

-- 5) Quiz CMS
ALTER TABLE public.worker_skill_quiz_items
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.skill_quiz_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_code text NOT NULL,
  region text,
  questions_to_show integer NOT NULL DEFAULT 5,
  selection_mode text NOT NULL DEFAULT 'random_active',
  selected_ids uuid[] NOT NULL DEFAULT '{}',
  pass_score integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skill_quiz_configs_mode_check CHECK (selection_mode = ANY (ARRAY['random_active','explicit_ids']))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_quiz_configs_key
  ON public.skill_quiz_configs (skill_code, COALESCE(region, ''));

GRANT SELECT ON public.skill_quiz_configs TO authenticated;
GRANT ALL ON public.skill_quiz_configs TO service_role;
ALTER TABLE public.skill_quiz_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read quiz configs" ON public.skill_quiz_configs;
CREATE POLICY "Authenticated read quiz configs" ON public.skill_quiz_configs
  FOR SELECT TO authenticated USING (active);

DROP POLICY IF EXISTS "Admins manage quiz configs" ON public.skill_quiz_configs;
CREATE POLICY "Admins manage quiz configs" ON public.skill_quiz_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_skill_quiz_configs_updated_at
  BEFORE UPDATE ON public.skill_quiz_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Bond templates
CREATE TABLE IF NOT EXISTS public.bond_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL DEFAULT 'SafeWork Global Worker Bond',
  file_url text NOT NULL,
  courier_address text NOT NULL DEFAULT '',
  instructions text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bond_templates TO authenticated;
GRANT ALL ON public.bond_templates TO service_role;
ALTER TABLE public.bond_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read active bond templates" ON public.bond_templates;
CREATE POLICY "Authenticated read active bond templates" ON public.bond_templates
  FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage bond templates" ON public.bond_templates;
CREATE POLICY "Admins manage bond templates" ON public.bond_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bond_templates_updated_at
  BEFORE UPDATE ON public.bond_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.worker_verification
  DROP CONSTRAINT IF EXISTS worker_verification_bond_template_id_fkey;
ALTER TABLE public.worker_verification
  ADD CONSTRAINT worker_verification_bond_template_id_fkey
  FOREIGN KEY (bond_template_id) REFERENCES public.bond_templates(id) ON DELETE SET NULL;

-- 7) Guards: workers can never self-set privileged journey fields
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

-- 8) Interviewer visibility on assigned interviews
DROP POLICY IF EXISTS "Interviewers read assigned interviews" ON public.worker_verification_interviews;
CREATE POLICY "Interviewers read assigned interviews" ON public.worker_verification_interviews
  FOR SELECT TO authenticated USING (interviewer_user_id = auth.uid());

-- 9) Privileged RPCs
CREATE OR REPLACE FUNCTION public.admin_verify_worker_kyc(
  p_user_id uuid, p_approved boolean, p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET kyc_status = CASE WHEN p_approved THEN 'verified' ELSE 'rejected' END,
         kyc_verified_at = CASE WHEN p_approved THEN now() ELSE NULL END,
         kyc_rejection_reason = CASE WHEN p_approved THEN NULL ELSE p_reason END,
         stage = CASE WHEN p_approved AND stage IN ('identity','media','quiz') THEN 'awaiting_interview' ELSE stage END,
         updated_at = now()
   WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_schedule_worker_interview(
  p_user_id uuid, p_scheduled_at timestamptz, p_meeting_url text, p_interviewer_user_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kyc text;
  v_attempt integer;
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT kyc_status, interview_attempts INTO v_kyc, v_attempt
    FROM public.worker_verification WHERE user_id = p_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC must be verified before scheduling the interview';
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
         interview_status = 'scheduled',
         interview_attempts = COALESCE(interview_attempts, 0) + 1,
         stage = CASE WHEN stage IN ('identity','awaiting_interview') THEN 'awaiting_interview' ELSE stage END,
         updated_at = now()
   WHERE user_id = p_user_id;

  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.interviewer_record_decision(
  p_interview_id uuid, p_approved boolean, p_reason text DEFAULT NULL, p_score numeric DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.worker_verification_interviews;
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  SELECT * INTO v_row FROM public.worker_verification_interviews WHERE id = p_interview_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Interview not found';
  END IF;
  IF NOT v_is_admin AND v_row.interviewer_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not assigned to this interview';
  END IF;

  UPDATE public.worker_verification_interviews
     SET decision = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         decision_reason = p_reason,
         decided_at = now(),
         status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         score = COALESCE(p_score, score),
         rated_by = auth.uid(),
         updated_at = now()
   WHERE id = p_interview_id;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         interview_score = COALESCE(p_score, interview_score),
         interview_notes = COALESCE(p_reason, interview_notes),
         interview_rated_at = now(),
         stage = CASE WHEN p_approved THEN 'awaiting_payment' ELSE 'awaiting_interview' END,
         updated_at = now()
   WHERE user_id = v_row.user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_schedule_worker_assessment(
  p_user_id uuid,
  p_kind text,
  p_scheduled_at timestamptz,
  p_place text DEFAULT NULL,
  p_instructions text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_kind NOT IN ('trade_test', 'medical') THEN
    RAISE EXCEPTION 'Unknown assessment kind %', p_kind;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  IF p_kind = 'trade_test' THEN
    UPDATE public.worker_verification
       SET trade_test_scheduled_at = p_scheduled_at,
           trade_test_place = p_place,
           trade_test_instructions = p_instructions,
           trade_test_status = 'scheduled',
           updated_at = now()
     WHERE user_id = p_user_id;
  ELSE
    UPDATE public.worker_verification
       SET medical_scheduled_at = p_scheduled_at,
           medical_place = p_place,
           medical_instructions = p_instructions,
           medical_status = 'scheduled',
           updated_at = now()
     WHERE user_id = p_user_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.worker_submit_bond_tracking(p_tracking text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_tracking IS NULL OR length(btrim(p_tracking)) < 4 THEN
    RAISE EXCEPTION 'Enter a valid courier tracking number';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_courier_tracking = btrim(p_tracking),
         bond_couriered_at = now(),
         bond_status = 'submitted',
         updated_at = now()
   WHERE user_id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.admin_mark_bond_received(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_status = 'approved',
         bond_received_at = now(),
         stage = 'pdot',
         updated_at = now()
   WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_pdot_plan(
  p_user_id uuid,
  p_provider text DEFAULT NULL,
  p_batch text DEFAULT NULL,
  p_training_url text DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET pdot_provider = p_provider,
         pdot_batch = p_batch,
         pdot_training_url = p_training_url,
         pdot_scheduled_at = p_scheduled_at,
         pdot_status = CASE WHEN pdot_status = 'completed' THEN 'completed' ELSE 'scheduled' END,
         updated_at = now()
   WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_mark_pdot_completed(
  p_user_id uuid, p_proof_url text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bond timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT bond_received_at INTO v_bond FROM public.worker_verification WHERE user_id = p_user_id;
  IF v_bond IS NULL THEN
    RAISE EXCEPTION 'Bond must be received before PDOT completion';
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET pdot_status = 'completed',
         pdot_completed_at = now(),
         pdot_proof_url = COALESCE(p_proof_url, pdot_proof_url),
         gcc_ready_at = now(),
         stage = 'gcc_ready',
         updated_at = now()
   WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_deployment_checklist(
  p_user_id uuid,
  p_offer text DEFAULT NULL,
  p_contract text DEFAULT NULL,
  p_emigration text DEFAULT NULL,
  p_visa text DEFAULT NULL,
  p_insurance text DEFAULT NULL,
  p_ticket text DEFAULT NULL,
  p_deployed boolean DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET deploy_offer_status = COALESCE(p_offer, deploy_offer_status),
         deploy_contract_status = COALESCE(p_contract, deploy_contract_status),
         deploy_emigration_status = COALESCE(p_emigration, deploy_emigration_status),
         deploy_visa_status = COALESCE(p_visa, deploy_visa_status),
         deploy_insurance_status = COALESCE(p_insurance, deploy_insurance_status),
         deploy_ticket_status = COALESCE(p_ticket, deploy_ticket_status),
         deployed_at = CASE WHEN p_deployed IS TRUE THEN COALESCE(deployed_at, now())
                            WHEN p_deployed IS FALSE THEN NULL ELSE deployed_at END,
         deployment_notes = COALESCE(p_notes, deployment_notes),
         updated_at = now()
   WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.interviewer_list_assignments()
RETURNS TABLE (
  interview_id uuid,
  worker_user_id uuid,
  full_name text,
  primary_skill text,
  state text,
  quiz_score numeric,
  scheduled_at timestamptz,
  meeting_url text,
  status text,
  decision text,
  attempt_no integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.user_id, p.full_name, wv.primary_skill, wv.state, wv.quiz_score,
         i.scheduled_at, COALESCE(i.meeting_url, i.meeting_link), i.status, i.decision, i.attempt_no
    FROM public.worker_verification_interviews i
    LEFT JOIN public.profiles p ON p.id = i.user_id
    LEFT JOIN public.worker_verification wv ON wv.user_id = i.user_id
   WHERE i.interviewer_user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
   ORDER BY i.scheduled_at NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.admin_verify_worker_kyc(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_schedule_worker_interview(uuid, timestamptz, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interviewer_record_decision(uuid, boolean, text, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_schedule_worker_assessment(uuid, text, timestamptz, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_submit_bond_tracking(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_bond_received(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_pdot_plan(uuid, text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_pdot_completed(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_deployment_checklist(uuid, text, text, text, text, text, text, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interviewer_list_assignments() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_verify_worker_kyc(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_schedule_worker_interview(uuid, timestamptz, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interviewer_record_decision(uuid, boolean, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_schedule_worker_assessment(uuid, text, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_submit_bond_tracking(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_bond_received(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pdot_plan(uuid, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_pdot_completed(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_deployment_checklist(uuid, text, text, text, text, text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interviewer_list_assignments() TO authenticated;