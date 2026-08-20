-- Medical test step: blood report, X-ray report, and X-ray photo.

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS medical_blood_report_url text,
  ADD COLUMN IF NOT EXISTS medical_xray_report_url text,
  ADD COLUMN IF NOT EXISTS medical_xray_photo_url text;

-- Existing single-file uploads count as the blood report until the worker re-submits.
UPDATE public.worker_verification
SET medical_blood_report_url = medical_result_url
WHERE medical_blood_report_url IS NULL
  AND medical_result_url IS NOT NULL;
