-- Align listed UAE job salaries with the Dubai interview-drive Grade C–A AED table.
-- Converted at 1 AED ≈ ₹23 and rounded to the nearest ₹1,000.

UPDATE public.jobs AS j
SET
  salary_min = s.salary_min,
  salary_max = s.salary_max,
  currency = 'INR',
  salary_display = s.salary_display
FROM (
  VALUES
    ('uae-listed-mig-welder', 35000, 39000, '₹35,000 – ₹39,000'),
    ('uae-listed-tig-welder', 35000, 39000, '₹35,000 – ₹39,000'),
    ('uae-listed-welder', 35000, 39000, '₹35,000 – ₹39,000'),
    ('uae-listed-aluminium-fabricator', 35000, 39000, '₹35,000 – ₹39,000'),
    ('uae-listed-industrial-electrician', 31000, 37000, '₹31,000 – ₹37,000'),
    ('uae-listed-electrician', 31000, 37000, '₹31,000 – ₹37,000'),
    ('uae-listed-finishing-carpenter', 32000, 38000, '₹32,000 – ₹38,000'),
    ('uae-listed-shuttering-carpenter', 32000, 37000, '₹32,000 – ₹37,000'),
    ('uae-listed-tile-mason', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-all-round-mason', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-block-plaster-mason', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-steel-fixer', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-mason', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-plumber', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-pipe-fitter', 31000, 36000, '₹31,000 – ₹36,000'),
    ('uae-listed-ductman', 31000, 34000, '₹31,000 – ₹34,000'),
    ('uae-listed-mechanical-helper', 27000, 28000, '₹27,000 – ₹28,000'),
    ('uae-listed-civil-helper', 27000, 28000, '₹27,000 – ₹28,000'),
    ('uae-listed-general-helper', 27000, 27000, '₹27,000'),
    ('uae-listed-civil-labour', 27000, 27000, '₹27,000')
) AS s(slug, salary_min, salary_max, salary_display)
WHERE j.slug = s.slug;
