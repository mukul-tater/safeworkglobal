CREATE OR REPLACE FUNCTION public.complete_assessment_payment_razorpay(p_user_id uuid, p_payment_id text, p_order_id text, p_amount numeric DEFAULT NULL::numeric)
RETURNS public.worker_verification LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  row public.worker_verification;
  trade_required boolean;
  next_stage text;
  pay_id text := trim(coalesce(p_payment_id, ''));
  order_id text := trim(coalesce(p_order_id, ''));
  v_amount numeric;
BEGIN
  IF p_user_id IS NULL OR pay_id = '' OR order_id = '' THEN RAISE EXCEPTION 'Invalid payment payload'; END IF;
  IF EXISTS (SELECT 1 FROM public.worker_verification WHERE razorpay_payment_id = pay_id AND user_id IS DISTINCT FROM p_user_id) THEN RAISE EXCEPTION 'Payment already applied to another account'; END IF;
  IF EXISTS (SELECT 1 FROM public.worker_assessment_payments WHERE provider = 'razorpay' AND provider_ref = pay_id AND user_id IS DISTINCT FROM p_user_id) THEN RAISE EXCEPTION 'Payment already applied to another account'; END IF;
  SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verification row not found'; END IF;
  IF row.payment_status = 'paid' THEN RETURN row; END IF;
  IF row.stage IS DISTINCT FROM 'awaiting_payment' THEN RAISE EXCEPTION 'Payment stage is not active'; END IF;
  IF row.razorpay_order_id IS NULL OR length(trim(row.razorpay_order_id)) = 0 THEN RAISE EXCEPTION 'No Razorpay order bound to this assessment'; END IF;
  IF trim(row.razorpay_order_id) IS DISTINCT FROM order_id THEN RAISE EXCEPTION 'Order does not match this assessment'; END IF;
  v_amount := round(COALESCE(p_amount, row.payment_amount));
  IF v_amount IS NULL OR v_amount < 1 THEN RAISE EXCEPTION 'Payment amount is missing'; END IF;
  trade_required := COALESCE(row.trade_test_required, true);
  next_stage := CASE WHEN trade_required THEN 'trade_test' ELSE 'medical' END;
  INSERT INTO public.worker_assessment_payments (user_id, amount, status, provider, provider_ref, paid_at)
  VALUES (p_user_id, v_amount, 'paid', 'razorpay', pay_id, now());
  UPDATE public.worker_verification SET payment_status = 'paid', payment_amount = v_amount, paid_at = now(), razorpay_payment_id = pay_id, razorpay_order_id = order_id, trade_test_required = trade_required, trade_test_status = CASE WHEN trade_required THEN COALESCE(trade_test_status, 'pending') ELSE 'not_required' END, stage = next_stage, updated_at = now() WHERE id = row.id RETURNING * INTO row;
  RETURN row;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id;
  IF FOUND AND row.payment_status = 'paid' AND row.razorpay_payment_id = pay_id THEN RETURN row; END IF;
  RAISE EXCEPTION 'Payment already applied to another account';
END;
$function$;
REVOKE ALL ON FUNCTION public.complete_assessment_payment_razorpay(uuid,text,text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_assessment_payment_razorpay(uuid,text,text,numeric) TO service_role;