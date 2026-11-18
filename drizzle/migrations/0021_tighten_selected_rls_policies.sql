DROP POLICY IF EXISTS "Signed-in users can read platform payment settings" ON public.platform_payment_settings;
CREATE POLICY "Workers and admins can read platform payment settings" ON public.platform_payment_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'worker'::app_role));

DROP POLICY IF EXISTS "Public can resolve job redirects" ON public.job_slug_redirects;
CREATE POLICY "Public can resolve redirects for active jobs" ON public.job_slug_redirects
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_slug_redirects.job_id AND j.status = 'ACTIVE'));

DROP POLICY IF EXISTS "Anyone can read journey rules" ON public.journey_rules;
CREATE POLICY "Journey participants can read journey rules" ON public.journey_rules
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'worker'::app_role) OR public.has_role(auth.uid(), 'interviewer'::app_role));

DROP POLICY IF EXISTS "Visitors can record SEO events" ON public.seo_events;
CREATE POLICY "Visitors can record valid SEO events" ON public.seo_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  event_type IN ('landing_view','job_view','application_start','application_complete','registration_complete')
  AND (path IS NULL OR length(path) <= 500)
  AND (country IS NULL OR length(country) <= 100)
  AND (city IS NULL OR length(city) <= 100)
  AND (category IS NULL OR length(category) <= 100)
  AND (referrer_host IS NULL OR length(referrer_host) <= 255)
  AND (utm_source IS NULL OR length(utm_source) <= 200)
  AND (utm_medium IS NULL OR length(utm_medium) <= 200)
  AND (utm_campaign IS NULL OR length(utm_campaign) <= 200)
  AND (session_id IS NULL OR length(session_id) <= 100)
);