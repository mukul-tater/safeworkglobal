-- GCC journey: Find jobs → Apply before Test 1.
-- Partners can apply / favourite jobs for workers they manage.
-- Applying is allowed after Essentials, not only at gcc_ready.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS journey_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS worker_verification_journey_job_idx
  ON public.worker_verification(journey_job_id)
  WHERE journey_job_id IS NOT NULL;

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_stage_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_stage_check
  CHECK (stage = ANY (ARRAY[
    'essentials','find_jobs','apply_job','quiz','media','identity',
    'awaiting_interview','awaiting_payment','trade_test','medical','tests',
    'bond','pdot','deployment','gcc_ready'
  ]));

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

  IF NEW.interview_score IS DISTINCT FROM OLD.interview_score
     OR NEW.interview_notes IS DISTINCT FROM OLD.interview_notes
     OR NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at
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

CREATE OR REPLACE FUNCTION public.worker_can_apply_to_jobs(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.worker_verification wv
      WHERE wv.user_id = p_user_id
        AND wv.essentials_completed_at IS NOT NULL
        AND wv.stage IS DISTINCT FROM 'essentials'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.user_id = p_user_id
        AND wp.source_type = 'emitra'
        AND COALESCE(wp.review_status, 'not_required') IN ('pending', 'rejected')
    );
$$;

DROP POLICY IF EXISTS "Workers can create applications when GCC ready" ON public.job_applications;
DROP POLICY IF EXISTS "Workers can create applications" ON public.job_applications;
CREATE POLICY "Workers and partners can create applications after essentials"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    (
      auth.uid() = worker_id
      AND public.worker_can_apply_to_jobs(auth.uid())
    )
    OR (
      public.partner_manages_worker(worker_id)
      AND public.worker_can_apply_to_jobs(worker_id)
    )
  );

DROP POLICY IF EXISTS "Workers can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Workers can view own applications" ON public.job_applications;
CREATE POLICY "Workers and partners can view applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    auth.uid() = worker_id
    OR public.partner_manages_worker(worker_id)
  );

DROP POLICY IF EXISTS "Partners manage attributed saved jobs" ON public.saved_jobs;
CREATE POLICY "Partners manage attributed saved jobs"
  ON public.saved_jobs FOR ALL TO authenticated
  USING (public.partner_manages_worker(user_id))
  WITH CHECK (public.partner_manages_worker(user_id));

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
    INSERT INTO public.job_applications (job_id, worker_id, employer_id, status, cover_letter)
    VALUES (p_job_id, v_subject, v_job.employer_id, 'PENDING', 'Application submitted through platform')
    RETURNING id INTO v_app_id;
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_subject;
  IF FOUND AND v_row.stage IN ('find_jobs', 'apply_job', 'essentials', 'quiz') AND v_row.quiz_completed_at IS NULL THEN
    UPDATE public.worker_verification
    SET journey_job_id = COALESCE(journey_job_id, p_job_id),
        stage = CASE WHEN stage IN ('find_jobs', 'apply_job') THEN 'quiz' ELSE stage END,
        updated_at = now()
    WHERE user_id = v_subject;
  END IF;

  RETURN v_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_to_job_for_journey(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_to_job_for_journey(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_saved_job(p_job_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_exists uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_subject := COALESCE(p_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to save jobs for this worker';
  END IF;

  SELECT id INTO v_exists
  FROM public.saved_jobs
  WHERE user_id = v_subject AND job_id = p_job_id
  LIMIT 1;

  IF v_exists IS NOT NULL THEN
    DELETE FROM public.saved_jobs WHERE id = v_exists;
    RETURN false;
  END IF;

  INSERT INTO public.saved_jobs (user_id, job_id) VALUES (v_subject, p_job_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_saved_job(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_saved_job(uuid, uuid) TO authenticated;
