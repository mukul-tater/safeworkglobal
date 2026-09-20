-- Direct bank / UPI assessment payments: worker submits proof, admin matches UTR.
-- Razorpay remains instant; this path never lets the worker mark themselves paid.

-- ---------------------------------------------------------------------------
-- Ledger columns + statuses
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  conname text;
BEGIN
  SELECT con.conname INTO conname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'worker_assessment_payments'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%pending%paid%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.worker_assessment_payments DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.worker_assessment_payments
  ADD CONSTRAINT worker_assessment_payments_status_check
  CHECK (status IN ('pending', 'submitted', 'paid', 'failed', 'refunded', 'rejected'));

ALTER TABLE public.worker_assessment_payments
  ADD COLUMN IF NOT EXISTS transfer_method text,
  ADD COLUMN IF NOT EXISTS proof_path text,
  ADD COLUMN IF NOT EXISTS proof_file_name text,
  ADD COLUMN IF NOT EXISTS payment_note text,
  ADD COLUMN IF NOT EXISTS transferred_on date,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'worker_assessment_payments_transfer_method_check'
  ) THEN
    ALTER TABLE public.worker_assessment_payments
      ADD CONSTRAINT worker_assessment_payments_transfer_method_check
      CHECK (transfer_method IS NULL OR transfer_method IN ('upi', 'imps', 'neft', 'rtgs'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS worker_assessment_payments_bank_ref_uidx
  ON public.worker_assessment_payments (upper(provider_ref))
  WHERE provider = 'bank_transfer'
    AND status IN ('submitted', 'paid')
    AND provider_ref IS NOT NULL
    AND length(trim(provider_ref)) > 0;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assessment_fee_for_worker(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_fee numeric;
BEGIN
  SELECT j.service_charge INTO v_fee
  FROM public.worker_verification wv
  LEFT JOIN public.jobs j ON j.id = wv.journey_job_id
  WHERE wv.user_id = p_user_id;
  IF v_fee IS NULL OR v_fee < 1 THEN
    RETURN 35400;
  END IF;
  RETURN round(v_fee);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_transfer_payment_note(p_user_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'SWG-' || upper(substr(replace(p_user_id::text, '-', ''), 1, 6));
$$;

REVOKE ALL ON FUNCTION public.assessment_fee_for_worker(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_transfer_payment_note(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_transfer_payment_note(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Worker / partner submits proof. Does not unlock the journey.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_bank_transfer_payment(
  p_method text,
  p_provider_ref text,
  p_proof_path text,
  p_proof_file_name text,
  p_amount numeric,
  p_transferred_on date,
  p_worker_user_id uuid DEFAULT NULL
)
RETURNS public.worker_assessment_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_method text;
  v_ref text;
  v_path text;
  v_name text;
  v_fee numeric;
  v_note text;
  v_row public.worker_verification;
  rec public.worker_assessment_payments;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_subject := COALESCE(p_worker_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to submit a payment for this worker';
  END IF;

  v_method := lower(btrim(COALESCE(p_method, '')));
  IF v_method NOT IN ('upi', 'imps', 'neft', 'rtgs') THEN
    RAISE EXCEPTION 'Choose UPI, IMPS, NEFT or RTGS';
  END IF;

  v_ref := upper(regexp_replace(COALESCE(p_provider_ref, ''), '\s+', '', 'g'));
  IF v_ref !~ '^[A-Z0-9]{8,30}$' THEN
    RAISE EXCEPTION 'Enter the UTR or UPI reference from your receipt (8–30 letters or numbers)';
  END IF;

  v_path := btrim(COALESCE(p_proof_path, ''));
  v_name := left(btrim(COALESCE(p_proof_file_name, 'receipt')), 120);
  IF v_path = '' OR v_path ~ '\.\.' OR v_path NOT LIKE v_subject::text || '/assessment-payments/%' THEN
    RAISE EXCEPTION 'Upload a screenshot or PDF of the transfer';
  END IF;

  IF p_transferred_on IS NULL OR p_transferred_on > CURRENT_DATE OR p_transferred_on < (CURRENT_DATE - 30) THEN
    RAISE EXCEPTION 'Transfer date must be within the last 30 days';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_subject FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;
  IF v_row.payment_status = 'paid' OR v_row.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'Assessment already paid';
  END IF;
  IF v_row.stage IS DISTINCT FROM 'awaiting_payment' THEN
    RAISE EXCEPTION 'Payment stage is not active';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.worker_assessment_payments
     WHERE user_id = v_subject
       AND provider = 'bank_transfer'
       AND status = 'submitted'
  ) THEN
    RAISE EXCEPTION 'A bank transfer is already under review';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.worker_assessment_payments
     WHERE provider = 'bank_transfer'
       AND status IN ('submitted', 'paid')
       AND upper(provider_ref) = v_ref
       AND user_id IS DISTINCT FROM v_subject
  ) THEN
    RAISE EXCEPTION 'This transfer reference is already used';
  END IF;

  v_fee := public.assessment_fee_for_worker(v_subject);
  IF round(COALESCE(p_amount, 0)) IS DISTINCT FROM round(v_fee) THEN
    RAISE EXCEPTION 'Pay the exact fee of ₹%', to_char(v_fee, 'FM999999990');
  END IF;

  v_note := public.bank_transfer_payment_note(v_subject);

  INSERT INTO public.worker_assessment_payments (
    user_id, amount, currency, status, provider, provider_ref,
    transfer_method, proof_path, proof_file_name, payment_note, transferred_on
  ) VALUES (
    v_subject, v_fee, 'INR', 'submitted', 'bank_transfer', v_ref,
    v_method, v_path, v_name, v_note, p_transferred_on
  )
  RETURNING * INTO rec;

  RETURN rec;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_bank_transfer_payment(text, text, text, text, numeric, date, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_bank_transfer_payment(text, text, text, text, numeric, date, uuid)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin matches the credit in PNB, then approves (unlocks) or rejects.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_review_bank_transfer_payment(
  p_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  act text;
  rec public.worker_assessment_payments;
  row public.worker_verification;
  trade_required boolean;
  next_stage text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  act := lower(btrim(COALESCE(p_action, '')));
  IF act NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Unknown action';
  END IF;
  IF act = 'reject' AND (p_reason IS NULL OR length(btrim(p_reason)) < 4) THEN
    RAISE EXCEPTION 'Reason for rejection is required';
  END IF;

  SELECT * INTO rec
  FROM public.worker_assessment_payments
  WHERE user_id = p_user_id
    AND provider = 'bank_transfer'
    AND status = 'submitted'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No bank transfer is waiting for review';
  END IF;

  SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;

  IF act = 'reject' THEN
    UPDATE public.worker_assessment_payments
       SET status = 'rejected',
           rejection_reason = btrim(p_reason),
           reviewed_by = auth.uid(),
           reviewed_at = now()
     WHERE id = rec.id;

    RETURN row;
  END IF;

  IF row.payment_status = 'paid' THEN
    UPDATE public.worker_assessment_payments
       SET status = 'rejected',
           rejection_reason = 'Already paid by another method',
           reviewed_by = auth.uid(),
           reviewed_at = now()
     WHERE id = rec.id;
    RETURN row;
  END IF;

  IF row.stage IS DISTINCT FROM 'awaiting_payment' THEN
    RAISE EXCEPTION 'Payment stage is not active';
  END IF;

  trade_required := COALESCE(row.trade_test_required, true);
  next_stage := CASE WHEN trade_required THEN 'trade_test' ELSE 'medical' END;

  UPDATE public.worker_assessment_payments
     SET status = 'paid',
         paid_at = now(),
         rejection_reason = NULL,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = rec.id;

  UPDATE public.worker_verification
     SET payment_status = 'paid',
         payment_amount = rec.amount,
         paid_at = now(),
         trade_test_required = trade_required,
         trade_test_status = CASE
           WHEN trade_required THEN COALESCE(trade_test_status, 'pending')
           ELSE 'not_required'
         END,
         stage = next_stage,
         updated_at = now()
   WHERE id = row.id
   RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_bank_transfer_payment(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_bank_transfer_payment(uuid, text, text)
  TO authenticated;
