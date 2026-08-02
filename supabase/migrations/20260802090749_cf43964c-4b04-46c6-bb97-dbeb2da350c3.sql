-- 1) Stop auto-granting admin on signup
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin roles are never auto-granted from an email allow-list.
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_whitelisted_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;

  -- Already an admin: nothing to do.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin') THEN
    RETURN true;
  END IF;

  -- One-time bootstrap only: never escalate once any admin exists.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;

  SELECT lower(email), email_confirmed_at INTO v_email, v_confirmed
  FROM auth.users WHERE id = v_uid;

  IF v_confirmed IS NULL OR NOT public.is_whitelisted_admin_email(coalesce(v_email, '')) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  RETURN true;
END;
$$;

-- 2) Workers cannot self-grade quiz answers
DROP POLICY IF EXISTS "Workers manage own quiz responses" ON public.worker_skill_quiz_responses;

CREATE POLICY "Workers read own quiz responses"
ON public.worker_skill_quiz_responses
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Workers insert own quiz responses"
ON public.worker_skill_quiz_responses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage quiz responses"
ON public.worker_skill_quiz_responses
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.grade_worker_quiz_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expected boolean;
BEGIN
  SELECT expected_answer INTO v_expected
  FROM public.worker_skill_quiz_items WHERE id = NEW.quiz_item_id;

  IF v_expected IS NULL THEN
    NEW.is_correct := false;
  ELSE
    NEW.is_correct := (NEW.answer IS NOT NULL AND NEW.answer = v_expected);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grade_worker_quiz_response ON public.worker_skill_quiz_responses;
CREATE TRIGGER trg_grade_worker_quiz_response
BEFORE INSERT OR UPDATE ON public.worker_skill_quiz_responses
FOR EACH ROW EXECUTE FUNCTION public.grade_worker_quiz_response();

-- 3) Workers cannot self-approve verification
DROP POLICY IF EXISTS "Workers manage own verification" ON public.worker_verification;

CREATE POLICY "Workers read own verification"
ON public.worker_verification
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Workers insert own verification"
ON public.worker_verification
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers update own verification"
ON public.worker_verification
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_worker_verification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('app.verification_guard_bypass', true) = '1'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Force privileged fields to safe values on worker-created rows.
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_worker_verification_insert ON public.worker_verification;
CREATE TRIGGER trg_guard_worker_verification_insert
BEFORE INSERT ON public.worker_verification
FOR EACH ROW EXECUTE FUNCTION public.guard_worker_verification_insert();