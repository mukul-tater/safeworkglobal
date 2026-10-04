-- Bike rider pay is ₹190–₹200 per delivery. SafeWork service charge is ₹80,000.

UPDATE public.jobs
SET
  salary_min = NULL,
  salary_max = NULL,
  currency = 'INR',
  salary_display = '₹190 – ₹200 per delivery',
  service_charge = 80000,
  description = replace(
    description,
    'Pay is AED 7.5 per delivery.',
    'Pay is ₹190 – ₹200 per delivery.'
  )
WHERE id = 'a1e10000-2026-4000-8000-000000000030'::uuid
   OR slug IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000');
