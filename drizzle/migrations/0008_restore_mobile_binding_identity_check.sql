CREATE OR REPLACE FUNCTION public.signup_mobile_taken(
  p_phone text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
BEGIN
  IF length(digits) <> 10 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = digits
      AND (p_except_user_id IS NULL OR p.id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.partner_profiles pp
    WHERE (
      right(regexp_replace(coalesce(pp.mobile, ''), '\D', '', 'g'), 10) = digits
      OR right(regexp_replace(coalesce(pp.whatsapp, ''), '\D', '', 'g'), 10) = digits
    )
    AND (p_except_user_id IS NULL OR pp.user_id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.partner_profiles_ext ppe
    JOIN public.partners pt ON pt.id = ppe.partner_id
    WHERE right(regexp_replace(coalesce(ppe.mobile, ''), '\D', '', 'g'), 10) = digits
      AND (p_except_user_id IS NULL OR pt.user_id IS NULL OR pt.user_id <> p_except_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) IN (
      'm' || digits || '@workers.safeworkglobal.app',
      'emitra' || digits || '@partners.safeworkglobal.app'
    )
    AND (p_except_user_id IS NULL OR u.id <> p_except_user_id)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.signup_mobile_taken(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.signup_mobile_taken(text, uuid) TO service_role;
NOTIFY pgrst, 'reload schema';