-- Public UAE salaries show AED and INR together. 1 AED = ₹23, the rate used for these bands.

UPDATE public.jobs
SET salary_display =
  'AED ' || to_char(round(salary_min / 23.0), 'FM999,999,999') ||
  CASE
    WHEN salary_min = salary_max THEN ''
    ELSE ' – ' || to_char(round(salary_max / 23.0), 'FM999,999,999')
  END ||
  ' (₹' || to_char(salary_min, 'FM999,999,999') ||
  CASE
    WHEN salary_min = salary_max THEN ''
    ELSE ' – ₹' || to_char(salary_max, 'FM999,999,999')
  END ||
  ')'
WHERE country = 'UAE'
  AND currency = 'INR'
  AND salary_min IS NOT NULL
  AND salary_max IS NOT NULL
  AND id <> 'a1e10000-2026-4000-8000-000000000030'::uuid
  AND slug NOT IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000');
