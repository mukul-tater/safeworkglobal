REVOKE ALL ON FUNCTION public.journey_email_webhook_secret() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.request_journey_step_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_journey_step_email() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.journey_email_webhook_secret() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.request_journey_step_email(uuid) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_journey_step_email() TO postgres, service_role;