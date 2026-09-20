-- Medical journey: worker can upload multiple lab reports.
-- This database may not have the later blood/x-ray URL columns — only medical_result_url.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS medical_report_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.worker_verification wv
SET medical_report_urls = jsonb_build_array(
  jsonb_build_object(
    'id', 'legacy-result-' || wv.id::text,
    'url', wv.medical_result_url,
    'name', 'Medical report',
    'uploaded_at', wv.updated_at
  )
)
WHERE wv.medical_result_url IS NOT NULL
  AND COALESCE(jsonb_array_length(wv.medical_report_urls), 0) = 0;
