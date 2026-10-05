-- Bike delivery monthly pay: AED 3,000–3,500, with INR at ₹26 per AED.

UPDATE public.jobs
SET
  currency = 'INR',
  salary_min = 78000,
  salary_max = 91000,
  salary_display = 'AED 3,000 – 3,500 (₹78,000 – ₹91,000)',
  description = replace(
    replace(
      replace(
        description,
        'Pay is AED 7.5 (₹190 – ₹200) per delivery.',
        'Pay is AED 3,000 – 3,500 (₹78,000 – ₹91,000) per month.'
      ),
      'Pay is ₹190 – ₹200 per delivery.',
      'Pay is AED 3,000 – 3,500 (₹78,000 – ₹91,000) per month.'
    ),
    'Pay is AED 7.5 per delivery.',
    'Pay is AED 3,000 – 3,500 (₹78,000 – ₹91,000) per month.'
  )
WHERE id = 'a1e10000-2026-4000-8000-000000000030'::uuid
   OR slug IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000');
