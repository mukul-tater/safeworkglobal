-- Add Cleaner (Male/Female), MIG Welder, TIG Welder and Mason (bricks/plaster)
-- to the public UAE catalog. Reactivates closed MIG/TIG/block-plaster rows.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('mig_welder', 'MIG Welder', 21),
  ('tig_welder', 'TIG Welder', 22),
  ('block_plaster_mason', 'Mason (bricks/plaster)', 54),
  ('cleaner_male', 'Cleaner (Male)', 96),
  ('cleaner_female', 'Cleaner (Female)', 97)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
    'Flight tickets' || chr(10) ||
    'Accommodation' || chr(10) ||
    'Food (usually included in salary) - Minimum 200 and kitchen facilities' || chr(10) ||
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
    experience_level = seed.experience_level,
    salary_min = seed.salary_min,
    salary_max = seed.salary_max,
    currency = 'INR',
    salary_display = seed.salary_display,
    visa_sponsorship = true,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  FROM (
    VALUES
      (
        'a1e10000-2026-4000-8000-000000000009'::uuid,
        'MIG Welder',
        'uae-listed-mig-welder',
        'Dubai',
        'INTERMEDIATE',
        39000, 42000, '₹39,000 – ₹42,000',
        'MIG welder openings for UAE fabrication and construction in Dubai. Wire-feed welding on structural steel, plates and ducts preferred.',
        '2+ years MIG / MAG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Set up MIG / MAG plant, wire, gas and parameters as per WPS' || chr(10) || 'MIG-weld structural steel, plates, ducts and fabrication spools' || chr(10) || 'Fit, tack and weld joints to drawings; grind and clean between passes' || chr(10) || 'Carry out visual checks for undercut, porosity and incomplete fusion' || chr(10) || 'Use screens, fire watch and PPE for hot work' || chr(10) || 'Report defects and complete rework as directed'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000a'::uuid,
        'TIG Welder',
        'uae-listed-tig-welder',
        'Abu Dhabi',
        'INTERMEDIATE',
        39000, 42000, '₹39,000 – ₹42,000',
        'TIG welder openings for UAE pipe, tank and precision fabrication in Abu Dhabi. Stainless / aluminium TIG experience preferred.',
        '2+ years TIG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Set up TIG plant, tungsten, filler and argon as per WPS' || chr(10) || 'TIG-weld stainless, aluminium or carbon-steel pipe and sheet' || chr(10) || 'Run root and fill passes on pipe, tanks and precision joints' || chr(10) || 'Keep the purge and gas shield; inspect for oxidation and undercut' || chr(10) || 'Read isometric and fabrication drawings' || chr(10) || 'Follow hot-work, PPE and UAE HSE procedures'
      ),
      (
        'a1e10000-2026-4000-8000-000000000010'::uuid,
        'Mason (bricks/plaster)',
        'uae-listed-block-plaster-mason',
        'Abu Dhabi',
        'INTERMEDIATE',
        35000, 41000, '₹35,000 – ₹41,000',
        'Brick, block and plaster mason openings for UAE building works in Abu Dhabi. Brick/block laying and internal/external plastering.',
        '2+ years brick / block work and plastering experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Lay bricks and AAC / concrete blocks to line, level and plumb' || chr(10) || 'Build walls, columns, partitions and openings as marked out' || chr(10) || 'Apply scratch and finish plaster coats to walls and soffits' || chr(10) || 'Mix mortar and plaster to the specified ratio' || chr(10) || 'Install lintels, mesh and corner beads as required' || chr(10) || 'Keep joints, corners and surfaces within tolerance and follow HSE'
      )
  ) AS seed(
    id, title, slug, city, experience_level,
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
      seed.experience_level,
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
          'a1e10000-2026-4000-8000-000000000009'::uuid,
          'MIG Welder',
          'uae-listed-mig-welder',
          'Dubai',
          'INTERMEDIATE',
          39000, 42000, '₹39,000 – ₹42,000', 10,
          'MIG welder openings for UAE fabrication and construction in Dubai. Wire-feed welding on structural steel, plates and ducts preferred.',
          '2+ years MIG / MAG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
          'Set up MIG / MAG plant, wire, gas and parameters as per WPS' || chr(10) || 'MIG-weld structural steel, plates, ducts and fabrication spools' || chr(10) || 'Fit, tack and weld joints to drawings; grind and clean between passes' || chr(10) || 'Carry out visual checks for undercut, porosity and incomplete fusion' || chr(10) || 'Use screens, fire watch and PPE for hot work' || chr(10) || 'Report defects and complete rework as directed'
        ),
        (
          'a1e10000-2026-4000-8000-00000000000a'::uuid,
          'TIG Welder',
          'uae-listed-tig-welder',
          'Abu Dhabi',
          'INTERMEDIATE',
          39000, 42000, '₹39,000 – ₹42,000', 8,
          'TIG welder openings for UAE pipe, tank and precision fabrication in Abu Dhabi. Stainless / aluminium TIG experience preferred.',
          '2+ years TIG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
          'Set up TIG plant, tungsten, filler and argon as per WPS' || chr(10) || 'TIG-weld stainless, aluminium or carbon-steel pipe and sheet' || chr(10) || 'Run root and fill passes on pipe, tanks and precision joints' || chr(10) || 'Keep the purge and gas shield; inspect for oxidation and undercut' || chr(10) || 'Read isometric and fabrication drawings' || chr(10) || 'Follow hot-work, PPE and UAE HSE procedures'
        ),
        (
          'a1e10000-2026-4000-8000-000000000010'::uuid,
          'Mason (bricks/plaster)',
          'uae-listed-block-plaster-mason',
          'Abu Dhabi',
          'INTERMEDIATE',
          35000, 41000, '₹35,000 – ₹41,000', 14,
          'Brick, block and plaster mason openings for UAE building works in Abu Dhabi. Brick/block laying and internal/external plastering.',
          '2+ years brick / block work and plastering experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Lay bricks and AAC / concrete blocks to line, level and plumb' || chr(10) || 'Build walls, columns, partitions and openings as marked out' || chr(10) || 'Apply scratch and finish plaster coats to walls and soffits' || chr(10) || 'Mix mortar and plaster to the specified ratio' || chr(10) || 'Install lintels, mesh and corner beads as required' || chr(10) || 'Keep joints, corners and surfaces within tolerance and follow HSE'
        ),
        (
          'a1e10000-2026-4000-8000-000000000020'::uuid,
          'Cleaner (Male)',
          'uae-listed-cleaner-male',
          'Dubai',
          'ENTRY',
          28000, 32000, '₹28,000 – ₹32,000', 20,
          'Male cleaner openings for UAE camps, offices, sites and facilities in Dubai. Sweeping, mopping and housekeeping under supervisor instructions.',
          'Physically fit for cleaning work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Sweep, mop and keep assigned floors, rooms and common areas clean' || chr(10) || 'Empty bins and take waste to the designated collection point' || chr(10) || 'Clean toilets, pantries and wash areas with the chemicals provided' || chr(10) || 'Follow the daily cleaning checklist and supervisor instructions' || chr(10) || 'Report spills, damage and missing supplies promptly' || chr(10) || 'Wear PPE and follow site HSE and hygiene rules'
        ),
        (
          'a1e10000-2026-4000-8000-000000000021'::uuid,
          'Cleaner (Female)',
          'uae-listed-cleaner-female',
          'Dubai',
          'ENTRY',
          28000, 32000, '₹28,000 – ₹32,000', 20,
          'Female cleaner openings for UAE camps, offices, residences and facilities in Dubai. Sweeping, mopping and housekeeping under supervisor instructions.',
          'Physically fit for cleaning work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
          'Sweep, mop and keep assigned floors, rooms and common areas clean' || chr(10) || 'Empty bins and take waste to the designated collection point' || chr(10) || 'Clean toilets, pantries and wash areas with the chemicals provided' || chr(10) || 'Follow the daily cleaning checklist and supervisor instructions' || chr(10) || 'Report spills, damage and missing supplies promptly' || chr(10) || 'Wear PPE and follow site HSE and hygiene rules'
        )
    ) AS seed(
      id, title, slug, city, experience_level,
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
      ('a1e10000-2026-4000-8000-000000000009'::uuid, 'MIG Welding'),
      ('a1e10000-2026-4000-8000-000000000009'::uuid, 'Fabrication'),
      ('a1e10000-2026-4000-8000-00000000000a'::uuid, 'TIG Welding'),
      ('a1e10000-2026-4000-8000-00000000000a'::uuid, 'Pipe Welding'),
      ('a1e10000-2026-4000-8000-000000000010'::uuid, 'Block Work'),
      ('a1e10000-2026-4000-8000-000000000010'::uuid, 'Plastering'),
      ('a1e10000-2026-4000-8000-000000000020'::uuid, 'Cleaning'),
      ('a1e10000-2026-4000-8000-000000000020'::uuid, 'Housekeeping'),
      ('a1e10000-2026-4000-8000-000000000021'::uuid, 'Cleaning'),
      ('a1e10000-2026-4000-8000-000000000021'::uuid, 'Housekeeping')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
