REVOKE ALL ON FUNCTION public.enforce_message_update_integrity() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_offer_worker_update_limits() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_partner_sensitive_field_changes() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_partners_privileged_field_changes() FROM anon, authenticated;