-- Prevent workers from self-advancing privileged GCC stages / fields.
-- Admins retain full update rights via has_role(..., 'admin').

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
  is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to update another worker verification row';
  END IF;

  -- Privileged fields: interview, payment, bond approval, gcc ready, test pass flags
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

  -- Workers may only move among early / bond-submit stages (not payment/tests/gcc_ready)
  IF NEW.stage IS DISTINCT FROM OLD.stage
     AND NOT (NEW.stage = ANY (allowed_worker_stages))
  THEN
    RAISE EXCEPTION 'Not allowed to advance verification stage to %', NEW.stage;
  END IF;

  -- Never allow workers to jump to gcc_ready
  IF NEW.stage = 'gcc_ready' AND OLD.stage IS DISTINCT FROM 'gcc_ready' THEN
    RAISE EXCEPTION 'Not allowed to mark GCC ready';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_worker_verification_update ON public.worker_verification;
CREATE TRIGGER trg_guard_worker_verification_update
  BEFORE UPDATE ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_worker_verification_update();

-- Payments: workers can insert pending rows only; cannot mark paid themselves
DROP POLICY IF EXISTS "Workers manage own assessment payments" ON public.worker_assessment_payments;

CREATE POLICY "Workers read own assessment payments"
  ON public.worker_assessment_payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workers insert pending assessment payments"
  ON public.worker_assessment_payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins manage assessment payments" ON public.worker_assessment_payments;
CREATE POLICY "Admins manage assessment payments"
  ON public.worker_assessment_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bonds: workers insert/select submitted; cannot self-approve
DROP POLICY IF EXISTS "Workers manage own bonds" ON public.worker_bonds;

CREATE POLICY "Workers read own bonds"
  ON public.worker_bonds FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workers insert submitted bonds"
  ON public.worker_bonds FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'submitted');

-- Keep admin ALL on bonds (already exists)
