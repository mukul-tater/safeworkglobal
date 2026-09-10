-- UAE Find-jobs catalog: electrician, plumber, welder, shuttering carpenter,
-- mason, civil helper, civil labour, pipe fitter.
-- Idempotent: skips a row if that UAE title is already live.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('shuttering_carpenter', 'Shuttering Carpenter', 45),
  ('civil_helper', 'Civil Helper', 91),
  ('civil_labour', 'Civil Labour', 92)
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  v_employer uuid;
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

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping UAE listed jobs seed: no employer or admin user found';
    RETURN;
  END IF;

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
    seed.benefits,
    seed.city,
    'UAE',
    'FULL_TIME',
    seed.experience_level,
    seed.salary_min,
    seed.salary_max,
    'AED',
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
        'a1e10000-2026-4000-8000-000000000001'::uuid,
        'Electrician',
        'uae-listed-electrician',
        'Dubai',
        'INTERMEDIATE',
        1800, 2500, 'AED 1,800 – 2,500', 12,
        'UAE construction and facilities employer hiring electricians for ongoing Dubai projects. Indian workers with site wiring, DB/MCB and fault-finding experience preferred. Visa sponsorship, accommodation and medical insurance for shortlisted candidates.',
        '2+ years electrical site experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install and maintain electrical systems to site drawings' || chr(10) || 'Follow HSE and LOTO procedures' || chr(10) || 'Fault finding and daily reporting',
        'Monthly salary AED 1,800 – 2,500' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000002'::uuid,
        'Plumber',
        'uae-listed-plumber',
        'Abu Dhabi',
        'INTERMEDIATE',
        1600, 2200, 'AED 1,600 – 2,200', 10,
        'UAE contractor hiring plumbers for residential and commercial projects in Abu Dhabi. PVC/CPVC/GI installation and leak testing experience preferred.',
        '2+ years plumbing experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install pipes, drainage and sanitary fittings' || chr(10) || 'Pressure and leak testing' || chr(10) || 'Follow HSE standards',
        'Monthly salary AED 1,600 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000003'::uuid,
        'Welder',
        'uae-listed-welder',
        'Sharjah',
        'INTERMEDIATE',
        1800, 2800, 'AED 1,800 – 2,800', 8,
        'Structural and fabrication welding openings in Sharjah, UAE. ARC/MIG/TIG welders with site or workshop experience preferred.',
        '2+ years welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Perform ARC/MIG/TIG welding to drawings' || chr(10) || 'Grinding, fabrication and quality checks' || chr(10) || 'Use PPE and follow HSE',
        'Monthly salary AED 1,800 – 2,800' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000004'::uuid,
        'Shuttering Carpenter',
        'uae-listed-shuttering-carpenter',
        'Dubai',
        'INTERMEDIATE',
        1500, 2200, 'AED 1,500 – 2,200', 15,
        'Formwork / shuttering carpenter openings for UAE high-rise and infrastructure projects in Dubai. Formwork erection, alignment and striking experience preferred.',
        '2+ years shuttering / formwork experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Erect and strike shuttering/formwork' || chr(10) || 'Align and level as per drawings' || chr(10) || 'Follow site safety',
        'Monthly salary AED 1,500 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000005'::uuid,
        'Mason',
        'uae-listed-mason',
        'Abu Dhabi',
        'INTERMEDIATE',
        1500, 2200, 'AED 1,500 – 2,200', 12,
        'Block and brick mason openings for UAE construction sites in Abu Dhabi. Block work, plastering support and mortar mixing experience preferred.',
        '2+ years masonry experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Block/brick laying to line and level' || chr(10) || 'Mix mortar and finish surfaces' || chr(10) || 'Follow HSE standards',
        'Monthly salary AED 1,500 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000006'::uuid,
        'Civil Helper',
        'uae-listed-civil-helper',
        'Dubai',
        'ENTRY',
        1200, 1600, 'AED 1,200 – 1,600', 25,
        'Civil helper openings supporting masons, carpenters and site gangs on Dubai projects. Site material handling and general civil support.',
        'Site experience preferred' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Assist skilled trades on site' || chr(10) || 'Material shifting and housekeeping' || chr(10) || 'Follow supervisor instructions and HSE',
        'Monthly salary AED 1,200 – 1,600' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000007'::uuid,
        'Civil Labour',
        'uae-listed-civil-labour',
        'Sharjah',
        'ENTRY',
        1100, 1500, 'AED 1,100 – 1,500', 30,
        'Civil labour openings for general construction work in Sharjah, UAE. Concreting support, excavation support and site cleaning.',
        'Physically fit for site work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'General civil labour as directed' || chr(10) || 'Concreting and excavation support' || chr(10) || 'Keep work area clean and safe',
        'Monthly salary AED 1,100 – 1,500' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000008'::uuid,
        'Pipe Fitter',
        'uae-listed-pipe-fitter',
        'Dubai',
        'INTERMEDIATE',
        1800, 2500, 'AED 1,800 – 2,500', 8,
        'Pipe fitter openings for UAE mechanical and plumbing packages in Dubai. Isometric reading, flange fitting and pipe routing experience preferred.',
        '2+ years pipe fitting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Fit and align pipes to isometrics' || chr(10) || 'Flange, support and leak-test work' || chr(10) || 'Follow HSE and quality standards',
        'Monthly salary AED 1,800 – 2,500' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      )
  ) AS seed(
    id, title, slug, city, experience_level,
    salary_min, salary_max, salary_display, openings,
    description, requirements, responsibilities, benefits
  )
  WHERE NOT EXISTS (
    SELECT 1
      FROM public.jobs j
     WHERE j.status = 'ACTIVE'
       AND (
         (j.country = 'UAE' AND lower(j.title) = lower(seed.title))
         OR j.slug = seed.slug
         OR j.id = seed.id
       )
  );

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000001'::uuid, 'Electrical Systems'),
      ('a1e10000-2026-4000-8000-000000000001'::uuid, 'Fault Finding'),
      ('a1e10000-2026-4000-8000-000000000002'::uuid, 'Pipe Fitting'),
      ('a1e10000-2026-4000-8000-000000000002'::uuid, 'Plumbing'),
      ('a1e10000-2026-4000-8000-000000000003'::uuid, 'ARC Welding'),
      ('a1e10000-2026-4000-8000-000000000003'::uuid, 'Fabrication'),
      ('a1e10000-2026-4000-8000-000000000004'::uuid, 'Formwork'),
      ('a1e10000-2026-4000-8000-000000000004'::uuid, 'Shuttering'),
      ('a1e10000-2026-4000-8000-000000000005'::uuid, 'Block Work'),
      ('a1e10000-2026-4000-8000-000000000005'::uuid, 'Brick Laying'),
      ('a1e10000-2026-4000-8000-000000000006'::uuid, 'Civil Helper'),
      ('a1e10000-2026-4000-8000-000000000006'::uuid, 'Site Support'),
      ('a1e10000-2026-4000-8000-000000000007'::uuid, 'Civil Labour'),
      ('a1e10000-2026-4000-8000-000000000007'::uuid, 'Concreting'),
      ('a1e10000-2026-4000-8000-000000000008'::uuid, 'Pipe Fitting'),
      ('a1e10000-2026-4000-8000-000000000008'::uuid, 'Isometric Drawing')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
