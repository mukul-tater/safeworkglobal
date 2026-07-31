-- P0: profiles PII, apply requires gcc_ready, pilot payment waive RPC

-- ---------------------------------------------------------------------------
-- 1) Profiles: never allow blanket authenticated SELECT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Employers can view worker profiles for discovery" ON public.profiles;

-- Own row (idempotent; cover common legacy names)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Employers: only workers who applied to their jobs
DROP POLICY IF EXISTS "Employers can view applicant profiles" ON public.profiles;
CREATE POLICY "Employers can view applicant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.worker_id = profiles.id
        AND ja.employer_id = auth.uid()
    )
  );

-- Workers: employer profile for jobs they applied to
DROP POLICY IF EXISTS "Workers can view employer user profiles for their applications" ON public.profiles;
CREATE POLICY "Workers can view employer user profiles for their applications"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'worker'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.employer_id = profiles.id
        AND ja.worker_id = auth.uid()
    )
  );

-- Partners: workers they onboarded
DROP POLICY IF EXISTS "Partners can view their onboarded worker profiles" ON public.profiles;
CREATE POLICY "Partners can view their onboarded worker profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.worker_profiles wp
      JOIN public.partner_profiles pp ON pp.id = wp.source_partner_id
      WHERE wp.user_id = profiles.id
        AND pp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Apply gate: gcc_ready + emitra review not blocked
-- ---------------------------------------------------------------------------
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
        AND (wv.stage = 'gcc_ready' OR wv.gcc_ready_at IS NOT NULL)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.worker_profiles wp
      WHERE wp.user_id = p_user_id
        AND wp.source_type = 'emitra'
        AND COALESCE(wp.review_status, 'not_required') IN ('pending', 'rejected')
    );
$$;

DROP POLICY IF EXISTS "Workers can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Workers can manage their own applications" ON public.job_applications;

CREATE POLICY "Workers can create applications when GCC ready"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = worker_id
    AND public.worker_can_apply_to_jobs(auth.uid())
  );

DROP POLICY IF EXISTS "Workers can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Workers can view their own applications" ON public.job_applications;
CREATE POLICY "Workers can view their own applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = worker_id);

-- ---------------------------------------------------------------------------
-- 3) Pilot payment waive (until Razorpay is live)
-- ---------------------------------------------------------------------------
-- Allow trigger bypass when set from SECURITY DEFINER RPC
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

CREATE OR REPLACE FUNCTION public.waive_assessment_payment_pilot()
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.worker_verification;
  trade_required boolean;
  next_stage text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO row FROM public.worker_verification WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;

  IF row.stage IS DISTINCT FROM 'awaiting_payment' THEN
    RAISE EXCEPTION 'Payment stage is not active';
  END IF;

  trade_required := COALESCE(row.trade_test_required, true);
  next_stage := CASE WHEN trade_required THEN 'trade_test' ELSE 'medical' END;

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  INSERT INTO public.worker_assessment_payments (user_id, amount, status, provider, paid_at)
  VALUES (uid, COALESCE(row.payment_amount, 35400), 'paid', 'pilot_waive', now());

  UPDATE public.worker_verification
  SET
    payment_status = 'paid',
    payment_amount = COALESCE(payment_amount, 35400),
    paid_at = now(),
    trade_test_required = trade_required,
    trade_test_status = CASE WHEN trade_required THEN COALESCE(trade_test_status, 'pending') ELSE 'not_required' END,
    stage = next_stage,
    updated_at = now()
  WHERE id = row.id
  RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.waive_assessment_payment_pilot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waive_assessment_payment_pilot() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Escrow: stop employers inventing / releasing HELD payments from the client
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employers can create payments" ON public.payments;
DROP POLICY IF EXISTS "Employers can insert escrow payments" ON public.payments;
DROP POLICY IF EXISTS "Employers can insert their own payments" ON public.payments;

-- Keep employer SELECT; remove any employer UPDATE/INSERT if present under common names
DROP POLICY IF EXISTS "Employers can update their payments" ON public.payments;
