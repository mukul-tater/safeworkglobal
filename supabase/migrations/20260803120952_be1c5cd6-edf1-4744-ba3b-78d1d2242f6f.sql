-- 1) Remove email-allowlist based automatic admin granting
DROP FUNCTION IF EXISTS public.ensure_whitelisted_admin();
DROP FUNCTION IF EXISTS public.is_whitelisted_admin_email(text);

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin roles are never auto-granted. Grant manually via admin_set_user_role.
  RETURN NEW;
END;
$function$;

-- 2) Replace fragile LIKE matching in employer document storage policy with exact matching
DROP POLICY IF EXISTS "Employers view applicant worker documents" ON storage.objects;

CREATE POLICY "Employers view applicant worker documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'worker-documents'
  AND public.has_role(auth.uid(), 'employer'::app_role)
  AND EXISTS (
    SELECT 1
    FROM job_applications ja
    JOIN worker_documents wd ON wd.worker_id = ja.worker_id
    WHERE ja.worker_id::text = (storage.foldername(objects.name))[1]
      AND ja.employer_id = auth.uid()
      AND wd.verification_status = 'verified'
      AND (
        wd.file_url = objects.name
        OR wd.file_url = 'worker-documents/' || objects.name
        OR regexp_replace(wd.file_url, '^.*/worker-documents/', '') = objects.name
        OR replace(regexp_replace(wd.file_url, '^.*/worker-documents/', ''), '%20', ' ') = objects.name
      )
  )
);