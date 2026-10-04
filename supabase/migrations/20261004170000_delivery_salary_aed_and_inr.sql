-- Bike rider pay is shown in both AED and INR.

UPDATE public.jobs
SET
  currency = 'AED',
  salary_display = 'AED 7.5 (₹190 – ₹200) per delivery',
  description = replace(
    replace(
      description,
      'Pay is ₹190 – ₹200 per delivery.',
      'Pay is AED 7.5 (₹190 – ₹200) per delivery.'
    ),
    'Pay is AED 7.5 per delivery.',
    'Pay is AED 7.5 (₹190 – ₹200) per delivery.'
  )
WHERE id = 'a1e10000-2026-4000-8000-000000000030'::uuid
   OR slug IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000');
