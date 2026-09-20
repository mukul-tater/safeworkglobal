-- Ensure Welder, AC Technician, Painter and Scaffolder are live on Find jobs.
-- Reactivates closed seed rows when present; inserts the canonical listing if missing.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('welder', 'Welder', 20),
  ('ac_technician', 'AC Technician', 72),
  ('painter', 'Painter', 80),
  ('scaffolder', 'Scaffolder', 61)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
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
    '6-day work week' || chr(10) ||
    '2-year contract';
BEGIN
  SELECT ep.user_id
    INTO v_employer
    FROM public.employer_profiles ep
    INNER JOIN public.user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
    ORDER BY ep.created_at
    LIMIT 1;

  IF v_employer IS NULL THEN
    SELECT ur.user_id
      INTO v_employer
      FROM public.user_roles ur
     WHERE ur.role = 'admin'
     LIMIT 1;
  END IF;

  UPDATE public.jobs AS j
  SET
    status = 'ACTIVE',
    title = seed.title,
    description = seed.description,
    requirements = seed.requirements,
    responsibilities = seed.responsibilities,
    benefits = COALESCE(NULLIF(j.benefits, ''), v_benefits),
    location = seed.city,
    country = 'UAE',
    job_type = 'FULL_TIME',
    experience_level = 'INTERMEDIATE',
    salary_min = seed.salary_min,
    salary_max = seed.salary_max,
    currency = 'INR',
    salary_display = seed.salary_display,
    visa_sponsorship = true,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  FROM (
    VALUES
      (
        'a1e10000-2026-4000-8000-000000000003'::uuid,
        'Welder',
        'uae-listed-welder',
        'Sharjah',
        39000, 42000, '₹39,000 – ₹42,000',
        'Structural and fabrication welding openings in Sharjah, UAE. ARC/MIG/TIG welders with site or workshop experience preferred.',
        '2+ years welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Perform ARC, MIG and/or TIG welding as per WPS and drawings' || chr(10) || 'Fit, tack and weld structural steel, plates, pipes or supports' || chr(10) || 'Grind, clean and prepare joints; carry out visual quality checks' || chr(10) || 'Read fabrication drawings and mark cutting lists' || chr(10) || 'Use PPE, screens and fire watch for hot work' || chr(10) || 'Report defects and complete rework as directed'
      ),
      (
        'a1e10000-2026-4000-8000-000000000017'::uuid,
        'AC Technician',
        'uae-listed-ac-technician',
        'Sharjah',
        39000, 50000, '₹39,000 – ₹50,000',
        'AC technician openings for UAE facilities and residential packages in Sharjah. Split, window and package unit installation and service.',
        '2+ years AC installation / service experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Install, service and repair split, window and package AC units' || chr(10) || 'Run copper piping, drain lines and indoor/outdoor connections' || chr(10) || 'Vacuum, charge and leak-test refrigerant circuits' || chr(10) || 'Diagnose cooling faults and replace filters, capacitors and fans' || chr(10) || 'Keep plant rooms and work areas clean' || chr(10) || 'Follow electrical isolation and site HSE rules'
      ),
      (
        'a1e10000-2026-4000-8000-000000000019'::uuid,
        'Painter',
        'uae-listed-painter',
        'Abu Dhabi',
        36000, 42000, '₹36,000 – ₹42,000',
        'Painter openings for UAE interiors and structural steel in Abu Dhabi. Surface preparation, emulsion, enamel and spray work.',
        '2+ years painting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Prepare surfaces: filling, sanding, priming and masking' || chr(10) || 'Apply emulsion, enamel and texture paint to walls, ceilings and steel' || chr(10) || 'Spray or roll to an even finish as per the specification' || chr(10) || 'Protect adjacent finishes and clean up after each area' || chr(10) || 'Touch up snags before handover' || chr(10) || 'Follow site HSE including working-at-height and solvent controls'
      ),
      (
        'a1e10000-2026-4000-8000-00000000001a'::uuid,
        'Scaffolder',
        'uae-listed-scaffolder',
        'Sharjah',
        36000, 42000, '₹36,000 – ₹42,000',
        'Scaffolder openings for UAE high-rise and industrial access in Sharjah. Tube-and-coupler or system scaffold erection and dismantling.',
        '2+ years scaffolding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Erect, alter and dismantle tube-and-coupler or system scaffold' || chr(10) || 'Set base plates, standards, ledgers, braces, platforms and ties' || chr(10) || 'Install guardrails, toe boards, ladders and working platforms' || chr(10) || 'Inspect components and tag incomplete or unsafe scaffold' || chr(10) || 'Follow working-at-height, lifting and site HSE rules' || chr(10) || 'Coordinate with civil and finishing trades for access'
      )
  ) AS seed(
    id, title, slug, city,
    salary_min, salary_max, salary_display,
    description, requirements, responsibilities
  )
  WHERE j.slug = seed.slug
     OR j.id = seed.id;

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping insert of missing UAE trade jobs: no employer or admin user found';
  ELSE
    INSERT INTO public.jobs (
      id, employer_id, created_by, posted_by_role,
      title, description, requirements, responsibilities, benefits,
      location, country, job_type, experience_level,
      salary_min, salary_max, currency, salary_display,
      openings, visa_sponsorship, remote_allowed, status,
      posted_at, expires_at, slug
    )
    SELECT
      seed.id,
      v_employer,
      v_employer,
      'admin',
      seed.title,
      seed.description,
      seed.requirements,
      seed.responsibilities,
      v_benefits,
      seed.city,
      'UAE',
      'FULL_TIME',
      'INTERMEDIATE',
      seed.salary_min,
      seed.salary_max,
      'INR',
      seed.salary_display,
      seed.openings,
      true,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      seed.slug
    FROM (
      VALUES
        (
          'a1e10000-2026-4000-8000-000000000003'::uuid,
          'Welder',
          'uae-listed-welder',
          'Sharjah',
          39000, 42000, '₹39,000 – ₹42,000', 8,
          'Structural and fabrication welding openings in Sharjah, UAE. ARC/MIG/TIG welders with site or workshop experience preferred.',
          '2+ years welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
          'Perform ARC, MIG and/or TIG welding as per WPS and drawings' || chr(10) || 'Fit, tack and weld structural steel, plates, pipes or supports' || chr(10) || 'Grind, clean and prepare joints; carry out visual quality checks' || chr(10) || 'Read fabrication drawings and mark cutting lists' || chr(10) || 'Use PPE, screens and fire watch for hot work' || chr(10) || 'Report defects and complete rework as directed'
        ),
        (
          'a1e10000-2026-4000-8000-000000000017'::uuid,
          'AC Technician',
          'uae-listed-ac-technician',
          'Sharjah',
          39000, 50000, '₹39,000 – ₹50,000', 10,
          'AC technician openings for UAE facilities and residential packages in Sharjah. Split, window and package unit installation and service.',
          '2+ years AC installation / service experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Install, service and repair split, window and package AC units' || chr(10) || 'Run copper piping, drain lines and indoor/outdoor connections' || chr(10) || 'Vacuum, charge and leak-test refrigerant circuits' || chr(10) || 'Diagnose cooling faults and replace filters, capacitors and fans' || chr(10) || 'Keep plant rooms and work areas clean' || chr(10) || 'Follow electrical isolation and site HSE rules'
        ),
        (
          'a1e10000-2026-4000-8000-000000000019'::uuid,
          'Painter',
          'uae-listed-painter',
          'Abu Dhabi',
          36000, 42000, '₹36,000 – ₹42,000', 12,
          'Painter openings for UAE interiors and structural steel in Abu Dhabi. Surface preparation, emulsion, enamel and spray work.',
          '2+ years painting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Prepare surfaces: filling, sanding, priming and masking' || chr(10) || 'Apply emulsion, enamel and texture paint to walls, ceilings and steel' || chr(10) || 'Spray or roll to an even finish as per the specification' || chr(10) || 'Protect adjacent finishes and clean up after each area' || chr(10) || 'Touch up snags before handover' || chr(10) || 'Follow site HSE including working-at-height and solvent controls'
        ),
        (
          'a1e10000-2026-4000-8000-00000000001a'::uuid,
          'Scaffolder',
          'uae-listed-scaffolder',
          'Sharjah',
          36000, 42000, '₹36,000 – ₹42,000', 15,
          'Scaffolder openings for UAE high-rise and industrial access in Sharjah. Tube-and-coupler or system scaffold erection and dismantling.',
          '2+ years scaffolding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Erect, alter and dismantle tube-and-coupler or system scaffold' || chr(10) || 'Set base plates, standards, ledgers, braces, platforms and ties' || chr(10) || 'Install guardrails, toe boards, ladders and working platforms' || chr(10) || 'Inspect components and tag incomplete or unsafe scaffold' || chr(10) || 'Follow working-at-height, lifting and site HSE rules' || chr(10) || 'Coordinate with civil and finishing trades for access'
        )
    ) AS seed(
      id, title, slug, city,
      salary_min, salary_max, salary_display, openings,
      description, requirements, responsibilities
    )
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.slug = seed.slug
          OR j.id = seed.id
          OR (j.country = 'UAE' AND lower(j.title) = lower(seed.title) AND j.status = 'ACTIVE')
    );
  END IF;

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000003'::uuid, 'ARC Welding'),
      ('a1e10000-2026-4000-8000-000000000003'::uuid, 'Fabrication'),
      ('a1e10000-2026-4000-8000-000000000017'::uuid, 'AC Installation'),
      ('a1e10000-2026-4000-8000-000000000017'::uuid, 'Air Conditioning'),
      ('a1e10000-2026-4000-8000-000000000019'::uuid, 'Painting'),
      ('a1e10000-2026-4000-8000-000000000019'::uuid, 'Surface Preparation'),
      ('a1e10000-2026-4000-8000-00000000001a'::uuid, 'Scaffolding'),
      ('a1e10000-2026-4000-8000-00000000001a'::uuid, 'Working at Height')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
