-- Ukraine Find-jobs catalog: Packer vacancy in Kyiv, Ukraine.
-- Follows the existing Ukraine listed jobs pattern.

DO $$
DECLARE
  v_employer uuid;
  v_description text := 'This is a standing position. You will be required to pack finished products into plastic bags in rows, attach labels, and seal the ends of the bags with tape. Depending on the volume of the bottles, different quantities are packed into each bag. The finished packages are then taken to the warehouse (each package weighs 3–4 kg). The number of finished packages is recorded on a special form.';
  v_requirements text :=
    'Physical stamina and ability to work in a standing position' || chr(10) ||
    'Good attention to detail for neat packing, labelling, and sealing' || chr(10) ||
    'Ability to carry and move finished packages weighing 3–4 kg' || chr(10) ||
    'Able to work 12-hour rotating shifts (day and night)' || chr(10) ||
    'Basic numeracy to record finished packages accurately on special forms' || chr(10) ||
    'Responsible, disciplined, and punctual' || chr(10) ||
    'No previous experience required; training provided by employer';
  v_responsibilities text :=
    'Pack finished bottle products into plastic bags in neat, orderly rows' || chr(10) ||
    'Attach product labels accurately and seal bag ends securely with tape' || chr(10) ||
    'Pack correct quantities into each bag according to bottle volume specifications' || chr(10) ||
    'Transport finished packages (each weighing 3–4 kg) to the warehouse' || chr(10) ||
    'Record the number of finished packages accurately on the special reporting form' || chr(10) ||
    'Maintain cleanliness and orderliness at the workstation';
  v_benefits text :=
    'Housing provided (hostel within 10-minute walk)' || chr(10) ||
    'Meals financially reimbursed' || chr(10) ||
    'Transportation: Not required; hostel is within 10-minute walking distance of workplace' || chr(10) ||
    'Work schedule: 5 days on, 2 days off (Monday through Friday)' || chr(10) ||
    'Rotating shifts: Week 1 day (8:00 AM – 8:00 PM), Week 2 night (8:00 PM – 8:00 AM)' || chr(10) ||
    'Two 30-minute lunch breaks per shift' || chr(10) ||
    'Comprehensive on-the-job training provided' || chr(10) ||
    'Workwear provided' || chr(10) ||
    'Legal employment contract';
  v_benefits_hi text :=
    'आवास उपलब्ध (कार्यस्थल से 10 मिनट की पैदल दूरी पर हॉस्टल)' || chr(10) ||
    'भोजन का खर्च कंपनी द्वारा प्रतिपूर्ति (Reimbursed)' || chr(10) ||
    'परिवहन की आवश्यकता नहीं; हॉस्टल से कार्यस्थल केवल 10 मिनट की पैदल दूरी पर' || chr(10) ||
    'कार्य अनुसूची: 5 दिन काम, 2 दिन छुट्टी (सोमवार से शुक्रवार)' || chr(10) ||
    'रोटेटिंग शिफ्ट: पहला सप्ताह डे शिफ्ट (सुबह 8:00 से रात 8:00), दूसरा सप्ताह नाइट शिफ्ट (रात 8:00 से सुबह 8:00)' || chr(10) ||
    'प्रति शिफ्ट दो 30-मिनट के लंच ब्रेक' || chr(10) ||
    'कंपनी द्वारा संपूर्ण ऑन-द-जॉब ट्रेनिंग' || chr(10) ||
    'काम के कपड़े और सुरक्षा उपकरण उपलब्ध' || chr(10) ||
    'कानूनी रोजगार अनुबंध';
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

  -- 1. Update existing row if already present
  UPDATE public.jobs AS j
  SET
    status = 'ACTIVE',
    title = 'Packer',
    title_hi = 'पैकर',
    description = v_description,
    requirements = v_requirements,
    responsibilities = v_responsibilities,
    benefits = v_benefits,
    benefits_hi = v_benefits_hi,
    location = 'Kyiv',
    country = 'Ukraine',
    job_type = 'FULL_TIME',
    experience_level = 'ENTRY',
    salary_min = 600,
    salary_max = 700,
    local_salary_min = 50000,
    local_salary_max = 58000,
    local_salary_currency = 'INR',
    currency = 'USD',
    salary_display = 'USD 600–700 (₹50,000–₹58,000)',
    openings = 5,
    visa_sponsorship = false,
    remote_allowed = false,
    service_charge = 200000,
    work_phrase = 'packing finished products',
    use_saved_copy = true,
    age_min = 20,
    age_max = 50,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  WHERE j.slug = 'ukraine-listed-packer'
     OR j.id = 'a1e10000-2026-4000-8000-00000000003b'::uuid
     OR (j.country = 'Ukraine' AND lower(j.title) = 'packer');

  -- 2. Insert new job if missing
  IF v_employer IS NOT NULL THEN
    INSERT INTO public.jobs (
      id, employer_id, created_by, posted_by_role,
      title, title_hi, description, requirements, responsibilities, benefits, benefits_hi,
      location, country, job_type, experience_level,
      salary_min, salary_max, local_salary_min, local_salary_max, local_salary_currency,
      currency, salary_display,
      openings, visa_sponsorship, remote_allowed, status,
      posted_at, expires_at, slug, service_charge,
      work_phrase, use_saved_copy, age_min, age_max
    )
    SELECT
      'a1e10000-2026-4000-8000-00000000003b'::uuid,
      v_employer,
      v_employer,
      'admin',
      'Packer',
      'पैकर',
      v_description,
      v_requirements,
      v_responsibilities,
      v_benefits,
      v_benefits_hi,
      'Kyiv',
      'Ukraine',
      'FULL_TIME',
      'ENTRY',
      600,
      700,
      50000,
      58000,
      'INR',
      'USD',
      'USD 600–700 (₹50,000–₹58,000)',
      5,
      false,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      'ukraine-listed-packer',
      200000,
      'packing finished products',
      true,
      20,
      50
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.id = 'a1e10000-2026-4000-8000-00000000003b'::uuid
          OR j.slug = 'ukraine-listed-packer'
          OR (
            j.country = 'Ukraine'
            AND lower(j.title) = 'packer'
            AND j.status = 'ACTIVE'
          )
    );
  END IF;

  -- 3. Seed job skills
  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-00000000003b'::uuid, 'Packing'),
      ('a1e10000-2026-4000-8000-00000000003b'::uuid, 'Packaging'),
      ('a1e10000-2026-4000-8000-00000000003b'::uuid, 'Labeling'),
      ('a1e10000-2026-4000-8000-00000000003b'::uuid, 'Material handling'),
      ('a1e10000-2026-4000-8000-00000000003b'::uuid, 'Quality inspection')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );
END $$;
