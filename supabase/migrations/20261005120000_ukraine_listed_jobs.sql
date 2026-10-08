-- Ukraine Find-jobs catalog. One row per vacancy, same shape as the UAE listings.
-- UAE trade templates do not apply: country is Ukraine, and the public site
-- only rewrites title, pay and duties for UAE jobs.

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

  UPDATE public.jobs AS j
  SET
    status = 'ACTIVE',
    title = seed.title,
    description = seed.description,
    requirements = seed.requirements,
    responsibilities = seed.responsibilities,
    benefits = seed.benefits,
    location = seed.location,
    country = 'Ukraine',
    job_type = 'FULL_TIME',
    experience_level = seed.experience_level,
    salary_min = seed.salary_min,
    salary_max = seed.salary_max,
    currency = 'USD',
    salary_display = seed.salary_display,
    openings = 1,
    visa_sponsorship = false,
    remote_allowed = false,
    service_charge = 200000,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  FROM (
    VALUES
      (
        'a1e10000-2026-4000-8000-000000000031'::uuid,
        'ukraine-listed-dairy-plant-operator',
        'Dairy Plant – Loader / Packaging Machine Operator / Dairy Line Operator',
        'Rivne Region',
        'ENTRY',
        550, 550, 'USD 550/month',
        'Workers are required at a dairy plant in the Rivne Region for loading, packaging machine operation, and dairy production line operations. Training is provided at the enterprise, so the vacancy is suitable for candidates without previous experience. Night shifts are included in the salary. There is no overtime work.',
        'Physically fit and able to perform manual work' || chr(10) ||
        'Good stamina and discipline' || chr(10) ||
        'Able to work in shifts' || chr(10) ||
        'No bad habits' || chr(10) ||
        'Age 20–45 years' || chr(10) ||
        'Male candidates' || chr(10) ||
        'No experience required; training provided',
        'Load and stack goods on pallets' || chr(10) ||
        'Move finished products in the warehouse' || chr(10) ||
        'Operate packaging machines' || chr(10) ||
        'Monitor packaging parameters' || chr(10) ||
        'Operate valves and switches for milk supply' || chr(10) ||
        'Monitor temperature and steam pressure',
        'Training provided by the employer' || chr(10) ||
        'Workwear provided' || chr(10) ||
        'Monthly salary and advance payment' || chr(10) ||
        'Productivity and discipline bonuses may be available' || chr(10) ||
        'No overtime work'
      ),
      (
        'a1e10000-2026-4000-8000-000000000032'::uuid,
        'ukraine-listed-production-line-operator',
        'Production Line Operator',
        'Cherkasy',
        'ENTRY',
        600, 600, 'USD 600/month',
        'Production line operator in Cherkasy at a plant making corrugated metal sheets, metal roof tiles, fences and enclosures. Candidates without previous experience can be trained from scratch. Pay is USD 600 per month, with the chance to earn more.',
        'Physical stamina' || chr(10) ||
        'Attention to detail' || chr(10) ||
        'Responsibility' || chr(10) ||
        'Willingness to learn' || chr(10) ||
        'Able to work on your feet' || chr(10) ||
        'Age 25–37 years' || chr(10) ||
        'Training provided',
        'Operate an overhead crane with a handheld remote' || chr(10) ||
        'Move metal rolls onto the production line' || chr(10) ||
        'Cut metal according to size, colour and length' || chr(10) ||
        'Follow technical specifications' || chr(10) ||
        'Inspect finished parts for quality and required standards',
        'Full training from scratch' || chr(10) ||
        'Meals provided' || chr(10) ||
        'Accommodation provided' || chr(10) ||
        'City commuting expenses compensated' || chr(10) ||
        'Locker room, showers and dining area available'
      ),
      (
        'a1e10000-2026-4000-8000-000000000033'::uuid,
        'ukraine-listed-toolmaker',
        'Toolmaker',
        'Kyiv Region',
        'INTERMEDIATE',
        800, 900, 'USD 800–900/month',
        'The toolmaker manufactures, repairs and maintains tooling used for cold stamping of sheet-metal components in the Kyiv Region. Toolmaking experience of at least one year is preferred.',
        'Toolmaking experience preferred, 1+ year' || chr(10) ||
        'Knowledge of grinding machines' || chr(10) ||
        'Able to read blueprints and technical documentation' || chr(10) ||
        'Fitting and measuring skills' || chr(10) ||
        'Knowledge of tolerances and technical measurements' || chr(10) ||
        'Accuracy and attention to detail' || chr(10) ||
        'Able to work independently and in a team',
        'Manufacture and repair dies, moulds and jigs' || chr(10) ||
        'Fit, assemble and adjust mechanisms' || chr(10) ||
        'Quality control' || chr(10) ||
        'Technical maintenance of tools and equipment',
        'Free accommodation' || chr(10) ||
        'Special work clothing provided' || chr(10) ||
        '5-day working week'
      ),
      (
        'a1e10000-2026-4000-8000-000000000034'::uuid,
        'ukraine-listed-general-production-laborer',
        'General Production Laborer',
        'Kyiv Region',
        'ENTRY',
        700, 750, 'USD 700–750/month',
        'General production support in the Kyiv Region for candidates who are ready for physical work. Previous production or warehouse experience is an advantage and is not mandatory.',
        'Physically fit and ready for physical labour' || chr(10) ||
        'Responsible, disciplined and attentive' || chr(10) ||
        'Production or warehouse experience is an advantage, not mandatory',
        'Assist foremen and production specialists' || chr(10) ||
        'Move materials, workpieces and finished products' || chr(10) ||
        'Perform auxiliary production work' || chr(10) ||
        'Maintain cleanliness and order',
        'Free accommodation' || chr(10) ||
        'Special work clothing provided' || chr(10) ||
        '5-day working week'
      ),
      (
        'a1e10000-2026-4000-8000-000000000035'::uuid,
        'ukraine-listed-poultry-processing-worker',
        'Poultry Processing Plant Worker',
        'Ukraine',
        'ENTRY',
        500, 700, 'USD 500–700/month',
        'Active work in a poultry processing plant on production lines, handling, processing support and workplace maintenance. Training is provided. The vacancy average is about USD 600–650 per month without overtime. A city was not specified.',
        'Good physical condition and high stamina' || chr(10) ||
        'Able to do physical work in a fast-paced production environment' || chr(10) ||
        'Male candidates' || chr(10) ||
        'Preferred age up to 40 years' || chr(10) ||
        'Minimum height 160 cm' || chr(10) ||
        'Training provided',
        'Work on the production line' || chr(10) ||
        'Hang poultry on the processing line' || chr(10) ||
        'Load and unload' || chr(10) ||
        'Handle loads up to 20–24 kg' || chr(10) ||
        'Follow production standards' || chr(10) ||
        'Follow hygiene and safety rules' || chr(10) ||
        'Keep the workplace clean',
        'Free accommodation' || chr(10) ||
        'Free transportation' || chr(10) ||
        'Free lunch during the shift' || chr(10) ||
        'Work clothes provided' || chr(10) ||
        'Free medical examination' || chr(10) ||
        'Free tetanus vaccination' || chr(10) ||
        'Free laundry' || chr(10) ||
        'Monthly bonus of 6 kg poultry meat and 60 eggs' || chr(10) ||
        'Coordinator support'
      ),
      (
        'a1e10000-2026-4000-8000-000000000036'::uuid,
        'ukraine-listed-egg-processing-operator',
        'Production Line Operator – Egg Processing',
        'Makariv',
        'ENTRY',
        700, 1000, 'USD 700–1,000/month',
        'Food-production role in an egg-processing factory in Makariv. The work is simple and stable, and previous experience is not required.',
        'Good physical health' || chr(10) ||
        'Responsibility and discipline' || chr(10) ||
        'Able to follow instructions' || chr(10) ||
        'Willingness to work' || chr(10) ||
        'Able to stand for most of the shift' || chr(10) ||
        'No previous experience required',
        'Break eggs and prepare raw materials' || chr(10) ||
        'Operate and monitor production machines' || chr(10) ||
        'Control the production process' || chr(10) ||
        'Clean equipment after shifts' || chr(10) ||
        'Follow hygiene and safety procedures',
        'Accommodation provided' || chr(10) ||
        'Work uniform provided' || chr(10) ||
        'Regular salary payments' || chr(10) ||
        'Adaptation support' || chr(10) ||
        'Flexible schedule possible for teams'
      ),
      (
        'a1e10000-2026-4000-8000-000000000037'::uuid,
        'ukraine-listed-food-production-loader',
        'Loader – Food Production',
        'Makariv, Kyiv Oblast',
        'ENTRY',
        700, 1000, 'USD 700–1,000/month',
        'The loader supports food-production operations in Makariv by handling products and materials in the warehouse and production area. No previous experience is required.',
        'Good physical condition' || chr(10) ||
        'Responsibility and discipline' || chr(10) ||
        'Ready for physical labour' || chr(10) ||
        'Willingness to work' || chr(10) ||
        'No experience required',
        'Load and unload products' || chr(10) ||
        'Move materials within the warehouse and production areas' || chr(10) ||
        'Maintain workplace order' || chr(10) ||
        'Complete tasks assigned by the shift supervisor',
        'Accommodation in the company dormitory' || chr(10) ||
        'Workwear provided' || chr(10) ||
        'Regular working schedule'
      ),
      (
        'a1e10000-2026-4000-8000-000000000038'::uuid,
        'ukraine-listed-drying-operator',
        'Drying Operator – Egg Processing',
        'Makariv, Kyiv Oblast',
        'ENTRY',
        700, 1000, 'USD 700–1,000/month',
        'Drying operator in an egg-processing food plant in Makariv. The role is easy to learn and does not require previous experience. Pay is USD 700–1,000 per month depending on output.',
        'Responsibility and attentiveness' || chr(10) ||
        'Able to follow instructions' || chr(10) ||
        'Physical stamina' || chr(10) ||
        'Willingness to learn' || chr(10) ||
        'Basic production knowledge is an advantage' || chr(10) ||
        'No experience required',
        'Operate drying machines' || chr(10) ||
        'Control temperature and formulation' || chr(10) ||
        'Complete shift reports' || chr(10) ||
        'Clean equipment after shifts' || chr(10) ||
        'Follow production and sanitary standards',
        'Accommodation provided' || chr(10) ||
        'Workwear provided' || chr(10) ||
        'Regular salary' || chr(10) ||
        'Adaptation support' || chr(10) ||
        'Long-term employment opportunities'
      ),
      (
        'a1e10000-2026-4000-8000-000000000039'::uuid,
        'ukraine-listed-mechanical-assembler',
        'Mechanical Assembler / Fitter',
        'Khmelnytskyi Region',
        'INTERMEDIATE',
        600, 800, 'USD 600–800/month',
        'The mechanical assembler works for a Ukrainian manufacturer of heavy-duty transport trailers in the Khmelnytskyi Region, assembling metal structures and preparing components for welding. Fitter or assembler experience is preferred.',
        'Fitter or assembler experience preferred' || chr(10) ||
        'Physically fit' || chr(10) ||
        'Attention to detail' || chr(10) ||
        'Able to work with metal structures' || chr(10) ||
        'Reading technical drawings is an advantage' || chr(10) ||
        'Motivated for long-term employment' || chr(10) ||
        'Men aged 20–50',
        'Assemble metal structures from pre-cut materials' || chr(10) ||
        'Prepare joints for welding' || chr(10) ||
        'Clean and grind with angle grinders' || chr(10) ||
        'Work with welders' || chr(10) ||
        'Follow technical drawings',
        'Free accommodation' || chr(10) ||
        'Toilet, shower, kitchen and washing machine available' || chr(10) ||
        'Workwear provided' || chr(10) ||
        'Footwear provided' || chr(10) ||
        'PPE provided free of charge'
      ),
      (
        'a1e10000-2026-4000-8000-00000000003a'::uuid,
        'ukraine-listed-mig-mag-welder',
        'Semi-Automatic Welder – MIG/MAG',
        'Khmelnytskyi Region',
        'INTERMEDIATE',
        700, 1100, 'USD 700–1,100/month',
        'Semi-automatic welder in the Khmelnytskyi Region at a plant producing special lowbed trailers for oversized machinery and equipment. Pay is USD 700–1,100 per month depending on experience and output. MIG/MAG experience is preferred.',
        'MIG/MAG welding experience preferred' || chr(10) ||
        'Physically fit and responsible' || chr(10) ||
        'Motivated for long-term work' || chr(10) ||
        'Able to read technical drawings, mandatory' || chr(10) ||
        'Men aged 20–50',
        'Weld metal structures using MIG/MAG' || chr(10) ||
        'Perform tack welding' || chr(10) ||
        'Complete full seam welding' || chr(10) ||
        'Work with a fitter' || chr(10) ||
        'Follow technical drawings',
        'Free accommodation' || chr(10) ||
        'Toilet, shower, kitchen and washing machine available' || chr(10) ||
        'Workwear provided' || chr(10) ||
        'PPE provided free of charge'
      )
  ) AS seed(
    id, slug, title, location, experience_level,
    salary_min, salary_max, salary_display,
    description, requirements, responsibilities, benefits
  )
  WHERE j.id = seed.id OR j.slug = seed.slug;

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping insert of Ukraine listed jobs: no employer or admin user found';
  ELSE
    INSERT INTO public.jobs (
      id, employer_id, created_by, posted_by_role,
      title, description, requirements, responsibilities, benefits,
      location, country, job_type, experience_level,
      salary_min, salary_max, currency, salary_display,
      openings, visa_sponsorship, remote_allowed, status,
      posted_at, expires_at, slug, service_charge
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
      seed.location,
      'Ukraine',
      'FULL_TIME',
      seed.experience_level,
      seed.salary_min,
      seed.salary_max,
      'USD',
      seed.salary_display,
      1,
      false,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      seed.slug,
      200000
    FROM (
      VALUES
        (
          'a1e10000-2026-4000-8000-000000000031'::uuid,
          'ukraine-listed-dairy-plant-operator',
          'Dairy Plant – Loader / Packaging Machine Operator / Dairy Line Operator',
          'Rivne Region',
          'ENTRY',
          550, 550, 'USD 550/month',
          'Workers are required at a dairy plant in the Rivne Region for loading, packaging machine operation, and dairy production line operations. Training is provided at the enterprise, so the vacancy is suitable for candidates without previous experience. Night shifts are included in the salary. There is no overtime work.',
          'Physically fit and able to perform manual work' || chr(10) ||
          'Good stamina and discipline' || chr(10) ||
          'Able to work in shifts' || chr(10) ||
          'No bad habits' || chr(10) ||
          'Age 20–45 years' || chr(10) ||
          'Male candidates' || chr(10) ||
          'No experience required; training provided',
          'Load and stack goods on pallets' || chr(10) ||
          'Move finished products in the warehouse' || chr(10) ||
          'Operate packaging machines' || chr(10) ||
          'Monitor packaging parameters' || chr(10) ||
          'Operate valves and switches for milk supply' || chr(10) ||
          'Monitor temperature and steam pressure',
          'Training provided by the employer' || chr(10) ||
          'Workwear provided' || chr(10) ||
          'Monthly salary and advance payment' || chr(10) ||
          'Productivity and discipline bonuses may be available' || chr(10) ||
          'No overtime work'
        ),
        (
          'a1e10000-2026-4000-8000-000000000032'::uuid,
          'ukraine-listed-production-line-operator',
          'Production Line Operator',
          'Cherkasy',
          'ENTRY',
          600, 600, 'USD 600/month',
          'Production line operator in Cherkasy at a plant making corrugated metal sheets, metal roof tiles, fences and enclosures. Candidates without previous experience can be trained from scratch. Pay is USD 600 per month, with the chance to earn more.',
          'Physical stamina' || chr(10) ||
          'Attention to detail' || chr(10) ||
          'Responsibility' || chr(10) ||
          'Willingness to learn' || chr(10) ||
          'Able to work on your feet' || chr(10) ||
          'Age 25–37 years' || chr(10) ||
          'Training provided',
          'Operate an overhead crane with a handheld remote' || chr(10) ||
          'Move metal rolls onto the production line' || chr(10) ||
          'Cut metal according to size, colour and length' || chr(10) ||
          'Follow technical specifications' || chr(10) ||
          'Inspect finished parts for quality and required standards',
          'Full training from scratch' || chr(10) ||
          'Meals provided' || chr(10) ||
          'Accommodation provided' || chr(10) ||
          'City commuting expenses compensated' || chr(10) ||
          'Locker room, showers and dining area available'
        ),
        (
          'a1e10000-2026-4000-8000-000000000033'::uuid,
          'ukraine-listed-toolmaker',
          'Toolmaker',
          'Kyiv Region',
          'INTERMEDIATE',
          800, 900, 'USD 800–900/month',
          'The toolmaker manufactures, repairs and maintains tooling used for cold stamping of sheet-metal components in the Kyiv Region. Toolmaking experience of at least one year is preferred.',
          'Toolmaking experience preferred, 1+ year' || chr(10) ||
          'Knowledge of grinding machines' || chr(10) ||
          'Able to read blueprints and technical documentation' || chr(10) ||
          'Fitting and measuring skills' || chr(10) ||
          'Knowledge of tolerances and technical measurements' || chr(10) ||
          'Accuracy and attention to detail' || chr(10) ||
          'Able to work independently and in a team',
          'Manufacture and repair dies, moulds and jigs' || chr(10) ||
          'Fit, assemble and adjust mechanisms' || chr(10) ||
          'Quality control' || chr(10) ||
          'Technical maintenance of tools and equipment',
          'Free accommodation' || chr(10) ||
          'Special work clothing provided' || chr(10) ||
          '5-day working week'
        ),
        (
          'a1e10000-2026-4000-8000-000000000034'::uuid,
          'ukraine-listed-general-production-laborer',
          'General Production Laborer',
          'Kyiv Region',
          'ENTRY',
          700, 750, 'USD 700–750/month',
          'General production support in the Kyiv Region for candidates who are ready for physical work. Previous production or warehouse experience is an advantage and is not mandatory.',
          'Physically fit and ready for physical labour' || chr(10) ||
          'Responsible, disciplined and attentive' || chr(10) ||
          'Production or warehouse experience is an advantage, not mandatory',
          'Assist foremen and production specialists' || chr(10) ||
          'Move materials, workpieces and finished products' || chr(10) ||
          'Perform auxiliary production work' || chr(10) ||
          'Maintain cleanliness and order',
          'Free accommodation' || chr(10) ||
          'Special work clothing provided' || chr(10) ||
          '5-day working week'
        ),
        (
          'a1e10000-2026-4000-8000-000000000035'::uuid,
          'ukraine-listed-poultry-processing-worker',
          'Poultry Processing Plant Worker',
          'Ukraine',
          'ENTRY',
          500, 700, 'USD 500–700/month',
          'Active work in a poultry processing plant on production lines, handling, processing support and workplace maintenance. Training is provided. The vacancy average is about USD 600–650 per month without overtime. A city was not specified.',
          'Good physical condition and high stamina' || chr(10) ||
          'Able to do physical work in a fast-paced production environment' || chr(10) ||
          'Male candidates' || chr(10) ||
          'Preferred age up to 40 years' || chr(10) ||
          'Minimum height 160 cm' || chr(10) ||
          'Training provided',
          'Work on the production line' || chr(10) ||
          'Hang poultry on the processing line' || chr(10) ||
          'Load and unload' || chr(10) ||
          'Handle loads up to 20–24 kg' || chr(10) ||
          'Follow production standards' || chr(10) ||
          'Follow hygiene and safety rules' || chr(10) ||
          'Keep the workplace clean',
          'Free accommodation' || chr(10) ||
          'Free transportation' || chr(10) ||
          'Free lunch during the shift' || chr(10) ||
          'Work clothes provided' || chr(10) ||
          'Free medical examination' || chr(10) ||
          'Free tetanus vaccination' || chr(10) ||
          'Free laundry' || chr(10) ||
          'Monthly bonus of 6 kg poultry meat and 60 eggs' || chr(10) ||
          'Coordinator support'
        ),
        (
          'a1e10000-2026-4000-8000-000000000036'::uuid,
          'ukraine-listed-egg-processing-operator',
          'Production Line Operator – Egg Processing',
          'Makariv',
          'ENTRY',
          700, 1000, 'USD 700–1,000/month',
          'Food-production role in an egg-processing factory in Makariv. The work is simple and stable, and previous experience is not required.',
          'Good physical health' || chr(10) ||
          'Responsibility and discipline' || chr(10) ||
          'Able to follow instructions' || chr(10) ||
          'Willingness to work' || chr(10) ||
          'Able to stand for most of the shift' || chr(10) ||
          'No previous experience required',
          'Break eggs and prepare raw materials' || chr(10) ||
          'Operate and monitor production machines' || chr(10) ||
          'Control the production process' || chr(10) ||
          'Clean equipment after shifts' || chr(10) ||
          'Follow hygiene and safety procedures',
          'Accommodation provided' || chr(10) ||
          'Work uniform provided' || chr(10) ||
          'Regular salary payments' || chr(10) ||
          'Adaptation support' || chr(10) ||
          'Flexible schedule possible for teams'
        ),
        (
          'a1e10000-2026-4000-8000-000000000037'::uuid,
          'ukraine-listed-food-production-loader',
          'Loader – Food Production',
          'Makariv, Kyiv Oblast',
          'ENTRY',
          700, 1000, 'USD 700–1,000/month',
          'The loader supports food-production operations in Makariv by handling products and materials in the warehouse and production area. No previous experience is required.',
          'Good physical condition' || chr(10) ||
          'Responsibility and discipline' || chr(10) ||
          'Ready for physical labour' || chr(10) ||
          'Willingness to work' || chr(10) ||
          'No experience required',
          'Load and unload products' || chr(10) ||
          'Move materials within the warehouse and production areas' || chr(10) ||
          'Maintain workplace order' || chr(10) ||
          'Complete tasks assigned by the shift supervisor',
          'Accommodation in the company dormitory' || chr(10) ||
          'Workwear provided' || chr(10) ||
          'Regular working schedule'
        ),
        (
          'a1e10000-2026-4000-8000-000000000038'::uuid,
          'ukraine-listed-drying-operator',
          'Drying Operator – Egg Processing',
          'Makariv, Kyiv Oblast',
          'ENTRY',
          700, 1000, 'USD 700–1,000/month',
          'Drying operator in an egg-processing food plant in Makariv. The role is easy to learn and does not require previous experience. Pay is USD 700–1,000 per month depending on output.',
          'Responsibility and attentiveness' || chr(10) ||
          'Able to follow instructions' || chr(10) ||
          'Physical stamina' || chr(10) ||
          'Willingness to learn' || chr(10) ||
          'Basic production knowledge is an advantage' || chr(10) ||
          'No experience required',
          'Operate drying machines' || chr(10) ||
          'Control temperature and formulation' || chr(10) ||
          'Complete shift reports' || chr(10) ||
          'Clean equipment after shifts' || chr(10) ||
          'Follow production and sanitary standards',
          'Accommodation provided' || chr(10) ||
          'Workwear provided' || chr(10) ||
          'Regular salary' || chr(10) ||
          'Adaptation support' || chr(10) ||
          'Long-term employment opportunities'
        ),
        (
          'a1e10000-2026-4000-8000-000000000039'::uuid,
          'ukraine-listed-mechanical-assembler',
          'Mechanical Assembler / Fitter',
          'Khmelnytskyi Region',
          'INTERMEDIATE',
          600, 800, 'USD 600–800/month',
          'The mechanical assembler works for a Ukrainian manufacturer of heavy-duty transport trailers in the Khmelnytskyi Region, assembling metal structures and preparing components for welding. Fitter or assembler experience is preferred.',
          'Fitter or assembler experience preferred' || chr(10) ||
          'Physically fit' || chr(10) ||
          'Attention to detail' || chr(10) ||
          'Able to work with metal structures' || chr(10) ||
          'Reading technical drawings is an advantage' || chr(10) ||
          'Motivated for long-term employment' || chr(10) ||
          'Men aged 20–50',
          'Assemble metal structures from pre-cut materials' || chr(10) ||
          'Prepare joints for welding' || chr(10) ||
          'Clean and grind with angle grinders' || chr(10) ||
          'Work with welders' || chr(10) ||
          'Follow technical drawings',
          'Free accommodation' || chr(10) ||
          'Toilet, shower, kitchen and washing machine available' || chr(10) ||
          'Workwear provided' || chr(10) ||
          'Footwear provided' || chr(10) ||
          'PPE provided free of charge'
        ),
        (
          'a1e10000-2026-4000-8000-00000000003a'::uuid,
          'ukraine-listed-mig-mag-welder',
          'Semi-Automatic Welder – MIG/MAG',
          'Khmelnytskyi Region',
          'INTERMEDIATE',
          700, 1100, 'USD 700–1,100/month',
          'Semi-automatic welder in the Khmelnytskyi Region at a plant producing special lowbed trailers for oversized machinery and equipment. Pay is USD 700–1,100 per month depending on experience and output. MIG/MAG experience is preferred.',
          'MIG/MAG welding experience preferred' || chr(10) ||
          'Physically fit and responsible' || chr(10) ||
          'Motivated for long-term work' || chr(10) ||
          'Able to read technical drawings, mandatory' || chr(10) ||
          'Men aged 20–50',
          'Weld metal structures using MIG/MAG' || chr(10) ||
          'Perform tack welding' || chr(10) ||
          'Complete full seam welding' || chr(10) ||
          'Work with a fitter' || chr(10) ||
          'Follow technical drawings',
          'Free accommodation' || chr(10) ||
          'Toilet, shower, kitchen and washing machine available' || chr(10) ||
          'Workwear provided' || chr(10) ||
          'PPE provided free of charge'
        )
    ) AS seed(
      id, slug, title, location, experience_level,
      salary_min, salary_max, salary_display,
      description, requirements, responsibilities, benefits
    )
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.id = seed.id
          OR j.slug = seed.slug
          OR (
            j.country = 'Ukraine'
            AND lower(j.title) = lower(seed.title)
            AND j.status = 'ACTIVE'
          )
    );
  END IF;

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000031'::uuid, 'Manual handling'),
      ('a1e10000-2026-4000-8000-000000000031'::uuid, 'Packaging machines'),
      ('a1e10000-2026-4000-8000-000000000031'::uuid, 'Dairy production'),
      ('a1e10000-2026-4000-8000-000000000032'::uuid, 'Overhead crane'),
      ('a1e10000-2026-4000-8000-000000000032'::uuid, 'Metal cutting'),
      ('a1e10000-2026-4000-8000-000000000032'::uuid, 'Quality inspection'),
      ('a1e10000-2026-4000-8000-000000000033'::uuid, 'Toolmaking'),
      ('a1e10000-2026-4000-8000-000000000033'::uuid, 'Grinding machines'),
      ('a1e10000-2026-4000-8000-000000000033'::uuid, 'Blueprint reading'),
      ('a1e10000-2026-4000-8000-000000000034'::uuid, 'Material handling'),
      ('a1e10000-2026-4000-8000-000000000034'::uuid, 'Production support'),
      ('a1e10000-2026-4000-8000-000000000035'::uuid, 'Production line'),
      ('a1e10000-2026-4000-8000-000000000035'::uuid, 'Manual handling'),
      ('a1e10000-2026-4000-8000-000000000035'::uuid, 'Hygiene'),
      ('a1e10000-2026-4000-8000-000000000036'::uuid, 'Egg processing'),
      ('a1e10000-2026-4000-8000-000000000036'::uuid, 'Machine operation'),
      ('a1e10000-2026-4000-8000-000000000036'::uuid, 'Hygiene'),
      ('a1e10000-2026-4000-8000-000000000037'::uuid, 'Loading'),
      ('a1e10000-2026-4000-8000-000000000037'::uuid, 'Material handling'),
      ('a1e10000-2026-4000-8000-000000000038'::uuid, 'Drying machines'),
      ('a1e10000-2026-4000-8000-000000000038'::uuid, 'Temperature control'),
      ('a1e10000-2026-4000-8000-000000000038'::uuid, 'Shift reporting'),
      ('a1e10000-2026-4000-8000-000000000039'::uuid, 'Metal assembly'),
      ('a1e10000-2026-4000-8000-000000000039'::uuid, 'Grinding'),
      ('a1e10000-2026-4000-8000-000000000039'::uuid, 'Technical drawings'),
      ('a1e10000-2026-4000-8000-00000000003a'::uuid, 'MIG/MAG welding'),
      ('a1e10000-2026-4000-8000-00000000003a'::uuid, 'Technical drawings'),
      ('a1e10000-2026-4000-8000-00000000003a'::uuid, 'Tack welding')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );
END $$;
