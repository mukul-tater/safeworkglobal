DROP POLICY IF EXISTS "trades public read" ON public.trades;
CREATE POLICY "Read active trades"
ON public.trades FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "partner_types public read" ON public.partner_types;
CREATE POLICY "Read active partner types"
ON public.partner_types FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Authenticated read field catalog" ON public.employer_visible_field_catalog;
CREATE POLICY "Employers and admins read field catalog"
ON public.employer_visible_field_catalog FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employer'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "FX rates readable by everyone" ON public.fx_rates;
CREATE POLICY "Read supported FX rates"
ON public.fx_rates FOR SELECT TO anon, authenticated
USING (
  currency_code IN ('AED','SAR','QAR','KWD','OMR','BHD','SGD','MYR','INR')
  AND inr_per_unit > 0
  AND updated_at <= now()
);

DROP POLICY IF EXISTS "Anyone can subscribe to the newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Visitors submit valid newsletter subscriptions"
ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 254
  AND email = lower(btrim(email))
  AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  AND char_length(source) BETWEEN 1 AND 50
  AND created_at <= now()
);

DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;
CREATE POLICY "Visitors submit valid contact forms"
ON public.contact_submissions FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 2 AND 100
  AND char_length(email) BETWEEN 3 AND 254
  AND email = lower(btrim(email))
  AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  AND char_length(btrim(subject)) BETWEEN 2 AND 200
  AND char_length(btrim(message)) BETWEEN 10 AND 5000
  AND status = 'new'
  AND responded_at IS NULL
  AND created_at <= now()
);

DROP POLICY IF EXISTS "Authenticated read bond template files" ON storage.objects;
CREATE POLICY "Read own or active bond template files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-documents'
  AND (storage.foldername(name))[1] = 'bond-templates'
  AND (
    owner_id = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      public.has_role(auth.uid(), 'worker'::public.app_role)
      AND EXISTS (
        SELECT 1 FROM public.bond_templates bt
        WHERE bt.active = true
          AND bt.file_url LIKE '%' || replace(storage.objects.name, '/', '%2F') || '%'
      )
    )
  )
);

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Owners and admins can list avatar objects"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND (
    owner_id = auth.uid()::text
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);