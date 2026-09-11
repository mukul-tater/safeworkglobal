-- Add Furniture Carpenter - Finishing, All Rounder to the UAE Choose-a-job catalog.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('furniture_carpenter_finishing_all_rounder', 'Furniture Carpenter - Finishing, All Rounder', 43)
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
    RAISE NOTICE 'Skipping furniture carpenter seed: no employer or admin user found';
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
        'a1e10000-2026-4000-8000-00000000001f'::uuid,
        'Furniture Carpenter - Finishing, All Rounder',
        'uae-listed-furniture-carpenter',
        'Dubai',
        'INTERMEDIATE',
        32000, 38000, '₹32,000 – ₹38,000', 10,
        'UAE interiors employer hiring furniture carpenters (finishing, all rounder) for Dubai projects. Cabinets, wardrobes, joinery and finishing carpentry.',
        '2+ years furniture / finishing carpenter experience' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Build and finish furniture, cabinets, wardrobes and wooden joinery' || chr(10) || 'Cut, assemble, sand and fix timber to drawings and site measures' || chr(10) || 'Install doors, frames, panelling, skirting and furniture fittings' || chr(10) || 'Handle finishing, polish and snag-list close-out before handover' || chr(10) || 'Work as an all-rounder across furniture and finishing carpentry as directed' || chr(10) || 'Follow site HSE and protect completed interiors'
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
      ('a1e10000-2026-4000-8000-00000000001f'::uuid, 'Furniture Carpentry'),
      ('a1e10000-2026-4000-8000-00000000001f'::uuid, 'Finishing Carpentry')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
