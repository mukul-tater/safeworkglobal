-- Europe Find-jobs catalog: Czech Republic vacancies.
-- Same shape as the Ukraine listings. UAE trade templates do not apply.

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_currency_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_currency_check
  CHECK (currency = ANY (ARRAY[
    'INR','USD','EUR','GBP',
    'AED','SAR','QAR','KWD','OMR','BHD',
    'SGD','MYR','JPY','HKD','TWD','KRW','THB','IDR','PHP','VND',
    'AUD','NZD','CAD','CHF','SEK','NOK','DKK','PLN','TRY','ZAR','ILS','EGP',
    'CZK'
  ]));

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
    country = 'Europe',
    job_type = 'FULL_TIME',
    experience_level = seed.experience_level,
    salary_min = seed.salary_min,
    salary_max = seed.salary_max,
    currency = seed.currency,
    salary_display = seed.salary_display,
    openings = 1,
    visa_sponsorship = false,
    remote_allowed = false,
    service_charge = 35400,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  FROM (
    VALUES
      (
        'a1e10000-2026-4000-8000-000000000041'::uuid,
        'europe-listed-car-factory-production-worker',
        'Car Factory – Production Worker',
        'Choceň, Czech Republic',
        'ENTRY',
        25000::numeric, 30000::numeric, 'CZK',
        'CZK 25,000 – 30,000 (₹1,20,000 – ₹1,50,000) per month',
        'Work at an automotive manufacturing plant in Choceň, Czech Republic. Work is organized in three shifts, with additional hours available. Men and women can apply. Married couples are preferred. Pay is CZK 25,000–30,000 per month (₹1,20,000–₹1,50,000).',
        'Basic production skills' || chr(10) ||
        'Attention to detail' || chr(10) ||
        'Able to work in shifts' || chr(10) ||
        'Physical fitness' || chr(10) ||
        'Men and women' || chr(10) ||
        'Married couples preferred',
        'Operate a press' || chr(10) ||
        'Load and unload blanks' || chr(10) ||
        'Assist in the production of heat and noise insulation materials for cars',
        'Free accommodation' || chr(10) ||
        'Work clothes provided' || chr(10) ||
        'Weekly salary advances' || chr(10) ||
        'Official employment' || chr(10) ||
        'Candidates with their own accommodation may receive an additional 2,500 CZK'
      ),
      (
        'a1e10000-2026-4000-8000-000000000042'::uuid,
        'europe-listed-notino-warehouse',
        'Warehouse & Logistics Worker – NOTINO',
        'Rajhrad, Czech Republic',
        'ENTRY',
        NULL::numeric, NULL::numeric, 'CZK',
        '150–170 CZK/hour',
        'Warehouse and logistics work at NOTINO in Rajhrad, Czech Republic. The role covers product collection, packaging, sorting, and dispatch. Pay is 150–170 CZK per hour.',
        'Attention to detail' || chr(10) ||
        'Basic scanning and packing skills' || chr(10) ||
        'Able to follow instructions' || chr(10) ||
        'Willing to work 5–6 days per week',
        'Pick products using a scanner' || chr(10) ||
        'Pack goods' || chr(10) ||
        'Print barcodes' || chr(10) ||
        'Sort products' || chr(10) ||
        'Prepare orders for shipment',
        'Company bus transportation' || chr(10) ||
        'Accommodation available at 4,800 CZK per month, deducted from salary'
      ),
      (
        'a1e10000-2026-4000-8000-000000000043'::uuid,
        'europe-listed-food-production-baguettes',
        'Food Production Worker – Baguettes & Hamburgers',
        'Žiželice, Czech Republic',
        'ENTRY',
        NULL::numeric, NULL::numeric, 'CZK',
        '130 CZK/hour, up to 250 hours per month',
        'Food manufacturing in Žiželice, Czech Republic, preparing bakery and fast-food products. Women and couples are preferred. Pay is 130 CZK per hour, with up to 250 working hours per month.',
        'Able to work in food production' || chr(10) ||
        'Maintain hygiene' || chr(10) ||
        'Follow instructions' || chr(10) ||
        'Work efficiently in a team' || chr(10) ||
        'Women and couples preferred',
        'Assist in the preparation, production, packing, and handling of baguettes and hamburgers' || chr(10) ||
        'Maintain hygiene standards',
        'Free accommodation' || chr(10) ||
        'Free food'
      ),
      (
        'a1e10000-2026-4000-8000-000000000044'::uuid,
        'europe-listed-auto-wheel-production',
        'Automobile Factory – Production & Quality Control Worker',
        'Czech Republic',
        'ENTRY',
        NULL::numeric, NULL::numeric, 'CZK',
        '140 CZK/hour plus bonuses',
        'Automotive manufacturing of vehicle wheel components, with quality checks. A city was not specified. Pay is 140 CZK per hour plus bonuses.',
        'Attention to detail' || chr(10) ||
        'Basic production skills' || chr(10) ||
        'Able to handle small components' || chr(10) ||
        'Willing to work in shifts',
        'Manufacture automotive wheel components' || chr(10) ||
        'Handle small parts' || chr(10) ||
        'Perform quality checks' || chr(10) ||
        'Assist with production operations',
        'Free accommodation' || chr(10) ||
        'Transportation to work' || chr(10) ||
        'Work clothes' || chr(10) ||
        'Subsidized lunches' || chr(10) ||
        'Social benefits' || chr(10) ||
        'Additional bonuses'
      ),
      (
        'a1e10000-2026-4000-8000-000000000045'::uuid,
        'europe-listed-co2-welding-robot',
        'CO₂ Welding Robot Operator / Production Worker',
        'Slaný, Czech Republic',
        'INTERMEDIATE',
        NULL::numeric, NULL::numeric, 'CZK',
        '180 per hour (currency not stated in the vacancy)',
        'Male candidates support automated welding at a production facility in Slaný, Czech Republic. Shifts are 8–10 hours. The vacancy states 180 per hour. The currency was not stated. A welding certificate is not required.',
        'Knowledge of CO₂ welding' || chr(10) ||
        'A certificate is not required' || chr(10) ||
        'Basic machine operation' || chr(10) ||
        'Troubleshooting' || chr(10) ||
        'Able to work 8–10 hours per shift' || chr(10) ||
        'Male candidates',
        'Monitor an automated welding robot' || chr(10) ||
        'Check the quality of welded components' || chr(10) ||
        'Remove faulty parts' || chr(10) ||
        'Clean components' || chr(10) ||
        'Perform manual welding when necessary',
        'Accommodation available at 5,000 CZK' || chr(10) ||
        'Company bus transportation' || chr(10) ||
        'Legal employment documentation'
      ),
      (
        'a1e10000-2026-4000-8000-000000000046'::uuid,
        'europe-listed-hotel-staff',
        'Hotel Staff – Housekeeping, Kitchen & Parking',
        'Pec pod Sněžkou and Beroun, Czech Republic',
        'ENTRY',
        NULL::numeric, NULL::numeric, 'CZK',
        'Pec pod Sněžkou: 120–140 CZK/hour. Beroun housekeeping: 115 CZK/hour',
        'Hotel work in Pec pod Sněžkou and Beroun, Czech Republic, for housekeeping, breakfast cooks, and parking or garage support. Some positions are described as permanent. Pec pod Sněžkou pay is 120–140 CZK per hour depending on the role. Beroun housekeeping is 115 CZK per hour, and piece-rate work is also mentioned.',
        'Cleaning and housekeeping skills' || chr(10) ||
        'Attention to detail' || chr(10) ||
        'Basic kitchen skills for breakfast cooks' || chr(10) ||
        'Driving skills for the parking role where applicable',
        'Clean hotel rooms' || chr(10) ||
        'Maintain housekeeping standards' || chr(10) ||
        'Prepare breakfast' || chr(10) ||
        'Park vehicles or clean garages, depending on the assigned position',
        'Accommodation available' || chr(10) ||
        'Beroun: free accommodation' || chr(10) ||
        'Pec pod Sněžkou parking role: accommodation at 2,500 CZK'
      ),
      (
        'a1e10000-2026-4000-8000-000000000047'::uuid,
        'europe-listed-automotive-sewing',
        'Automotive Sewing Machine Operator / Seamstress',
        'Bor, Czech Republic',
        'INTERMEDIATE',
        NULL::numeric, NULL::numeric, 'CZK',
        'CZK 150/hour net for the first 3 months, CZK 155/hour from months 3–6, CZK 160/hour after 6 months',
        'Full-time sewing of automotive interior components in Bor, Czech Republic, about 60 km from Plzeň. Previous sewing experience is required. No night shifts are mentioned. Pay is described as net: 150 CZK per hour for the first 3 months, 155 CZK per hour from months 3–6, and 160 CZK per hour after 6 months.',
        'Sewing experience required' || chr(10) ||
        'Able to operate sewing machines' || chr(10) ||
        'Precision' || chr(10) ||
        'Attention to quality',
        'Sew and assemble automotive interior components' || chr(10) ||
        'Operate sewing machines' || chr(10) ||
        'Maintain production quality',
        'Accommodation provided' || chr(10) ||
        'Weekly salary advances' || chr(10) ||
        'Attendance and quality bonuses' || chr(10) ||
        'Additional working hours available' || chr(10) ||
        'Bonuses of up to 5,000 CZK per month may be available'
      ),
      (
        'a1e10000-2026-4000-8000-000000000048'::uuid,
        'europe-listed-seat-belt-production',
        'Automotive Seat Belt Production Worker',
        'Brandýs nad Labem, Czech Republic',
        'ENTRY',
        NULL::numeric, NULL::numeric, 'CZK',
        '150 CZK/hour net',
        'Automotive seat-belt production in Brandýs nad Labem, Czech Republic. Shifts are 12 hours, five days per week, covering morning and night. Pay is 150 CZK per hour net.',
        'Attention to detail' || chr(10) ||
        'Able to operate specialized machinery' || chr(10) ||
        'Manual dexterity' || chr(10) ||
        'Willing to work morning and night shifts',
        'Sew, assemble, and manufacture automotive seat belts on specialized machines' || chr(10) ||
        'Follow production and quality standards',
        'Accommodation provided' || chr(10) ||
        'Candidates living in Prague may receive housing support of 3,500 CZK and travel reimbursement of 1,200 CZK' || chr(10) ||
        'Visa and document support'
      )
  ) AS seed(
    id, slug, title, location, experience_level,
    salary_min, salary_max, currency, salary_display,
    description, requirements, responsibilities, benefits
  )
  WHERE j.id = seed.id OR j.slug = seed.slug;

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping insert of Europe listed jobs: no employer or admin user found';
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
      'Europe',
      'FULL_TIME',
      seed.experience_level,
      seed.salary_min,
      seed.salary_max,
      seed.currency,
      seed.salary_display,
      1,
      false,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      seed.slug,
      35400
    FROM (
      VALUES
        (
          'a1e10000-2026-4000-8000-000000000041'::uuid,
          'europe-listed-car-factory-production-worker',
          'Car Factory – Production Worker',
          'Choceň, Czech Republic',
          'ENTRY',
          25000::numeric, 30000::numeric, 'CZK',
          'CZK 25,000 – 30,000 (₹1,20,000 – ₹1,50,000) per month',
          'Work at an automotive manufacturing plant in Choceň, Czech Republic. Work is organized in three shifts, with additional hours available. Men and women can apply. Married couples are preferred. Pay is CZK 25,000–30,000 per month (₹1,20,000–₹1,50,000).',
          'Basic production skills' || chr(10) ||
          'Attention to detail' || chr(10) ||
          'Able to work in shifts' || chr(10) ||
          'Physical fitness' || chr(10) ||
          'Men and women' || chr(10) ||
          'Married couples preferred',
          'Operate a press' || chr(10) ||
          'Load and unload blanks' || chr(10) ||
          'Assist in the production of heat and noise insulation materials for cars',
          'Free accommodation' || chr(10) ||
          'Work clothes provided' || chr(10) ||
          'Weekly salary advances' || chr(10) ||
          'Official employment' || chr(10) ||
          'Candidates with their own accommodation may receive an additional 2,500 CZK'
        ),
        (
          'a1e10000-2026-4000-8000-000000000042'::uuid,
          'europe-listed-notino-warehouse',
          'Warehouse & Logistics Worker – NOTINO',
          'Rajhrad, Czech Republic',
          'ENTRY',
          NULL::numeric, NULL::numeric, 'CZK',
          '150–170 CZK/hour',
          'Warehouse and logistics work at NOTINO in Rajhrad, Czech Republic. The role covers product collection, packaging, sorting, and dispatch. Pay is 150–170 CZK per hour.',
          'Attention to detail' || chr(10) ||
          'Basic scanning and packing skills' || chr(10) ||
          'Able to follow instructions' || chr(10) ||
          'Willing to work 5–6 days per week',
          'Pick products using a scanner' || chr(10) ||
          'Pack goods' || chr(10) ||
          'Print barcodes' || chr(10) ||
          'Sort products' || chr(10) ||
          'Prepare orders for shipment',
          'Company bus transportation' || chr(10) ||
          'Accommodation available at 4,800 CZK per month, deducted from salary'
        ),
        (
          'a1e10000-2026-4000-8000-000000000043'::uuid,
          'europe-listed-food-production-baguettes',
          'Food Production Worker – Baguettes & Hamburgers',
          'Žiželice, Czech Republic',
          'ENTRY',
          NULL::numeric, NULL::numeric, 'CZK',
          '130 CZK/hour, up to 250 hours per month',
          'Food manufacturing in Žiželice, Czech Republic, preparing bakery and fast-food products. Women and couples are preferred. Pay is 130 CZK per hour, with up to 250 working hours per month.',
          'Able to work in food production' || chr(10) ||
          'Maintain hygiene' || chr(10) ||
          'Follow instructions' || chr(10) ||
          'Work efficiently in a team' || chr(10) ||
          'Women and couples preferred',
          'Assist in the preparation, production, packing, and handling of baguettes and hamburgers' || chr(10) ||
          'Maintain hygiene standards',
          'Free accommodation' || chr(10) ||
          'Free food'
        ),
        (
          'a1e10000-2026-4000-8000-000000000044'::uuid,
          'europe-listed-auto-wheel-production',
          'Automobile Factory – Production & Quality Control Worker',
          'Czech Republic',
          'ENTRY',
          NULL::numeric, NULL::numeric, 'CZK',
          '140 CZK/hour plus bonuses',
          'Automotive manufacturing of vehicle wheel components, with quality checks. A city was not specified. Pay is 140 CZK per hour plus bonuses.',
          'Attention to detail' || chr(10) ||
          'Basic production skills' || chr(10) ||
          'Able to handle small components' || chr(10) ||
          'Willing to work in shifts',
          'Manufacture automotive wheel components' || chr(10) ||
          'Handle small parts' || chr(10) ||
          'Perform quality checks' || chr(10) ||
          'Assist with production operations',
          'Free accommodation' || chr(10) ||
          'Transportation to work' || chr(10) ||
          'Work clothes' || chr(10) ||
          'Subsidized lunches' || chr(10) ||
          'Social benefits' || chr(10) ||
          'Additional bonuses'
        ),
        (
          'a1e10000-2026-4000-8000-000000000045'::uuid,
          'europe-listed-co2-welding-robot',
          'CO₂ Welding Robot Operator / Production Worker',
          'Slaný, Czech Republic',
          'INTERMEDIATE',
          NULL::numeric, NULL::numeric, 'CZK',
          '180 per hour (currency not stated in the vacancy)',
          'Male candidates support automated welding at a production facility in Slaný, Czech Republic. Shifts are 8–10 hours. The vacancy states 180 per hour. The currency was not stated. A welding certificate is not required.',
          'Knowledge of CO₂ welding' || chr(10) ||
          'A certificate is not required' || chr(10) ||
          'Basic machine operation' || chr(10) ||
          'Troubleshooting' || chr(10) ||
          'Able to work 8–10 hours per shift' || chr(10) ||
          'Male candidates',
          'Monitor an automated welding robot' || chr(10) ||
          'Check the quality of welded components' || chr(10) ||
          'Remove faulty parts' || chr(10) ||
          'Clean components' || chr(10) ||
          'Perform manual welding when necessary',
          'Accommodation available at 5,000 CZK' || chr(10) ||
          'Company bus transportation' || chr(10) ||
          'Legal employment documentation'
        ),
        (
          'a1e10000-2026-4000-8000-000000000046'::uuid,
          'europe-listed-hotel-staff',
          'Hotel Staff – Housekeeping, Kitchen & Parking',
          'Pec pod Sněžkou and Beroun, Czech Republic',
          'ENTRY',
          NULL::numeric, NULL::numeric, 'CZK',
          'Pec pod Sněžkou: 120–140 CZK/hour. Beroun housekeeping: 115 CZK/hour',
          'Hotel work in Pec pod Sněžkou and Beroun, Czech Republic, for housekeeping, breakfast cooks, and parking or garage support. Some positions are described as permanent. Pec pod Sněžkou pay is 120–140 CZK per hour depending on the role. Beroun housekeeping is 115 CZK per hour, and piece-rate work is also mentioned.',
          'Cleaning and housekeeping skills' || chr(10) ||
          'Attention to detail' || chr(10) ||
          'Basic kitchen skills for breakfast cooks' || chr(10) ||
          'Driving skills for the parking role where applicable',
          'Clean hotel rooms' || chr(10) ||
          'Maintain housekeeping standards' || chr(10) ||
          'Prepare breakfast' || chr(10) ||
          'Park vehicles or clean garages, depending on the assigned position',
          'Accommodation available' || chr(10) ||
          'Beroun: free accommodation' || chr(10) ||
          'Pec pod Sněžkou parking role: accommodation at 2,500 CZK'
        ),
        (
          'a1e10000-2026-4000-8000-000000000047'::uuid,
          'europe-listed-automotive-sewing',
          'Automotive Sewing Machine Operator / Seamstress',
          'Bor, Czech Republic',
          'INTERMEDIATE',
          NULL::numeric, NULL::numeric, 'CZK',
          'CZK 150/hour net for the first 3 months, CZK 155/hour from months 3–6, CZK 160/hour after 6 months',
          'Full-time sewing of automotive interior components in Bor, Czech Republic, about 60 km from Plzeň. Previous sewing experience is required. No night shifts are mentioned. Pay is described as net: 150 CZK per hour for the first 3 months, 155 CZK per hour from months 3–6, and 160 CZK per hour after 6 months.',
          'Sewing experience required' || chr(10) ||
          'Able to operate sewing machines' || chr(10) ||
          'Precision' || chr(10) ||
          'Attention to quality',
          'Sew and assemble automotive interior components' || chr(10) ||
          'Operate sewing machines' || chr(10) ||
          'Maintain production quality',
          'Accommodation provided' || chr(10) ||
          'Weekly salary advances' || chr(10) ||
          'Attendance and quality bonuses' || chr(10) ||
          'Additional working hours available' || chr(10) ||
          'Bonuses of up to 5,000 CZK per month may be available'
        ),
        (
          'a1e10000-2026-4000-8000-000000000048'::uuid,
          'europe-listed-seat-belt-production',
          'Automotive Seat Belt Production Worker',
          'Brandýs nad Labem, Czech Republic',
          'ENTRY',
          NULL::numeric, NULL::numeric, 'CZK',
          '150 CZK/hour net',
          'Automotive seat-belt production in Brandýs nad Labem, Czech Republic. Shifts are 12 hours, five days per week, covering morning and night. Pay is 150 CZK per hour net.',
          'Attention to detail' || chr(10) ||
          'Able to operate specialized machinery' || chr(10) ||
          'Manual dexterity' || chr(10) ||
          'Willing to work morning and night shifts',
          'Sew, assemble, and manufacture automotive seat belts on specialized machines' || chr(10) ||
          'Follow production and quality standards',
          'Accommodation provided' || chr(10) ||
          'Candidates living in Prague may receive housing support of 3,500 CZK and travel reimbursement of 1,200 CZK' || chr(10) ||
          'Visa and document support'
        )
    ) AS seed(
      id, slug, title, location, experience_level,
      salary_min, salary_max, currency, salary_display,
      description, requirements, responsibilities, benefits
    )
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.id = seed.id
          OR j.slug = seed.slug
          OR (
            j.country = 'Europe'
            AND lower(j.title) = lower(seed.title)
            AND j.status = 'ACTIVE'
          )
    );
  END IF;

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000041'::uuid, 'Press operation'),
      ('a1e10000-2026-4000-8000-000000000041'::uuid, 'Production'),
      ('a1e10000-2026-4000-8000-000000000041'::uuid, 'Shift work'),
      ('a1e10000-2026-4000-8000-000000000042'::uuid, 'Scanning'),
      ('a1e10000-2026-4000-8000-000000000042'::uuid, 'Packing'),
      ('a1e10000-2026-4000-8000-000000000042'::uuid, 'Sorting'),
      ('a1e10000-2026-4000-8000-000000000043'::uuid, 'Food production'),
      ('a1e10000-2026-4000-8000-000000000043'::uuid, 'Hygiene'),
      ('a1e10000-2026-4000-8000-000000000043'::uuid, 'Packing'),
      ('a1e10000-2026-4000-8000-000000000044'::uuid, 'Production'),
      ('a1e10000-2026-4000-8000-000000000044'::uuid, 'Quality checks'),
      ('a1e10000-2026-4000-8000-000000000044'::uuid, 'Small parts'),
      ('a1e10000-2026-4000-8000-000000000045'::uuid, 'CO₂ welding'),
      ('a1e10000-2026-4000-8000-000000000045'::uuid, 'Welding robot'),
      ('a1e10000-2026-4000-8000-000000000045'::uuid, 'Quality checks'),
      ('a1e10000-2026-4000-8000-000000000046'::uuid, 'Housekeeping'),
      ('a1e10000-2026-4000-8000-000000000046'::uuid, 'Breakfast'),
      ('a1e10000-2026-4000-8000-000000000046'::uuid, 'Parking'),
      ('a1e10000-2026-4000-8000-000000000047'::uuid, 'Sewing'),
      ('a1e10000-2026-4000-8000-000000000047'::uuid, 'Sewing machines'),
      ('a1e10000-2026-4000-8000-000000000047'::uuid, 'Automotive interiors'),
      ('a1e10000-2026-4000-8000-000000000048'::uuid, 'Seat belts'),
      ('a1e10000-2026-4000-8000-000000000048'::uuid, 'Sewing'),
      ('a1e10000-2026-4000-8000-000000000048'::uuid, 'Machine operation')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );
END $$;
