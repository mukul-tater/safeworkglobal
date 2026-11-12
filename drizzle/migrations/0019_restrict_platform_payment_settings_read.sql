DROP POLICY IF EXISTS "Anyone can read platform payment settings" ON public.platform_payment_settings;
REVOKE SELECT ON public.platform_payment_settings FROM anon;
GRANT SELECT ON public.platform_payment_settings TO authenticated;
GRANT ALL ON public.platform_payment_settings TO service_role;
CREATE POLICY "Signed-in users can read platform payment settings"
ON public.platform_payment_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);