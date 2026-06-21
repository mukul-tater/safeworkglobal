DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;

CREATE POLICY "Workers can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'worker-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'worker-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);