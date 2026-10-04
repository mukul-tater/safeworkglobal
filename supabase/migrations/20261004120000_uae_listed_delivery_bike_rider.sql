-- Delivery category: UAE bike rider listing, same shape as the other UAE trades.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('delivery', 'Delivery', 30)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
    'Accommodation until the UAE license is issued' || chr(10) ||
    'Transport until the UAE license is issued' || chr(10) ||
    'Food provided by the company until the UAE license is issued';
  v_description text :=
    'Bike rider openings for full-time delivery work in the UAE (Keta). You need a valid Indian driving license and an ECNR passport, and you must be physically fit for flexible shifts. Riding experience is preferred; freshers may be considered. Pay is AED 7.5 per delivery. Duty is 11+1 hours a day. Age 22–37 years. The UAE license fee of AED 4,500 is deducted over up to 10 months. Accommodation, transport and food are provided until the UAE license is issued. Selection is through an online interview. Visa sponsorship for shortlisted candidates.';
  v_requirements text :=
    'Valid Indian driving license — mandatory' || chr(10) ||
    'Physically fit and able to work flexible shifts' || chr(10) ||
    'Good riding and road-safety skills' || chr(10) ||
    'Able to work extended hours' || chr(10) ||
    'ECNR passport required' || chr(10) ||
    'Delivery or rider experience preferred' || chr(10) ||
    'Age 22–37 years' || chr(10) ||
    'Duty 11+1 hours per day' || chr(10) ||
    'UAE license fee AED 4,500, deducted over up to 10 months';
  v_responsibilities text :=
    'Deliver orders safely and on time' || chr(10) ||
    'Follow assigned delivery routes and schedules' || chr(10) ||
    'Keep clear communication with the company and team' || chr(10) ||
    'Handle deliveries carefully' || chr(10) ||
    'Follow UAE traffic and road-safety rules' || chr(10) ||
    'Complete the deliveries assigned for the day';
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
    title = 'Bike Rider',
    description = v_description,
    requirements = v_requirements,
    responsibilities = v_responsibilities,
    benefits = v_benefits,
    location = 'Keta',
    country = 'UAE',
    job_type = 'FULL_TIME',
    experience_level = 'ENTRY',
    salary_min = NULL,
    salary_max = NULL,
    currency = 'AED',
    salary_display = 'AED 7.5 per delivery',
    visa_sponsorship = true,
    remote_allowed = false,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  WHERE j.slug = 'uae-listed-bike-rider'
     OR j.id = 'a1e10000-2026-4000-8000-000000000030'::uuid;

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping insert of UAE bike rider job: no employer or admin user found';
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
      'a1e10000-2026-4000-8000-000000000030'::uuid,
      v_employer,
      v_employer,
      'admin',
      'Bike Rider',
      v_description,
      v_requirements,
      v_responsibilities,
      v_benefits,
      'Keta',
      'UAE',
      'FULL_TIME',
      'ENTRY',
      NULL,
      NULL,
      'AED',
      'AED 7.5 per delivery',
      1,
      true,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      'uae-listed-bike-rider',
      35400
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.slug = 'uae-listed-bike-rider'
          OR j.id = 'a1e10000-2026-4000-8000-000000000030'::uuid
          OR (j.country = 'UAE' AND lower(j.title) = 'bike rider' AND j.status = 'ACTIVE')
    );
  END IF;

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000030'::uuid, 'Indian driving license'),
      ('a1e10000-2026-4000-8000-000000000030'::uuid, 'Road safety'),
      ('a1e10000-2026-4000-8000-000000000030'::uuid, 'Bike riding')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );
END $$;
