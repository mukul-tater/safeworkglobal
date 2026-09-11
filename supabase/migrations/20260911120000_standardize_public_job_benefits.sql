-- Every public job listing uses the same benefits package.
UPDATE public.jobs
SET benefits =
  'Flight tickets' || chr(10) ||
  'Accommodation' || chr(10) ||
  'Food or food allowance (min. AED 200) + kitchen facilities' || chr(10) ||
  'Local transport' || chr(10) ||
  'MOL' || chr(10) ||
  'Work visa and Emirates ID' || chr(10) ||
  'Legal contract and job security' || chr(10) ||
  'Airport pickup' || chr(10) ||
  '8-10 hours of duty + overtime (extra pay)' || chr(10) ||
  'Medical facility + Insurance in Dubai' || chr(10) ||
  '11+1' || chr(10) ||
  'Return airfare after 2 years';
