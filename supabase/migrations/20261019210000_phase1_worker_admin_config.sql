-- Phase 1: Quiz CMS owns the delivery pass mark and disclaimer,
-- carpenter stays hidden only through the job flag, Europe pay text is stored
-- on the job, and job switch stays off until an admin turns it on.

ALTER TABLE public.skill_quiz_configs
  ADD COLUMN IF NOT EXISTS disclaimer_en text,
  ADD COLUMN IF NOT EXISTS disclaimer_hi text;

UPDATE public.skill_quiz_configs
SET
  disclaimer_en = $disc$This test evaluates basic road safety, delivery handling and customer-service knowledge only. It does not certify driving ability or guarantee employment. Candidates must separately meet the applicable UAE driving licence, employer and job-specific requirements.$disc$,
  disclaimer_hi = $disc$यह टेस्ट केवल सड़क सुरक्षा, डिलीवरी हैंडलिंग और ग्राहक सेवा का बुनियादी ज्ञान जाँचता है। यह ड्राइविंग क्षमता प्रमाणित नहीं करता और नौकरी की गारंटी नहीं देता। उम्मीदवारों को UAE ड्राइविंग लाइसेंस, नियोक्ता और नौकरी की अलग शर्तें पूरी करनी होंगी।$disc$,
  updated_at = now()
WHERE skill_code = 'Delivery'
  AND region IS NULL
  AND disclaimer_en IS NULL;

UPDATE public.jobs
SET hidden_from_public = true
WHERE hidden_from_public = false
  AND (slug = 'uae-listed-carpenter' OR lower(trim(title)) = 'carpenter');

UPDATE public.jobs
SET description = replace(
  description,
  'The vacancy states 180 per hour. The currency was not stated.',
  'Pay is 180 CZK per hour.'
)
WHERE description LIKE '%The vacancy states 180 per hour. The currency was not stated.%';

UPDATE public.jobs
SET salary_display = 'Pay is 180 CZK per hour.'
WHERE salary_display ILIKE '%180 per hour%'
  AND salary_display ILIKE '%currency not stated%';

ALTER TABLE public.journey_job_settings
  ALTER COLUMN job_switch_enabled SET DEFAULT false;

UPDATE public.journey_job_settings
SET job_switch_enabled = false,
    updated_at = now()
WHERE id = 1;
