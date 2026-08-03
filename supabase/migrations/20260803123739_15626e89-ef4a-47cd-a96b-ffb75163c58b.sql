CREATE OR REPLACE FUNCTION public.complete_assessment_payment_razorpay(
  p_user_id uuid,
  p_payment_id text,
  p_order_id text,
  p_amount numeric DEFAULT 35400
)
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.worker_verification;
  trade_required boolean;
  next_stage text;
BEGIN
  IF p_user_id IS NULL OR p_payment_id IS NULL OR length(trim(p_payment_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid payment payload';
  END IF;

  SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;

  IF row.payment_status = 'paid' THEN
    RETURN row;
  END IF;

  IF row.stage IS DISTINCT FROM 'awaiting_payment' THEN
    RAISE EXCEPTION 'Payment stage is not active';
  END IF;

  trade_required := COALESCE(row.trade_test_required, true);
  next_stage := CASE WHEN trade_required THEN 'trade_test' ELSE 'medical' END;

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  INSERT INTO public.worker_assessment_payments (user_id, amount, status, provider, paid_at)
  VALUES (p_user_id, COALESCE(p_amount, 35400), 'paid', 'razorpay', now());

  UPDATE public.worker_verification
  SET
    payment_status = 'paid',
    payment_amount = COALESCE(p_amount, 35400),
    paid_at = now(),
    razorpay_payment_id = p_payment_id,
    razorpay_order_id = COALESCE(p_order_id, razorpay_order_id),
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

REVOKE ALL ON FUNCTION public.complete_assessment_payment_razorpay(uuid, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_assessment_payment_razorpay(uuid, text, text, numeric) TO service_role;