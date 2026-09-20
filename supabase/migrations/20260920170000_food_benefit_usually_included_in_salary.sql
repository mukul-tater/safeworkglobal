-- Food perk: note that it is usually included in salary.

UPDATE public.jobs
SET benefits = replace(
  benefits,
  'Food - Minimum 200 and kitchen facilities',
  'Food (usually included in salary) - Minimum 200 and kitchen facilities'
)
WHERE benefits ILIKE '%Food - Minimum 200 and kitchen facilities%';
