-- Bike delivery perks: stay and food until the license, plus the standard UAE package.

UPDATE public.jobs
SET benefits =
  'Flight tickets' || chr(10) ||
  'Accommodation (till the license is issued)' || chr(10) ||
  'Food (usually included in salary) - Minimum 200 and kitchen facilities (2 Wheeler license milne tak)' || chr(10) ||
  'Local transport' || chr(10) ||
  'MOL' || chr(10) ||
  'Work visa and Emirates ID' || chr(10) ||
  'Legal contract and job security' || chr(10) ||
  'Airport pickup' || chr(10) ||
  '8-10 hours of duty + overtime (extra pay)' || chr(10) ||
  'Medical facility + Insurance in Dubai' || chr(10) ||
  'PBBY Insurance in India' || chr(10) ||
  'Uniform provided by company' || chr(10) ||
  '2-year contract'
WHERE id = 'a1e10000-2026-4000-8000-000000000030'::uuid
   OR slug IN ('uae-listed-bike-rider', 'uae-listed-bike-rider-a1e10000');
