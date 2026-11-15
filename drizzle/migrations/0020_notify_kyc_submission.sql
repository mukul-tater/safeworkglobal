CREATE OR REPLACE FUNCTION public.notify_worker_kyc_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kyc_status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.kyc_status IS DISTINCT FROM NEW.kyc_status) THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (NEW.user_id, 'journey_step_cleared',
      'Identity (KYC) submitted / पहचान दस्तावेज़ जमा हो गए',
      'Your identity documents have been submitted. SafeWork will review them and notify you of the result. / आपके पहचान दस्तावेज़ जमा हो गए हैं। सेफवर्क उनकी जाँच करके आपको परिणाम बताएगा।',
      jsonb_build_object('href', '/worker/journey', 'event', 'kyc_submitted', 'cleared_stage', 'identity', 'kyc_status', 'submitted'), false);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_worker_kyc_submitted() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_worker_kyc_submitted() TO service_role;
CREATE TRIGGER trg_notify_worker_kyc_submitted
AFTER INSERT OR UPDATE OF kyc_status ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_worker_kyc_submitted();