CREATE OR REPLACE FUNCTION public.bootstrap_journey_email_vault(p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required';
  END IF;
  IF p_value IS NULL OR length(p_value) < 32 THEN
    RAISE EXCEPTION 'invalid value';
  END IF;
  PERFORM vault.create_secret(p_value, 'journey_email_webhook_secret');
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_journey_email_vault(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_journey_email_vault(text) TO service_role;