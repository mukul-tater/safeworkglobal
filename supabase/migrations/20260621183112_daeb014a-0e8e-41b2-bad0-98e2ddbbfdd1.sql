
-- Storage policies for worker-videos (now private)
DROP POLICY IF EXISTS "Worker videos: owners manage own" ON storage.objects;
DROP POLICY IF EXISTS "Worker videos: admin read" ON storage.objects;
DROP POLICY IF EXISTS "Worker videos: employer read on application" ON storage.objects;

CREATE POLICY "Worker videos: owners manage own"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'worker-videos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'worker-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Worker videos: admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Worker videos: employer read on application"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-videos'
  AND public.has_role(auth.uid(), 'employer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.employer_id = auth.uid()
      AND ja.worker_id::text = (storage.foldername(name))[1]
  )
);

-- Admin storage read on worker-documents
DROP POLICY IF EXISTS "Worker documents: admin read" ON storage.objects;
CREATE POLICY "Worker documents: admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Worker write access to worker_profile_employer_info (mirror table managed by trigger but allow direct writes too)
DROP POLICY IF EXISTS "Workers can insert their employer info" ON public.worker_profile_employer_info;
DROP POLICY IF EXISTS "Workers can update their employer info" ON public.worker_profile_employer_info;

CREATE POLICY "Workers can insert their employer info"
ON public.worker_profile_employer_info FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can update their employer info"
ON public.worker_profile_employer_info FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
