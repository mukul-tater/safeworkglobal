-- One active job. Closed applications stay on file.
-- Switching saves Test 1, skill proof, interview, and trade test, and restores them on return.
-- Job switch is on by default. Admin can turn it off, or block one worker.
-- Choice numbers are stored for a future limit of 10. The limit is not enforced.
-- An admin-entered extra amount can be paid by Razorpay or bank transfer before the next switch.

-- Journey applications are worker + job. Admin posts jobs; an employer is not part of this flow.
ALTER TABLE public.job_applications
  ALTER COLUMN employer_id DROP NOT NULL;

UPDATE public.job_applications
SET employer_id = NULL
WHERE cover_letter = 'Application submitted through platform';

ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_status_check
  CHECK (status = ANY (ARRAY[
    'PENDING'::text,
    'REVIEWING'::text,
    'SHORTLISTED'::text,
    'INTERVIEWED'::text,
    'APPROVED'::text,
    'OFFERED'::text,
    'HIRED'::text,
    'REJECTED'::text,
    'SUPERSEDED'::text
  ]));

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS job_switch_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_change_fee_due numeric,
  ADD COLUMN IF NOT EXISTS job_change_fee_paid_at timestamptz;

ALTER TABLE public.worker_skill_media
  ADD COLUMN IF NOT EXISTS journey_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS worker_skill_media_journey_job_idx
  ON public.worker_skill_media(journey_job_id)
  WHERE journey_job_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.journey_job_settings (
  id int PRIMARY KEY CHECK (id = 1),
  job_switch_enabled boolean NOT NULL DEFAULT true,
  max_job_choices int NOT NULL DEFAULT 10 CHECK (max_job_choices >= 1 AND max_job_choices <= 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.journey_job_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.worker_journey_job_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  to_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  change_number int NOT NULL CHECK (change_number >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (worker_id, change_number)
);

CREATE INDEX IF NOT EXISTS worker_journey_job_changes_worker_idx
  ON public.worker_journey_job_changes(worker_id, change_number DESC);

CREATE TABLE IF NOT EXISTS public.worker_journey_job_snapshots (
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_status text,
  stage text NOT NULL,
  primary_skill text,
  trade_test_required boolean,
  quiz_score numeric,
  quiz_completed_at timestamptz,
  media_submitted_at timestamptz,
  interview_score numeric,
  interview_notes text,
  interview_rated_at timestamptz,
  interview_scheduled_at timestamptz,
  interview_meeting_url text,
  interviewer_user_id uuid,
  interviewer_name text,
  interview_status text,
  interview_attempts int,
  trade_test_status text,
  trade_test_result_url text,
  trade_test_center_id text,
  trade_test_center_name text,
  trade_test_reporting_window text,
  trade_test_booked_at timestamptz,
  trade_test_scheduled_at timestamptz,
  trade_test_place text,
  trade_test_instructions text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (worker_id, job_id)
);

CREATE TABLE IF NOT EXISTS public.worker_job_change_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  charged_amount numeric(12,2),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'paid', 'failed', 'rejected')),
  provider text,
  provider_ref text,
  razorpay_order_id text,
  razorpay_payment_id text,
  transfer_method text,
  proof_path text,
  proof_file_name text,
  transferred_on date,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS worker_job_change_payments_user_idx
  ON public.worker_job_change_payments(user_id, created_at DESC);

ALTER TABLE public.journey_job_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_journey_job_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_journey_job_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_job_change_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read journey job settings" ON public.journey_job_settings;
CREATE POLICY "Admins read journey job settings"
  ON public.journey_job_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers read own job changes" ON public.worker_journey_job_changes;
CREATE POLICY "Workers read own job changes"
  ON public.worker_journey_job_changes FOR SELECT TO authenticated
  USING (
    auth.uid() = worker_id
    OR public.partner_manages_worker(worker_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins read job change payments" ON public.worker_job_change_payments;
CREATE POLICY "Admins read job change payments"
  ON public.worker_job_change_payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers read own job change payments" ON public.worker_job_change_payments;
CREATE POLICY "Workers read own job change payments"
  ON public.worker_job_change_payments FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.partner_manages_worker(user_id)
  );

-- ---------------------------------------------------------------------------
-- Guard: privileged job-switch fields, and allow definer functions to restore
-- a saved stage (including a passed trade test) via the existing bypass flag.
-- ---------------------------------------------------------------------------
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
    'awaiting_interview'
  ];
  paid_or_staff_stages text[] := ARRAY[
    'awaiting_payment', 'trade_test', 'medical', 'bond', 'pdot',
    'deployment', 'gcc_ready'
  ];
BEGIN
  IF current_setting('app.verification_guard_bypass', true) = '1' THEN
    RETURN NEW;
  END IF;

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
     OR NEW.job_switch_blocked IS DISTINCT FROM OLD.job_switch_blocked
     OR NEW.job_change_fee_due IS DISTINCT FROM OLD.job_change_fee_due
     OR NEW.job_change_fee_paid_at IS DISTINCT FROM OLD.job_change_fee_paid_at
  THEN
    RAISE EXCEPTION 'Not allowed to update privileged verification fields';
  END IF;

  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    IF NEW.stage = ANY (paid_or_staff_stages) THEN
      RAISE EXCEPTION 'Payment is required before this journey step';
    END IF;
    IF NOT (NEW.stage = ANY (allowed_worker_stages)) THEN
      RAISE EXCEPTION 'Not allowed to advance verification stage to %', NEW.stage;
    END IF;
  END IF;

  IF NEW.stage = 'gcc_ready' AND OLD.stage IS DISTINCT FROM 'gcc_ready' THEN
    RAISE EXCEPTION 'Not allowed to mark GCC ready';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.job_switch_policy(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_enabled boolean;
  v_row public.worker_verification%ROWTYPE;
  v_due numeric;
  v_paid boolean;
  v_can boolean;
  v_reason text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  v_subject := COALESCE(p_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid
     AND NOT public.partner_manages_worker(v_subject)
     AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not allowed to read job switch for this worker';
  END IF;

  SELECT job_switch_enabled INTO v_enabled
  FROM public.journey_job_settings
  WHERE id = 1;
  v_enabled := COALESCE(v_enabled, true);

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_subject;
  v_due := COALESCE(v_row.job_change_fee_due, 0);
  v_paid := v_row.job_change_fee_paid_at IS NOT NULL;

  v_can := true;
  v_reason := NULL;
  IF NOT v_enabled THEN
    v_can := false;
    v_reason := 'Job changes are turned off';
  ELSIF COALESCE(v_row.job_switch_blocked, false) THEN
    v_can := false;
    v_reason := 'Job changes are blocked for this account';
  ELSIF v_row.gcc_ready_at IS NOT NULL OR v_row.stage IN ('gcc_ready', 'deployment') THEN
    v_can := false;
    v_reason := 'This job cannot be changed after GCC ready';
  ELSIF v_due > 0 AND NOT v_paid THEN
    v_can := false;
    v_reason := 'Pay the extra job-change amount before switching';
  END IF;

  RETURN jsonb_build_object(
    'enabled', v_enabled,
    'blocked', COALESCE(v_row.job_switch_blocked, false),
    'fee_due', v_due,
    'fee_paid', v_paid,
    'can_switch', v_can,
    'reason', v_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.job_switch_policy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_switch_policy(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_to_job_for_journey(p_job_id uuid, p_user_id uuid DEFAULT NULL)
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
  v_next int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_subject := COALESCE(p_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to apply for this worker';
  END IF;
  IF NOT public.worker_can_apply_to_jobs(v_subject) THEN
    RAISE EXCEPTION 'Finish Essentials before applying to a job';
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
    INSERT INTO public.job_applications (job_id, worker_id, status, cover_letter)
    VALUES (p_job_id, v_subject, 'PENDING', 'Application submitted through platform')
    RETURNING id INTO v_app_id;
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_subject;
  IF FOUND AND v_row.journey_job_id IS NULL THEN
    UPDATE public.worker_verification
    SET journey_job_id = p_job_id,
        stage = CASE
          WHEN stage IN ('find_jobs', 'apply_job') AND quiz_completed_at IS NULL THEN 'quiz'
          ELSE stage
        END,
        updated_at = now()
    WHERE user_id = v_subject;

    SELECT COALESCE(MAX(change_number), 0) + 1 INTO v_next
    FROM public.worker_journey_job_changes
    WHERE worker_id = v_subject;

    INSERT INTO public.worker_journey_job_changes (worker_id, from_job_id, to_job_id, change_number, created_by)
    VALUES (v_subject, NULL, p_job_id, v_next, v_uid);
  END IF;

  RETURN v_app_id;
END;
$$;

DROP FUNCTION IF EXISTS public.change_journey_job(uuid, uuid);

CREATE OR REPLACE FUNCTION public.change_journey_job(
  p_job_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_primary_skill text DEFAULT NULL,
  p_trade_test_required boolean DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_job public.jobs%ROWTYPE;
  v_row public.worker_verification%ROWTYPE;
  v_snap public.worker_journey_job_snapshots%ROWTYPE;
  v_from_app_id uuid;
  v_from_status text;
  v_app_id uuid;
  v_to_status text;
  v_next int;
  v_enabled boolean;
  v_due numeric;
  v_stage text;
  v_trade_required boolean;
  v_trade_status text;
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
  IF v_row.journey_job_id IS NOT DISTINCT FROM p_job_id THEN
    RAISE EXCEPTION 'This is already your current job';
  END IF;
  IF v_row.journey_job_id IS NULL THEN
    RAISE EXCEPTION 'Apply to a job before changing it';
  END IF;

  SELECT job_switch_enabled INTO v_enabled FROM public.journey_job_settings WHERE id = 1;
  IF NOT COALESCE(v_enabled, true) THEN
    RAISE EXCEPTION 'Job changes are turned off';
  END IF;
  IF COALESCE(v_row.job_switch_blocked, false) THEN
    RAISE EXCEPTION 'Job changes are blocked for this account';
  END IF;
  IF v_row.stage IN ('gcc_ready', 'deployment') OR v_row.gcc_ready_at IS NOT NULL THEN
    RAISE EXCEPTION 'This job cannot be changed after GCC ready';
  END IF;

  v_due := COALESCE(v_row.job_change_fee_due, 0);
  IF v_due > 0 AND v_row.job_change_fee_paid_at IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.worker_job_change_payments
      WHERE user_id = v_subject AND status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'Job change payment is waiting for review';
    END IF;
    RAISE EXCEPTION 'Pay the extra job-change amount before switching';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id AND status = 'ACTIVE';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job is not available';
  END IF;

  SELECT id, status INTO v_from_app_id, v_from_status
  FROM public.job_applications
  WHERE worker_id = v_subject AND job_id = v_row.journey_job_id
  LIMIT 1;

  INSERT INTO public.worker_journey_job_snapshots (
    worker_id, job_id, application_status, stage, primary_skill, trade_test_required,
    quiz_score, quiz_completed_at, media_submitted_at,
    interview_score, interview_notes, interview_rated_at, interview_scheduled_at,
    interview_meeting_url, interviewer_user_id, interviewer_name, interview_status, interview_attempts,
    trade_test_status, trade_test_result_url, trade_test_center_id, trade_test_center_name,
    trade_test_reporting_window, trade_test_booked_at, trade_test_scheduled_at,
    trade_test_place, trade_test_instructions, saved_at
  ) VALUES (
    v_subject, v_row.journey_job_id, v_from_status, v_row.stage, v_row.primary_skill, v_row.trade_test_required,
    v_row.quiz_score, v_row.quiz_completed_at, v_row.media_submitted_at,
    v_row.interview_score, v_row.interview_notes, v_row.interview_rated_at, v_row.interview_scheduled_at,
    v_row.interview_meeting_url, v_row.interviewer_user_id, v_row.interviewer_name, v_row.interview_status, v_row.interview_attempts,
    v_row.trade_test_status, v_row.trade_test_result_url, v_row.trade_test_center_id, v_row.trade_test_center_name,
    v_row.trade_test_reporting_window, v_row.trade_test_booked_at, v_row.trade_test_scheduled_at,
    v_row.trade_test_place, v_row.trade_test_instructions, now()
  )
  ON CONFLICT (worker_id, job_id) DO UPDATE SET
    application_status = EXCLUDED.application_status,
    stage = EXCLUDED.stage,
    primary_skill = EXCLUDED.primary_skill,
    trade_test_required = EXCLUDED.trade_test_required,
    quiz_score = EXCLUDED.quiz_score,
    quiz_completed_at = EXCLUDED.quiz_completed_at,
    media_submitted_at = EXCLUDED.media_submitted_at,
    interview_score = EXCLUDED.interview_score,
    interview_notes = EXCLUDED.interview_notes,
    interview_rated_at = EXCLUDED.interview_rated_at,
    interview_scheduled_at = EXCLUDED.interview_scheduled_at,
    interview_meeting_url = EXCLUDED.interview_meeting_url,
    interviewer_user_id = EXCLUDED.interviewer_user_id,
    interviewer_name = EXCLUDED.interviewer_name,
    interview_status = EXCLUDED.interview_status,
    interview_attempts = EXCLUDED.interview_attempts,
    trade_test_status = EXCLUDED.trade_test_status,
    trade_test_result_url = EXCLUDED.trade_test_result_url,
    trade_test_center_id = EXCLUDED.trade_test_center_id,
    trade_test_center_name = EXCLUDED.trade_test_center_name,
    trade_test_reporting_window = EXCLUDED.trade_test_reporting_window,
    trade_test_booked_at = EXCLUDED.trade_test_booked_at,
    trade_test_scheduled_at = EXCLUDED.trade_test_scheduled_at,
    trade_test_place = EXCLUDED.trade_test_place,
    trade_test_instructions = EXCLUDED.trade_test_instructions,
    saved_at = now();

  UPDATE public.worker_skill_media
  SET journey_job_id = v_row.journey_job_id
  WHERE worker_id = v_subject AND journey_job_id IS NULL;

  IF v_from_app_id IS NOT NULL AND v_from_status IS DISTINCT FROM 'SUPERSEDED' THEN
    UPDATE public.job_applications
    SET status = 'SUPERSEDED', employer_id = NULL, updated_at = now()
    WHERE id = v_from_app_id;
  END IF;

  SELECT * INTO v_snap
  FROM public.worker_journey_job_snapshots
  WHERE worker_id = v_subject AND job_id = p_job_id;

  SELECT id, status INTO v_app_id, v_to_status
  FROM public.job_applications
  WHERE worker_id = v_subject AND job_id = p_job_id
  LIMIT 1;

  IF v_app_id IS NULL THEN
    INSERT INTO public.job_applications (job_id, worker_id, status, cover_letter)
    VALUES (p_job_id, v_subject, 'PENDING', 'Application submitted through platform')
    RETURNING id INTO v_app_id;
  ELSIF v_to_status = 'SUPERSEDED' THEN
    UPDATE public.job_applications
    SET status = COALESCE(NULLIF(v_snap.application_status, 'SUPERSEDED'), 'PENDING'),
        employer_id = NULL,
        updated_at = now()
    WHERE id = v_app_id;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  IF v_snap.job_id IS NOT NULL THEN
    v_stage := v_snap.stage;
    IF v_stage IN ('find_jobs', 'apply_job', 'gcc_ready', 'deployment') THEN
      v_stage := 'quiz';
    END IF;
    UPDATE public.worker_verification
    SET
      journey_job_id = p_job_id,
      stage = v_stage,
      primary_skill = COALESCE(v_snap.primary_skill, NULLIF(btrim(COALESCE(p_primary_skill, '')), '')),
      trade_test_required = COALESCE(v_snap.trade_test_required, p_trade_test_required, true),
      quiz_score = v_snap.quiz_score,
      quiz_completed_at = v_snap.quiz_completed_at,
      media_submitted_at = v_snap.media_submitted_at,
      interview_score = v_snap.interview_score,
      interview_notes = v_snap.interview_notes,
      interview_rated_at = v_snap.interview_rated_at,
      interview_scheduled_at = v_snap.interview_scheduled_at,
      interview_meeting_url = v_snap.interview_meeting_url,
      interviewer_user_id = v_snap.interviewer_user_id,
      interviewer_name = v_snap.interviewer_name,
      interview_status = COALESCE(v_snap.interview_status, 'pending'),
      interview_attempts = COALESCE(v_snap.interview_attempts, 0),
      trade_test_status = v_snap.trade_test_status,
      trade_test_result_url = v_snap.trade_test_result_url,
      trade_test_center_id = v_snap.trade_test_center_id,
      trade_test_center_name = v_snap.trade_test_center_name,
      trade_test_reporting_window = v_snap.trade_test_reporting_window,
      trade_test_booked_at = v_snap.trade_test_booked_at,
      trade_test_scheduled_at = v_snap.trade_test_scheduled_at,
      trade_test_place = v_snap.trade_test_place,
      trade_test_instructions = v_snap.trade_test_instructions,
      job_change_fee_due = NULL,
      job_change_fee_paid_at = NULL,
      updated_at = now()
    WHERE user_id = v_subject;
  ELSE
    v_trade_required := COALESCE(p_trade_test_required, true);
    v_trade_status := CASE WHEN v_trade_required THEN 'pending' ELSE 'not_required' END;
    UPDATE public.worker_verification
    SET
      journey_job_id = p_job_id,
      stage = 'quiz',
      primary_skill = NULLIF(btrim(COALESCE(p_primary_skill, '')), ''),
      trade_test_required = v_trade_required,
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
      trade_test_status = v_trade_status,
      trade_test_result_url = NULL,
      trade_test_center_id = NULL,
      trade_test_center_name = NULL,
      trade_test_reporting_window = NULL,
      trade_test_booked_at = NULL,
      trade_test_scheduled_at = NULL,
      trade_test_place = NULL,
      trade_test_instructions = NULL,
      job_change_fee_due = NULL,
      job_change_fee_paid_at = NULL,
      updated_at = now()
    WHERE user_id = v_subject;
  END IF;

  SELECT COALESCE(MAX(change_number), 0) + 1 INTO v_next
  FROM public.worker_journey_job_changes
  WHERE worker_id = v_subject;

  INSERT INTO public.worker_journey_job_changes (worker_id, from_job_id, to_job_id, change_number, created_by)
  VALUES (v_subject, v_row.journey_job_id, p_job_id, v_next, v_uid);

  RETURN v_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.change_journey_job(uuid, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_journey_job(uuid, uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_job_switch_enabled(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.journey_job_settings
  SET job_switch_enabled = p_enabled, updated_at = now()
  WHERE id = 1;
  RETURN p_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_job_switch_enabled(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_job_switch_enabled(boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_worker_job_switch_blocked(p_user_id uuid, p_blocked boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
  SET job_switch_blocked = p_blocked, updated_at = now()
  WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Worker journey was not found';
  END IF;
  RETURN p_blocked;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_worker_job_switch_blocked(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_worker_job_switch_blocked(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_job_change_fee(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  v_amount := NULLIF(round(COALESCE(p_amount, 0)), 0);
  IF v_amount IS NOT NULL AND (v_amount < 1 OR v_amount > 500000) THEN
    RAISE EXCEPTION 'Amount must be between 1 and 500000';
  END IF;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
  SET job_change_fee_due = v_amount,
      job_change_fee_paid_at = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Worker journey was not found';
  END IF;
  RETURN v_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_job_change_fee(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_job_change_fee(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_job_switch_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT job_switch_enabled INTO v_enabled FROM public.journey_job_settings WHERE id = 1;

  RETURN jsonb_build_object(
    'job_switch_enabled', COALESCE(v_enabled, true),
    'changes', COALESCE((
      SELECT jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC)
      FROM (
        SELECT
          ch.id,
          ch.worker_id,
          COALESCE(p.full_name, 'Worker') AS worker_name,
          fj.title AS from_job_title,
          tj.title AS to_job_title,
          ch.change_number,
          ch.created_at
        FROM public.worker_journey_job_changes ch
        LEFT JOIN public.profiles p ON p.id = ch.worker_id
        LEFT JOIN public.jobs fj ON fj.id = ch.from_job_id
        LEFT JOIN public.jobs tj ON tj.id = ch.to_job_id
        ORDER BY ch.created_at DESC
        LIMIT 40
      ) c
    ), '[]'::jsonb),
    'workers', COALESCE((
      SELECT jsonb_agg(row_to_json(w) ORDER BY w.updated_at DESC)
      FROM (
        SELECT
          wv.user_id,
          COALESCE(p.full_name, 'Worker') AS worker_name,
          p.phone,
          j.title AS job_title,
          wv.job_switch_blocked,
          wv.job_change_fee_due,
          wv.job_change_fee_paid_at,
          wv.updated_at
        FROM public.worker_verification wv
        LEFT JOIN public.profiles p ON p.id = wv.user_id
        LEFT JOIN public.jobs j ON j.id = wv.journey_job_id
        WHERE wv.journey_job_id IS NOT NULL OR wv.job_switch_blocked
        ORDER BY wv.updated_at DESC
        LIMIT 40
      ) w
    ), '[]'::jsonb),
    'payments', COALESCE((
      SELECT jsonb_agg(row_to_json(pay) ORDER BY pay.created_at DESC)
      FROM (
        SELECT
          jp.id,
          jp.user_id,
          COALESCE(p.full_name, 'Worker') AS worker_name,
          jp.amount,
          jp.status,
          jp.provider,
          jp.provider_ref,
          jp.transfer_method,
          jp.created_at
        FROM public.worker_job_change_payments jp
        LEFT JOIN public.profiles p ON p.id = jp.user_id
        WHERE jp.status = 'submitted'
        ORDER BY jp.created_at DESC
        LIMIT 20
      ) pay
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_job_switch_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_job_switch_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_job_change_bank_transfer(
  p_method text,
  p_provider_ref text,
  p_proof_path text,
  p_proof_file_name text,
  p_amount numeric,
  p_transferred_on date,
  p_worker_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_due numeric;
  v_method text;
  v_ref text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  v_subject := COALESCE(p_worker_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to pay for this worker';
  END IF;

  SELECT job_change_fee_due INTO v_due
  FROM public.worker_verification
  WHERE user_id = v_subject;
  IF COALESCE(v_due, 0) < 1 THEN
    RAISE EXCEPTION 'No extra amount is due';
  END IF;
  IF round(p_amount) <> round(v_due) THEN
    RAISE EXCEPTION 'Amount does not match the extra job-change fee';
  END IF;

  v_method := lower(btrim(COALESCE(p_method, '')));
  IF v_method NOT IN ('upi', 'imps', 'neft', 'rtgs') THEN
    RAISE EXCEPTION 'Choose UPI, IMPS, NEFT or RTGS';
  END IF;
  v_ref := upper(regexp_replace(btrim(COALESCE(p_provider_ref, '')), '\s+', '', 'g'));
  IF length(v_ref) < 6 THEN
    RAISE EXCEPTION 'Enter the UTR or UPI reference';
  END IF;
  IF p_proof_path IS NULL OR position(v_subject::text || '/' IN p_proof_path) <> 1 THEN
    RAISE EXCEPTION 'Upload the transfer proof again';
  END IF;

  INSERT INTO public.worker_job_change_payments (
    user_id, amount, charged_amount, status, provider, provider_ref,
    transfer_method, proof_path, proof_file_name, transferred_on
  ) VALUES (
    v_subject, round(v_due), round(v_due), 'submitted', 'bank_transfer', v_ref,
    v_method, p_proof_path, NULLIF(btrim(COALESCE(p_proof_file_name, '')), ''), p_transferred_on
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_job_change_bank_transfer(text, text, text, text, numeric, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_job_change_bank_transfer(text, text, text, text, numeric, date, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_job_change_payment(
  p_payment_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay public.worker_job_change_payments%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  SELECT * INTO v_pay FROM public.worker_job_change_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment was not found';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.worker_job_change_payments
    SET status = 'paid', paid_at = now(), reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_payment_id;
    PERFORM set_config('app.verification_guard_bypass', '1', true);
    UPDATE public.worker_verification
    SET job_change_fee_paid_at = now(), updated_at = now()
    WHERE user_id = v_pay.user_id;
  ELSIF p_action = 'reject' THEN
    UPDATE public.worker_job_change_payments
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
        rejection_reason = 'Transfer could not be matched'
    WHERE id = p_payment_id;
  ELSE
    RAISE EXCEPTION 'Unknown review action';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_job_change_payment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_job_change_payment(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_job_change_fee_razorpay(
  p_user_id uuid,
  p_payment_id text,
  p_order_id text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  SELECT job_change_fee_due INTO v_due
  FROM public.worker_verification
  WHERE user_id = p_user_id;
  IF COALESCE(v_due, 0) < 1 THEN
    RETURN;
  END IF;

  UPDATE public.worker_job_change_payments
  SET status = 'paid',
      paid_at = now(),
      razorpay_payment_id = p_payment_id,
      charged_amount = p_amount,
      provider = 'razorpay'
  WHERE user_id = p_user_id
    AND razorpay_order_id = p_order_id
    AND status = 'pending';

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
  SET job_change_fee_paid_at = now(), updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_job_change_fee_razorpay(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_job_change_fee_razorpay(uuid, text, text, numeric) TO service_role;

-- Workers who already have a journey job get choice 1 on file.
INSERT INTO public.worker_journey_job_changes (worker_id, from_job_id, to_job_id, change_number)
SELECT wv.user_id, NULL, wv.journey_job_id, 1
FROM public.worker_verification wv
WHERE wv.journey_job_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.worker_journey_job_changes ch WHERE ch.worker_id = wv.user_id
  );
