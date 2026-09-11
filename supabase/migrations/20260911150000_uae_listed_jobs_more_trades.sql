-- Additional UAE Find-jobs catalog trades requested for Choose a job.
-- Idempotent: skips a row if that UAE title/slug/id is already live.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('mig_welder', 'MIG Welder', 21),
  ('tig_welder', 'TIG Welder', 22),
  ('aluminium_fabricator', 'Aluminium Fabricator', 23),
  ('industrial_electrician', 'Industrial Electrician', 11),
  ('finishing_carpenter', 'Finishing Carpenter', 41),
  ('tile_mason', 'Tile Mason', 51),
  ('all_round_mason', 'All Round Mason', 52),
  ('block_plaster_mason', 'Block & Plaster Mason', 53),
  ('ductman', 'Ductman', 71),
  ('mechanical_helper', 'Mechanical Helper', 93),
  ('general_helper', 'General Helper', 94)
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
    'Flight tickets' || chr(10) ||
    'Accommodation' || chr(10) ||
    'Food - Minimum 200 and kitchen facilities' || chr(10) ||
    'Local transport' || chr(10) ||
    'Work visa and Emirates ID' || chr(10) ||
    'Legal contract and job security' || chr(10) ||
    'Airport pickup' || chr(10) ||
    '8-10 hours of duty + overtime (extra pay)' || chr(10) ||
    'Medical facility + Insurance in Dubai' || chr(10) ||
    'PBBY Insurance in India';
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
        'a1e10000-2026-4000-8000-000000000009'::uuid,
        'MIG Welder',
        'uae-listed-mig-welder',
        'Dubai',
        'INTERMEDIATE',
        35000, 39000, '₹35,000 – ₹39,000', 10,
        'UAE fabrication and construction employer hiring MIG welders for Dubai workshop and site work. Wire-feed welding on structural steel, plates and ducts preferred.',
        '2+ years MIG / MAG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Set up MIG / MAG plant, wire, gas and parameters as per WPS' || chr(10) || 'MIG-weld structural steel, plates, ducts and fabrication spools' || chr(10) || 'Fit, tack and weld joints to drawings; grind and clean between passes' || chr(10) || 'Carry out visual checks for undercut, porosity and incomplete fusion' || chr(10) || 'Use screens, fire watch and PPE for hot work' || chr(10) || 'Report defects and complete rework as directed'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000a'::uuid,
        'TIG Welder',
        'uae-listed-tig-welder',
        'Abu Dhabi',
        'INTERMEDIATE',
        35000, 39000, '₹35,000 – ₹39,000', 8,
        'UAE contractor hiring TIG welders for pipe, tank and precision fabrication in Abu Dhabi. Stainless / aluminium TIG experience preferred.',
        '2+ years TIG welding experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Set up TIG plant, tungsten, filler and argon as per WPS' || chr(10) || 'TIG-weld stainless, aluminium or carbon-steel pipe and sheet' || chr(10) || 'Run root and fill passes on pipe, tanks and precision joints' || chr(10) || 'Keep the purge and gas shield; inspect for oxidation and undercut' || chr(10) || 'Read isometric and fabrication drawings' || chr(10) || 'Follow hot-work, PPE and UAE HSE procedures'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000b'::uuid,
        'Aluminium Fabricator',
        'uae-listed-aluminium-fabricator',
        'Sharjah',
        'INTERMEDIATE',
        35000, 39000, '₹35,000 – ₹39,000', 8,
        'Aluminium fabrication openings in Sharjah, UAE. Cutting, assembling and installing aluminium windows, doors, cladding and shop-front frames.',
        '2+ years aluminium fabrication experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Read fabrication drawings and mark cutting lists for aluminium sections' || chr(10) || 'Cut, mill, drill and assemble aluminium frames, cladding and joinery' || chr(10) || 'Fit, tack and weld or mechanically join aluminium components' || chr(10) || 'Install windows, doors, curtain-wall and shop-front frames as directed' || chr(10) || 'File, grind and prepare surfaces for powder coat or anodising' || chr(10) || 'Follow workshop and site HSE, including hot-work controls'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000c'::uuid,
        'Industrial Electrician',
        'uae-listed-industrial-electrician',
        'Dubai',
        'INTERMEDIATE',
        31000, 37000, '₹31,000 – ₹37,000', 10,
        'Industrial electrician openings for UAE plant, MEP and construction packages in Dubai. MCC, motor and control-circuit experience preferred.',
        '2+ years industrial electrical experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Trade certificate preferred' || chr(10) || 'Willing to work in UAE',
        'Install, terminate and test industrial LV/MV power, motors and control circuits' || chr(10) || 'Read SLDs, control schematics and equipment GA drawings' || chr(10) || 'Wire MCCs, VFDs, field instruments and plant lighting' || chr(10) || 'Carry out fault finding on motors, starters and process equipment' || chr(10) || 'Follow LOTO, permit-to-work and plant HSE procedures' || chr(10) || 'Coordinate shutdowns, megger tests and punch-list close-out'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000d'::uuid,
        'Finishing Carpenter',
        'uae-listed-finishing-carpenter',
        'Abu Dhabi',
        'INTERMEDIATE',
        32000, 38000, '₹32,000 – ₹38,000', 12,
        'Finishing carpenter openings for UAE interiors in Abu Dhabi. Doors, frames, skirting, cabinets and joinery experience preferred.',
        '2+ years finishing / joinery carpenter experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Install doors, frames, architraves, skirting and wooden joinery' || chr(10) || 'Set cabinets, wardrobes, panelling and false-ceiling timber as per drawings' || chr(10) || 'Cut, fit and finish timber to line, level and consistent gaps' || chr(10) || 'Hang ironmongery, locks and door closers; adjust for smooth operation' || chr(10) || 'Protect finished surfaces and close snag lists before handover' || chr(10) || 'Follow site HSE and working-at-height rules'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000e'::uuid,
        'Tile Mason',
        'uae-listed-tile-mason',
        'Dubai',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 12,
        'Tile mason openings for UAE residential and commercial finishing in Dubai. Floor and wall tiling, wet-area falls and grouting experience preferred.',
        '2+ years tiling experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Set out floor and wall tiles from drawings, levels and datum lines' || chr(10) || 'Prepare substrate, mix adhesive and bed tiles to line and level' || chr(10) || 'Cut tiles around openings, edges and sanitary fittings' || chr(10) || 'Grout joints, clean tiles and complete movement joints as specified' || chr(10) || 'Fix skirting, dado and wet-area tiles to the required fall' || chr(10) || 'Keep the work area clean and follow HSE'
      ),
      (
        'a1e10000-2026-4000-8000-00000000000f'::uuid,
        'All Round Mason',
        'uae-listed-all-round-mason',
        'Sharjah',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 10,
        'All-round mason openings for UAE construction in Sharjah. Block work, plastering, tiling support and finishing as directed.',
        '2+ years masonry experience across block, plaster and finishing' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Carry out block work, plastering, tiling and finishing as directed' || chr(10) || 'Lay blocks and bricks to line, level and plumb' || chr(10) || 'Apply internal and external plaster to the specified thickness' || chr(10) || 'Support tiling, chasing, lintels and small concrete repairs' || chr(10) || 'Mix mortar to the specified ratio and maintain workmanship quality' || chr(10) || 'Follow supervisor instructions and site HSE'
      ),
      (
        'a1e10000-2026-4000-8000-000000000010'::uuid,
        'Block & Plaster Mason',
        'uae-listed-block-plaster-mason',
        'Abu Dhabi',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 14,
        'Block and plaster mason openings for UAE building works in Abu Dhabi. AAC/concrete block laying and internal/external plastering.',
        '2+ years block work and plastering experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Lay AAC / concrete blocks to line, level and plumb' || chr(10) || 'Build walls, columns, partitions and openings as marked out' || chr(10) || 'Apply scratch and finish plaster coats to walls and soffits' || chr(10) || 'Mix mortar and plaster to the specified ratio' || chr(10) || 'Install lintels, mesh and corner beads as required' || chr(10) || 'Keep joints, corners and surfaces within tolerance and follow HSE'
      ),
      (
        'a1e10000-2026-4000-8000-000000000011'::uuid,
        'Steel Fixer',
        'uae-listed-steel-fixer',
        'Dubai',
        'INTERMEDIATE',
        31000, 36000, '₹31,000 – ₹36,000', 15,
        'Steel fixer openings for UAE high-rise and infrastructure projects in Dubai. Bar bending, placing and tying to BBS experience preferred.',
        '2+ years steel fixing / rebar experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Read bar-bending schedules and rebar drawings' || chr(10) || 'Cut, bend, place and tie reinforcement for slabs, beams, columns and walls' || chr(10) || 'Maintain cover, laps, chairs and spacers as specified' || chr(10) || 'Fix starter bars, couplers and extra steel at openings' || chr(10) || 'Coordinate pour sequence with shuttering and civil teams' || chr(10) || 'Follow working-at-height, lifting and site HSE rules'
      ),
      (
        'a1e10000-2026-4000-8000-000000000012'::uuid,
        'Ductman',
        'uae-listed-ductman',
        'Sharjah',
        'INTERMEDIATE',
        31000, 34000, '₹31,000 – ₹34,000', 10,
        'Ductman openings for UAE HVAC packages in Sharjah. GI/PI duct fabrication, hanging, insulation and damper installation.',
        '2+ years HVAC ducting experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Fabricate, hang and connect GI / PI / flexible ducts as per drawings' || chr(10) || 'Install hangers, supports, fire dampers and volume control dampers' || chr(10) || 'Seal joints, insulate ducts and close openings after first-fix' || chr(10) || 'Assist balancing, leak tests and punch-list close-out' || chr(10) || 'Read HVAC layouts and coordinate with electrical and false-ceiling teams' || chr(10) || 'Follow working-at-height and site HSE rules'
      ),
      (
        'a1e10000-2026-4000-8000-000000000013'::uuid,
        'Mechanical Helper',
        'uae-listed-mechanical-helper',
        'Dubai',
        'ENTRY',
        27000, 28000, '₹27,000 – ₹28,000', 20,
        'Mechanical helper openings supporting pipe fitters, welders and HVAC crews on Dubai projects.',
        'Site experience preferred' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Assist pipe fitters, welders, HVAC and mechanical crews' || chr(10) || 'Shift pipes, ducts, fittings, tools and gas cylinders as directed' || chr(10) || 'Help with grinding, tacking, insulation and housekeeping' || chr(10) || 'Support hydrotest, hot-work and equipment positioning' || chr(10) || 'Follow supervisor instructions and permit-to-work rules' || chr(10) || 'Wear PPE at all times on site'
      ),
      (
        'a1e10000-2026-4000-8000-000000000014'::uuid,
        'General Helper',
        'uae-listed-general-helper',
        'Abu Dhabi',
        'ENTRY',
        27000, 27000, '₹27,000', 25,
        'General helper openings for UAE construction sites in Abu Dhabi. Material handling, housekeeping and support to skilled trades.',
        'Physically fit for site work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Support skilled trades with materials, tools and housekeeping' || chr(10) || 'Load, unload and shift materials around the site' || chr(10) || 'Mix mortar or concrete and keep access routes clear' || chr(10) || 'Help with simple site tasks as directed by the supervisor' || chr(10) || 'Follow site safety rules and permit-to-work instructions' || chr(10) || 'Wear PPE at all times on site'
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
      ('a1e10000-2026-4000-8000-000000000009'::uuid, 'MIG Welding'),
      ('a1e10000-2026-4000-8000-000000000009'::uuid, 'Fabrication'),
      ('a1e10000-2026-4000-8000-00000000000a'::uuid, 'TIG Welding'),
      ('a1e10000-2026-4000-8000-00000000000a'::uuid, 'Pipe Welding'),
      ('a1e10000-2026-4000-8000-00000000000b'::uuid, 'Aluminium Fabrication'),
      ('a1e10000-2026-4000-8000-00000000000b'::uuid, 'Joinery'),
      ('a1e10000-2026-4000-8000-00000000000c'::uuid, 'Industrial Electrical'),
      ('a1e10000-2026-4000-8000-00000000000c'::uuid, 'Fault Finding'),
      ('a1e10000-2026-4000-8000-00000000000d'::uuid, 'Finishing Carpentry'),
      ('a1e10000-2026-4000-8000-00000000000d'::uuid, 'Joinery'),
      ('a1e10000-2026-4000-8000-00000000000e'::uuid, 'Tiling'),
      ('a1e10000-2026-4000-8000-00000000000e'::uuid, 'Floor & Wall Tile'),
      ('a1e10000-2026-4000-8000-00000000000f'::uuid, 'Block Work'),
      ('a1e10000-2026-4000-8000-00000000000f'::uuid, 'Plastering'),
      ('a1e10000-2026-4000-8000-000000000010'::uuid, 'Block Work'),
      ('a1e10000-2026-4000-8000-000000000010'::uuid, 'Plastering'),
      ('a1e10000-2026-4000-8000-000000000011'::uuid, 'Steel Fixing'),
      ('a1e10000-2026-4000-8000-000000000011'::uuid, 'Bar Bending'),
      ('a1e10000-2026-4000-8000-000000000012'::uuid, 'HVAC Ducting'),
      ('a1e10000-2026-4000-8000-000000000012'::uuid, 'Duct Installation'),
      ('a1e10000-2026-4000-8000-000000000013'::uuid, 'Mechanical Helper'),
      ('a1e10000-2026-4000-8000-000000000013'::uuid, 'Site Support'),
      ('a1e10000-2026-4000-8000-000000000014'::uuid, 'General Helper'),
      ('a1e10000-2026-4000-8000-000000000014'::uuid, 'Site Support')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
