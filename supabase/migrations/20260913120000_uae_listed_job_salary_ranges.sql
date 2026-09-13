-- Set the public UAE listing salaries to the agreed monthly INR bands.

UPDATE public.jobs AS j
SET
  salary_min = s.salary_min,
  salary_max = s.salary_max,
  currency = 'INR',
  salary_display = s.salary_display
FROM (
  VALUES
    ('uae-listed-electrician', 35000, 42000, '₹35,000 – ₹42,000'),
    ('uae-listed-welder', 39000, 42000, '₹39,000 – ₹42,000'),
    ('uae-listed-plumber', 35000, 41000, '₹35,000 – ₹41,000'),
    ('uae-listed-shuttering-carpenter', 36000, 42000, '₹36,000 – ₹42,000'),
    ('uae-listed-mason', 35000, 41000, '₹35,000 – ₹41,000'),
    ('uae-listed-civil-helper', 30000, 32000, '₹30,000 – ₹32,000'),
    ('uae-listed-pipe-fitter', 35000, 41000, '₹35,000 – ₹41,000'),
    ('uae-listed-furniture-carpenter', 37000, 41000, '₹37,000 – ₹41,000'),
    ('uae-listed-steel-fixer', 35000, 41000, '₹35,000 – ₹41,000'),
    ('uae-listed-ac-technician', 39000, 50000, '₹39,000 – ₹50,000'),
    ('uae-listed-warehouse-labour', 30000, 32000, '₹30,000 – ₹32,000'),
    ('uae-listed-scaffolder', 36000, 42000, '₹36,000 – ₹42,000'),
    ('uae-listed-painter', 36000, 42000, '₹36,000 – ₹42,000'),
    ('uae-listed-aluminium-fabricator', 39000, 42000, '₹39,000 – ₹42,000')
) AS s(slug, salary_min, salary_max, salary_display)
WHERE j.slug = s.slug;
