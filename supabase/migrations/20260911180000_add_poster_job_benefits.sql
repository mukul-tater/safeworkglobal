-- Add poster perks to every public job listing.
UPDATE public.jobs
SET benefits =
  'Flight tickets' || chr(10) ||
  'Accommodation' || chr(10) ||
  'Food - Minimum 200 and kitchen facilities' || chr(10) ||
  'Local transport' || chr(10) ||
  'MOL' || chr(10) ||
  'Work visa and Emirates ID' || chr(10) ||
  'Legal contract and job security' || chr(10) ||
  'Airport pickup' || chr(10) ||
  '8-10 hours of duty + overtime (extra pay)' || chr(10) ||
  'Medical facility + Insurance in Dubai' || chr(10) ||
  '11+1' || chr(10) ||
  'Return airfare after 2 years' || chr(10) ||
  'PBBY Insurance in India' || chr(10) ||
  'Uniform provided by company' || chr(10) ||
  'Attendance bonus (26 working days)' || chr(10) ||
  '6-day work week' || chr(10) ||
  '2-year contract';
