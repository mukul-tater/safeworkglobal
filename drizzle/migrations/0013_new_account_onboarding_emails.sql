CREATE OR REPLACE FUNCTION public.request_onboarding_email(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_secret text;
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND created_at >= '2026-10-25T06:11:23Z'::timestamptz
  ) THEN RETURN; END IF;
  webhook_secret := public.journey_email_webhook_secret();
  IF webhook_secret IS NULL THEN
    RAISE WARNING 'onboarding email skipped: webhook not configured';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://etpiadoqryvtlpmiuxia.supabase.co/functions/v1/email-onboarding',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || webhook_secret),
    body := jsonb_build_object('user_id', p_user_id)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'onboarding email request failed';
END;
$$;
REVOKE ALL ON FUNCTION public.request_onboarding_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_onboarding_email(uuid) TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.notify_new_account_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role::text IN ('worker', 'employer', 'partner') THEN
    PERFORM public.request_onboarding_email(NEW.user_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'onboarding email trigger failed';
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_new_account_onboarding() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_account_onboarding() TO postgres, service_role;

CREATE TRIGGER trg_new_account_onboarding_email
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.notify_new_account_onboarding();