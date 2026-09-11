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
  v_benefits text :=
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
        'a1e10000-2026-4000-8000-000000000001'::uuid,
        'Electrician',
        'uae-listed-electrician',
        'Dubai',
        'INTERMEDIATE',
        41000, 58000, '₹41,000 – ₹58,000', 12,
        'UAE construction and facilities employer hiring electricians for ongoing Dubai projects. Indian workers with site wiring, DB/MCB and fault-finding experience preferred. Visa sponsorship, accommodation and medical insurance for shortlisted candidates.',
        '2+ years electrical site experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Read electrical drawings, single-line diagrams and site layouts' || chr(10) || 'Install, terminate and test LV wiring, DBs, MCB/RCCB and lighting circuits' || chr(10) || 'Carry out fault finding on power, lighting and equipment circuits' || chr(10) || 'Follow LOTO, permit-to-work and UAE HSE procedures' || chr(10) || 'Coordinate first-fix and second-fix with civil and finishing teams' || chr(10) || 'Maintain tools, report daily progress and raise material requests',
        'Monthly salary AED 1,800 – 2,500' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000002'::uuid,
        'Plumber',
        'uae-listed-plumber',
        'Abu Dhabi',
        'INTERMEDIATE',
        37000, 51000, '₹37,000 – ₹51,000', 10,
        'UAE contractor hiring plumbers for residential and commercial projects in Abu Dhabi. PVC/CPVC/GI installation and leak testing experience preferred.',
        '2+ years plumbing experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install PVC, CPVC, PPR and GI pipes for water supply and drainage' || chr(10) || 'Fit sanitary ware, taps, floor traps and bathroom accessories' || chr(10) || 'Pressure-test supply lines and leak-test drainage stacks' || chr(10) || 'Chase walls, set levels and connect to existing risers as per drawings' || chr(10) || 'Clear blockages and close punch-list items before handover' || chr(10) || 'Follow plumbing drawings and site HSE rules',
        'Monthly salary AED 1,600 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000003'::uuid,
        'Welder',
        'uae-listed-welder',
        'Sharjah',
        'INTERMEDIATE',
        41000, 64000, '₹41,000 – ₹64,000', 8,
        'Structural and fabrication welding openings in Sharjah, UAE. ARC/MIG/TIG welders with site or workshop experience preferred.',
        '2+ years welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Perform ARC, MIG and/or TIG welding as per WPS and drawings' || chr(10) || 'Fit, tack and weld structural steel, plates, pipes or supports' || chr(10) || 'Grind, clean and prepare joints; carry out visual quality checks' || chr(10) || 'Read fabrication drawings and mark cutting lists' || chr(10) || 'Use PPE, screens and fire watch for hot work' || chr(10) || 'Report defects and complete rework as directed',
        'Monthly salary AED 1,800 – 2,800' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000004'::uuid,
        'Shuttering Carpenter',
        'uae-listed-shuttering-carpenter',
        'Dubai',
        'INTERMEDIATE',
        35000, 51000, '₹35,000 – ₹51,000', 15,
        'Formwork / shuttering carpenter openings for UAE high-rise and infrastructure projects in Dubai. Formwork erection, alignment and striking experience preferred.',
        '2+ years shuttering / formwork experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Erect, align and strike timber, plywood or system formwork' || chr(10) || 'Set shuttering to line, level and plumb from drawings' || chr(10) || 'Install props, walers, ties and working platforms safely' || chr(10) || 'Coordinate pour sequence with civil and steel-fixer teams' || chr(10) || 'Dismantle formwork without damaging concrete' || chr(10) || 'Follow working-at-height and site HSE rules',
        'Monthly salary AED 1,500 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000005'::uuid,
        'Mason',
        'uae-listed-mason',
        'Abu Dhabi',
        'INTERMEDIATE',
        35000, 51000, '₹35,000 – ₹51,000', 12,
        'Block and brick mason openings for UAE construction sites in Abu Dhabi. Block work, plastering support and mortar mixing experience preferred.',
        '2+ years masonry experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Lay blocks and bricks to line, level and plumb' || chr(10) || 'Mix mortar to the specified ratio and finish joints' || chr(10) || 'Build walls, columns, partitions and openings as marked out' || chr(10) || 'Support plastering, chasing and lintel installation' || chr(10) || 'Maintain workmanship quality against setting-out marks' || chr(10) || 'Keep the work area clean and follow HSE',
        'Monthly salary AED 1,500 – 2,200' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000006'::uuid,
        'Civil Helper',
        'uae-listed-civil-helper',
        'Dubai',
        'ENTRY',
        28000, 37000, '₹28,000 – ₹37,000', 25,
        'Civil helper openings supporting masons, carpenters and site gangs on Dubai projects. Site material handling and general civil support.',
        'Site experience preferred' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Assist masons, carpenters, steel fixers and other skilled trades' || chr(10) || 'Shift blocks, cement, tools and materials as directed' || chr(10) || 'Mix mortar or concrete and keep the work area tidy' || chr(10) || 'Help with shuttering, curing and simple site tasks' || chr(10) || 'Follow supervisor instructions and site safety rules' || chr(10) || 'Wear PPE at all times on site',
        'Monthly salary AED 1,200 – 1,600' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000007'::uuid,
        'Civil Labour',
        'uae-listed-civil-labour',
        'Sharjah',
        'ENTRY',
        25000, 35000, '₹25,000 – ₹35,000', 30,
        'Civil labour openings for general construction work in Sharjah, UAE. Concreting support, excavation support and site cleaning.',
        'Physically fit for site work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Carry out general civil labour as directed by the supervisor' || chr(10) || 'Support concreting, excavation, backfilling and curing' || chr(10) || 'Load, unload and shift materials around the site' || chr(10) || 'Clear debris, keep access routes open and wet-cure slabs' || chr(10) || 'Assist skilled trades with tools and housekeeping' || chr(10) || 'Follow HSE and permit-to-work instructions',
        'Monthly salary AED 1,100 – 1,500' || chr(10) || 'Free accommodation' || chr(10) || 'Medical insurance' || chr(10) || 'Annual leave ticket'
      ),
      (
        'a1e10000-2026-4000-8000-000000000008'::uuid,
        'Pipe Fitter',
        'uae-listed-pipe-fitter',
        'Dubai',
        'INTERMEDIATE',
        41000, 58000, '₹41,000 – ₹58,000', 8,
        'Pipe fitter openings for UAE mechanical and plumbing packages in Dubai. Isometric reading, flange fitting and pipe routing experience preferred.',
        '2+ years pipe fitting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Read isometrics and piping drawings for routing and supports' || chr(10) || 'Cut, bevel, fit and align CS/GI/SS pipes and fittings' || chr(10) || 'Install flanges, gaskets, valves and pipe supports' || chr(10) || 'Assist hydrotest / leak test and punch-list close-out' || chr(10) || 'Coordinate with welders and riggers for spool installation' || chr(10) || 'Follow HSE, hot-work and quality procedures',
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
