
-- 1. Extend partner_profiles with approval audit fields
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- 2. Extend worker_profiles with source + review fields
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS source_partner_id uuid REFERENCES public.partner_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS review_rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_worker_profiles_source_partner ON public.worker_profiles(source_partner_id) WHERE source_partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_worker_profiles_review_status ON public.worker_profiles(review_status) WHERE source_type = 'emitra';

-- 3. Trigger: when a worker_profile is inserted with source_type='emitra', force review_status='pending'
CREATE OR REPLACE FUNCTION public.set_emitra_worker_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source_type = 'emitra' THEN
    IF NEW.review_status IS NULL OR NEW.review_status = 'not_required' THEN
      NEW.review_status := 'pending';
    END IF;
    IF NEW.onboarded_at IS NULL THEN
      NEW.onboarded_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_emitra_worker_defaults ON public.worker_profiles;
CREATE TRIGGER trg_set_emitra_worker_defaults
  BEFORE INSERT ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_emitra_worker_defaults();

-- 4. reward_transactions table
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL,
  job_id uuid,
  application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('pending_placement','available','withdrawn')),
  withdrawal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own rewards" ON public.reward_transactions
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins view all rewards" ON public.reward_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage rewards" ON public.reward_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_reward_transactions_partner ON public.reward_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_status ON public.reward_transactions(status);

CREATE TRIGGER trg_reward_transactions_updated
  BEFORE UPDATE ON public.reward_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  account_holder text,
  account_number text,
  ifsc text,
  upi_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes text,
  rejection_reason text,
  payment_reference text,
  processed_by uuid,
  processed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners create own withdrawals" ON public.withdrawal_requests
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid() AND status = 'approved'));
CREATE POLICY "Admins view all withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage withdrawals" ON public.withdrawal_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_partner ON public.withdrawal_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

CREATE TRIGGER trg_withdrawal_requests_updated
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reward_transactions
  ADD CONSTRAINT reward_transactions_withdrawal_fk
  FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawal_requests(id) ON DELETE SET NULL;

-- 6. Trigger: create reward when worker is HIRED, if worker came from eMitra partner
CREATE OR REPLACE FUNCTION public.create_emitra_placement_reward()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_partner_id uuid;
  v_amount numeric(12,2);
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'HIRED' AND OLD.status IS DISTINCT FROM 'HIRED' THEN
    SELECT source_partner_id INTO v_partner_id
    FROM public.worker_profiles
    WHERE user_id = NEW.worker_id AND source_type = 'emitra';

    IF v_partner_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE application_id = NEW.id) THEN
        SELECT COALESCE(placement_reward_amount, 1000) INTO v_amount
        FROM public.partner_reward_config WHERE id = true;

        INSERT INTO public.reward_transactions (partner_id, worker_id, job_id, application_id, amount, status)
        VALUES (v_partner_id, NEW.worker_id, NEW.job_id, NEW.id, COALESCE(v_amount, 1000), 'available');

        UPDATE public.partner_profiles
        SET workers_placed = COALESCE(workers_placed, 0) + 1,
            total_incentives_earned = COALESCE(total_incentives_earned, 0) + COALESCE(v_amount, 1000)
        WHERE id = v_partner_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_create_emitra_placement_reward ON public.job_applications;
CREATE TRIGGER trg_create_emitra_placement_reward
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.create_emitra_placement_reward();

-- 7. Let partners view worker_profiles they onboarded
DROP POLICY IF EXISTS "Partners view their workers" ON public.worker_profiles;
CREATE POLICY "Partners view their workers" ON public.worker_profiles
  FOR SELECT TO authenticated
  USING (source_partner_id IN (SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()));

-- 8. Helper: mark withdrawal paid + flip reward rows to withdrawn
CREATE OR REPLACE FUNCTION public.admin_mark_withdrawal_paid(
  p_withdrawal_id uuid, p_payment_reference text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_partner_id uuid;
  v_amount numeric(12,2);
  v_remaining numeric(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT partner_id, amount INTO v_partner_id, v_amount
  FROM public.withdrawal_requests WHERE id = p_withdrawal_id;
  IF v_partner_id IS NULL THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;

  v_remaining := v_amount;
  UPDATE public.reward_transactions r SET status = 'withdrawn', withdrawal_id = p_withdrawal_id
  WHERE r.id IN (
    SELECT id FROM public.reward_transactions
    WHERE partner_id = v_partner_id AND status = 'available'
    ORDER BY created_at
  ) AND v_remaining > 0;

  UPDATE public.withdrawal_requests
  SET status = 'paid', paid_at = now(), processed_by = auth.uid(), processed_at = now(),
      payment_reference = COALESCE(p_payment_reference, payment_reference)
  WHERE id = p_withdrawal_id;
END $$;
