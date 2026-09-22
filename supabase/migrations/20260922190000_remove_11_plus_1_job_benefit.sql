-- Drop 11+1 from stored job benefits. Public listings no longer include it.

UPDATE public.jobs
SET benefits = trim(both chr(10) from regexp_replace(
  benefits,
  '(^|' || chr(10) || ')11\+1(' || chr(10) || '|$)',
  '\1',
  'gi'
))
WHERE benefits ILIKE '%11+1%';
