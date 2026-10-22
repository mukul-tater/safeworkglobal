CREATE OR REPLACE FUNCTION public.enqueue_journey_step_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN (
    'journey_step_cleared',
    'trade_test_slip',
    'trade_test_slip_cancelled',
    'job_selected',
    'interview_scheduled',
    'kyc_reupload_required'
  ) THEN
    PERFORM public.request_journey_step_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;