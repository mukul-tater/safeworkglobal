-- Remove attendance bonus from the standard public job benefits package.

UPDATE public.jobs
SET benefits = trim(both chr(10) from regexp_replace(
  benefits,
  '(^|' || chr(10) || ')Attendance bonus \(26 working days\)(' || chr(10) || '|$)',
  '\1',
  'g'
))
WHERE benefits ILIKE '%Attendance bonus%';
