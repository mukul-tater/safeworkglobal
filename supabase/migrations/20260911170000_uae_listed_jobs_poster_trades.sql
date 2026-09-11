-- Poster trades for Choose a job: carpenter, HVAC, AC, fire fighting, painter,
-- scaffolder, POP/gypsum carpenter, waterproofing mason, marble/granite mason.
-- Idempotent: skips a row if that UAE title/slug/id is already live.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('ac_technician', 'AC Technician', 72),
  ('fire_fighting_technician', 'Fire Fighting Technician', 73),
  ('scaffolder', 'Scaffolder', 61),
  ('pop_gypsum_carpenter', 'POP / Gypsum Carpenter', 42),
  ('waterproofing_mason', 'Waterproofing Mason', 54),
  ('marble_granite_mason', 'Marble / Granite Mason', 55)
ON CONFLICT (code) DO NOTHING;

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
    'Attendance bonus (26 working days)' || chr(10) ||
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
        'a1e10000-2026-4000-8000-000000000015'::uuid,
        'Carpenter',
        'uae-listed-carpenter',
        'Dubai',
        'INTERMEDIATE',
        32000, 38000, '₹32,000 – ₹38,000', 12,
        'UAE contractor hiring carpenters for Dubai building and interiors work. Timber frames, doors, joinery and site carpentry experience preferred.',
        '2+ years carpentry experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Cut, fit and fix timber for frames, doors, joinery and site carpentry' || chr(10) || 'Read drawings and mark out work to line, level and plumb' || chr(10) || 'Install wooden fixtures, supports and finishing items as directed' || chr(10) || 'Use hand and power tools safely; keep a tidy work area' || chr(10) || 'Coordinate with civil, finishing and MEP teams' || chr(10) || 'Follow site HSE and working-at-height rules'
      ),
      (
        'a1e10000-2026-4000-8000-000000000016'::uuid,
        'HVAC Technician',
        'uae-listed-hvac-technician',
        'Abu Dhabi',
        'INTERMEDIATE',
        31000, 37000, '₹31,000 – ₹37,000', 8,
        'HVAC technician openings for UAE MEP packages in Abu Dhabi. AHU, FCU, package units and commissioning support preferred.',
        '2+ years HVAC experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install, test and maintain HVAC plant, AHUs, FCUs and package units' || chr(10) || 'Read HVAC drawings, duct and pipe layouts' || chr(10) || 'Charge, vacuum and leak-test refrigerant circuits as directed' || chr(10) || 'Balance airflow, check controls and close punch-list items' || chr(10) || 'Coordinate with ductmen, electricians and false-ceiling teams' || chr(10) || 'Follow LOTO, permit-to-work and UAE HSE procedures'
      ),
      (
        'a1e10000-2026-4000-8000-000000000017'::uuid,
        'AC Technician',
        'uae-listed-ac-technician',
        'Sharjah',
        'INTERMEDIATE',
        31000, 34000, '₹31,000 – ₹34,000', 10,
        'AC technician openings for UAE facilities and residential packages in Sharjah. Split, window and package unit installation and service.',
        '2+ years AC installation / service experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Install, service and repair split, window and package AC units' || chr(10) || 'Run copper piping, drain lines and indoor/outdoor connections' || chr(10) || 'Vacuum, charge and leak-test refrigerant circuits' || chr(10) || 'Diagnose cooling faults and replace filters, capacitors and fans' || chr(10) || 'Keep plant rooms and work areas clean' || chr(10) || 'Follow electrical isolation and site HSE rules'
      ),
      (
        'a1e10000-2026-4000-8000-000000000018'::uuid,
        'Fire Fighting Technician',
        'uae-listed-fire-fighting-technician',
        'Dubai',
        'INTERMEDIATE',
        31000, 37000, '₹31,000 – ₹37,000', 8,
        'Fire-fighting technician openings for UAE life-safety packages in Dubai. Hydrants, sprinklers, hose reels and fire-alarm first-fix.',
        '2+ years fire-fighting / life-safety installation experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install fire hydrants, hose reels, sprinklers and fire-alarm first-fix' || chr(10) || 'Read fire-fighting drawings and coordinate with MEP and civil teams' || chr(10) || 'Fit pipes, valves, pumps and detection devices as specified' || chr(10) || 'Assist pressure tests, flushing and commissioning' || chr(10) || 'Follow NFPA / UAE civil-defence and permit-to-work rules' || chr(10) || 'Maintain tools and report daily progress'
      ),
      (
        'a1e10000-2026-4000-8000-000000000019'::uuid,
        'Painter',
        'uae-listed-painter',
        'Abu Dhabi',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 12,
        'Painter openings for UAE interiors and structural steel in Abu Dhabi. Surface preparation, emulsion, enamel and spray work.',
        '2+ years painting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Prepare surfaces: filling, sanding, priming and masking' || chr(10) || 'Apply emulsion, enamel and texture paint to walls, ceilings and steel' || chr(10) || 'Spray or roll to an even finish as per the specification' || chr(10) || 'Protect adjacent finishes and clean up after each area' || chr(10) || 'Touch up snags before handover' || chr(10) || 'Follow site HSE including working-at-height and solvent controls'
      ),
      (
        'a1e10000-2026-4000-8000-00000000001a'::uuid,
        'Scaffolder',
        'uae-listed-scaffolder',
        'Sharjah',
        'INTERMEDIATE',
        32000, 37000, '₹32,000 – ₹37,000', 15,
        'Scaffolder openings for UAE high-rise and industrial access in Sharjah. Tube-and-coupler or system scaffold erection and dismantling.',
        '2+ years scaffolding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Erect, alter and dismantle tube-and-coupler or system scaffold' || chr(10) || 'Set base plates, standards, ledgers, braces, platforms and ties' || chr(10) || 'Install guardrails, toe boards, ladders and working platforms' || chr(10) || 'Inspect components and tag incomplete or unsafe scaffold' || chr(10) || 'Follow working-at-height, lifting and site HSE rules' || chr(10) || 'Coordinate with civil and finishing trades for access'
      ),
      (
        'a1e10000-2026-4000-8000-00000000001b'::uuid,
        'POP / Gypsum Carpenter',
        'uae-listed-pop-gypsum-carpenter',
        'Dubai',
        'INTERMEDIATE',
        32000, 38000, '₹32,000 – ₹38,000', 10,
        'POP / gypsum carpenter openings for UAE interiors in Dubai. False ceilings, partitions, bulkheads and light/AC openings.',
        '2+ years gypsum / POP false-ceiling experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Set out and install gypsum / POP false ceilings, partitions and bulkheads' || chr(10) || 'Fix channels, studs, boards and access panels to drawings' || chr(10) || 'Cut, measure and finish joints, beads and openings for lights and AC' || chr(10) || 'Coordinate with MEP first-fix before closing ceilings' || chr(10) || 'Protect finished boards and close punch-list items' || chr(10) || 'Follow working-at-height and site HSE rules'
      ),
      (
        'a1e10000-2026-4000-8000-00000000001c'::uuid,
        'Waterproofing Mason',
        'uae-listed-waterproofing-mason',
        'Sharjah',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 8,
        'Waterproofing mason openings for UAE wet areas, roofs and tanks in Sharjah. Cementitious and membrane systems preferred.',
        '2+ years waterproofing experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Prepare surfaces and apply cementitious or membrane waterproofing' || chr(10) || 'Treat wet areas, tanks, roofs, retaining walls and expansion joints' || chr(10) || 'Install fillets, corners, drains and protection layers' || chr(10) || 'Flood-test / pond-test and repair leaks as directed' || chr(10) || 'Follow manufacturer method statements and site HSE' || chr(10) || 'Keep the work area clean and protect completed work'
      ),
      (
        'a1e10000-2026-4000-8000-00000000001d'::uuid,
        'Marble / Granite Mason',
        'uae-listed-marble-granite-mason',
        'Dubai',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 8,
        'Marble and granite mason openings for UAE finishing packages in Dubai. Stone flooring, cladding, treads and counters.',
        '2+ years marble / granite fixing experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Set out and fix marble, granite and stone flooring and cladding' || chr(10) || 'Cut, drill, bed and grout stone to line, level and consistent joints' || chr(10) || 'Install skirting, treads, counters and wall cladding as specified' || chr(10) || 'Polish, protect and clean finished stonework' || chr(10) || 'Coordinate with wet-area and finishing trades' || chr(10) || 'Follow site HSE and material-handling rules'
      )
  ) AS seed(
    id, title, slug, city, experience_level,
    salary_min, salary_max, salary_display, openings,
    description, requirements, responsibilities
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
      ('a1e10000-2026-4000-8000-000000000015'::uuid, 'Carpentry'),
      ('a1e10000-2026-4000-8000-000000000015'::uuid, 'Joinery'),
      ('a1e10000-2026-4000-8000-000000000016'::uuid, 'HVAC'),
      ('a1e10000-2026-4000-8000-000000000016'::uuid, 'Air Conditioning'),
      ('a1e10000-2026-4000-8000-000000000017'::uuid, 'AC Installation'),
      ('a1e10000-2026-4000-8000-000000000017'::uuid, 'Air Conditioning'),
      ('a1e10000-2026-4000-8000-000000000018'::uuid, 'Fire Fighting'),
      ('a1e10000-2026-4000-8000-000000000018'::uuid, 'Sprinklers'),
      ('a1e10000-2026-4000-8000-000000000019'::uuid, 'Painting'),
      ('a1e10000-2026-4000-8000-000000000019'::uuid, 'Surface Preparation'),
      ('a1e10000-2026-4000-8000-00000000001a'::uuid, 'Scaffolding'),
      ('a1e10000-2026-4000-8000-00000000001a'::uuid, 'Working at Height'),
      ('a1e10000-2026-4000-8000-00000000001b'::uuid, 'Gypsum'),
      ('a1e10000-2026-4000-8000-00000000001b'::uuid, 'False Ceiling'),
      ('a1e10000-2026-4000-8000-00000000001c'::uuid, 'Waterproofing'),
      ('a1e10000-2026-4000-8000-00000000001c'::uuid, 'Membrane Work'),
      ('a1e10000-2026-4000-8000-00000000001d'::uuid, 'Marble Fixing'),
      ('a1e10000-2026-4000-8000-00000000001d'::uuid, 'Granite Fixing')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
