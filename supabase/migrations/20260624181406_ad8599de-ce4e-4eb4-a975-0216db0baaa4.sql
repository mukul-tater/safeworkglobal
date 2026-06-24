CREATE OR REPLACE FUNCTION public.seed_officials_demo()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_partner_uid uuid;
  v_emp_uid uuid;
  v_worker_uids uuid[] := ARRAY[]::uuid[];
  v_employer_uids uuid[] := ARRAY[]::uuid[];
  v_partner_uids uuid[] := ARRAY[]::uuid[];
  v_job_ids uuid[] := ARRAY[]::uuid[];
  v_job_id uuid;
  v_partner_id uuid;
  v_email text;
  v_workers_seeded int := 0;
  v_employers_seeded int := 0;
  v_jobs_seeded int := 0;
  v_partners_seeded int := 0;
  v_apps_seeded int := 0;
  v_hired int := 0;
  rec record;
  i int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can seed demo data';
  END IF;

  -- 1) Wipe prior demo set (cascades through FKs where present)
  DELETE FROM auth.users WHERE email LIKE 'demo+%@safeworkglobal.demo';

  -- 2) Seed partners (4)
  FOR rec IN
    SELECT * FROM (VALUES
      ('demo+partner1@safeworkglobal.demo', 'Rajesh Sharma',         'Jaipur Connect eMitra',    'Jaipur',    'Rajasthan',     '+919812340001', 'approved'),
      ('demo+partner2@safeworkglobal.demo', 'Anita Verma',           'Lucknow Skill Hub',        'Lucknow',   'Uttar Pradesh', '+919812340002', 'approved'),
      ('demo+partner3@safeworkglobal.demo', 'Suresh Yadav',          'Patna Migrants Centre',    'Patna',     'Bihar',         '+919812340003', 'approved'),
      ('demo+partner4@safeworkglobal.demo', 'Lakshmi Nair',          'Kochi Skills eMitra',      'Kochi',     'Kerala',        '+919812340004', 'pending')
    ) AS t(email, name, center, city, state, phone, status)
  LOOP
    v_partner_uid := gen_random_uuid();
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
      confirmation_token,recovery_token,email_change_token_new,email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', v_partner_uid,'authenticated','authenticated',
      rec.email, extensions.crypt('Demo@1234', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.name, 'role','partner'),
      now(), now(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(), v_partner_uid,
      jsonb_build_object('sub', v_partner_uid::text,'email',rec.email),
      'email', v_partner_uid::text, now(), now(), now());

    INSERT INTO public.user_roles (user_id, role) VALUES (v_partner_uid,'partner') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id,email,full_name,phone,mobile_verified)
    VALUES (v_partner_uid, rec.email, rec.name, rec.phone, true)
    ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name;

    INSERT INTO public.partner_profiles (user_id, center_name, contact_person, phone, city, state, status, partner_code)
    VALUES (v_partner_uid, rec.center, rec.name, rec.phone, rec.city, rec.state, rec.status,
            public.generate_partner_code())
    ON CONFLICT (user_id) DO NOTHING;

    v_partner_uids := v_partner_uids || v_partner_uid;
    v_partners_seeded := v_partners_seeded + 1;
  END LOOP;

  -- 3) Seed employers (12 across countries with native currencies)
  FOR rec IN
    SELECT * FROM (VALUES
      ('demo+emp01@safeworkglobal.demo', 'Faisal Al-Mansouri',   'Al Habtoor Construction',          'Construction',         'UAE',          'Dubai',        'AED'),
      ('demo+emp02@safeworkglobal.demo', 'Khalid Al-Otaibi',     'Saudi Binladin Group',             'Construction',         'Saudi Arabia', 'Riyadh',       'SAR'),
      ('demo+emp03@safeworkglobal.demo', 'Mohammed Al-Thani',    'Qatari Diar Real Estate',          'Real Estate',          'Qatar',        'Doha',         'QAR'),
      ('demo+emp04@safeworkglobal.demo', 'Ahmed Al-Sabah',       'Kuwait Oil Services Co',           'Oil & Gas',            'Kuwait',       'Kuwait City',  'KWD'),
      ('demo+emp05@safeworkglobal.demo', 'Salim Al-Busaidi',     'Oman Marine Logistics',            'Logistics',            'Oman',         'Muscat',       'OMR'),
      ('demo+emp06@safeworkglobal.demo', 'Hamad Al-Khalifa',     'Bahrain Hospitality Group',        'Hospitality',          'Bahrain',      'Manama',       'BHD'),
      ('demo+emp07@safeworkglobal.demo', 'Tan Wei Ming',         'Singapore BuildTech Pte',          'Construction',         'Singapore',    'Singapore',    'SGD'),
      ('demo+emp08@safeworkglobal.demo', 'Lim Boon Heng',        'KL Facilities Sdn Bhd',            'Facilities Mgmt',      'Malaysia',     'Kuala Lumpur', 'MYR'),
      ('demo+emp09@safeworkglobal.demo', 'Yousef Al-Hashemi',    'Emirates Steel Industries',        'Manufacturing',        'UAE',          'Abu Dhabi',    'AED'),
      ('demo+emp10@safeworkglobal.demo', 'Naser Al-Ghamdi',      'NEOM Infrastructure',              'Construction',         'Saudi Arabia', 'Tabuk',        'SAR'),
      ('demo+emp11@safeworkglobal.demo', 'Abdullah Al-Kuwari',   'Qatar Hospitality Services',       'Hospitality',          'Qatar',        'Doha',         'QAR'),
      ('demo+emp12@safeworkglobal.demo', 'Rashid Al-Maktoum',    'Dubai Logistics City',             'Logistics',            'UAE',          'Dubai',        'AED')
    ) AS t(email, contact, company, industry, country, city, currency)
  LOOP
    v_emp_uid := gen_random_uuid();
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
      confirmation_token,recovery_token,email_change_token_new,email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', v_emp_uid,'authenticated','authenticated',
      rec.email, extensions.crypt('Demo@1234', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.contact,'role','employer'),
      now(), now(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(), v_emp_uid,
      jsonb_build_object('sub', v_emp_uid::text,'email',rec.email),
      'email', v_emp_uid::text, now(), now(), now());

    INSERT INTO public.user_roles (user_id, role) VALUES (v_emp_uid,'employer') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id,email,full_name,mobile_verified)
    VALUES (v_emp_uid, rec.email, rec.contact, true)
    ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name;

    INSERT INTO public.employer_profiles (user_id, company_name, industry, country, office_state, business_type, company_size, onboarding_completed, follows_safety_standards, provides_ppe, site_safety_level)
    VALUES (v_emp_uid, rec.company, rec.industry, rec.country, rec.city, 'Private Limited', '500-1000', true, true, 'Yes', 'High')
    ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name;

    v_employer_uids := v_employer_uids || v_emp_uid;
    v_employers_seeded := v_employers_seeded + 1;

    -- 4) For each employer create 2 jobs in their native currency
    FOR i IN 1..2 LOOP
      v_job_id := gen_random_uuid();
      INSERT INTO public.jobs (id, employer_id, title, description, requirements, benefits,
        location, country, job_type, experience_level, salary_min, salary_max, currency,
        openings, visa_sponsorship, status, posted_at, expires_at)
      VALUES (
        v_job_id, v_emp_uid,
        CASE i WHEN 1 THEN (ARRAY['Electrician','Welder','Plumber','Mason','Carpenter','HVAC Technician'])[1 + (v_employers_seeded % 6)]
               ELSE (ARRAY['Driver','Helper','Foreman','Steel Fixer','Painter','Scaffolder'])[1 + (v_employers_seeded % 6)] END
          || ' — ' || rec.city,
        'Hiring ' || rec.contact || '''s team at ' || rec.company || '. Long-term overseas placement with visa sponsorship and accommodation.',
        '2+ years experience. Valid passport. Willing to relocate to ' || rec.country || '.',
        'Visa, accommodation, transport, food allowance, annual leave + return ticket.',
        rec.city, rec.country, 'FULL_TIME',
        (ARRAY['ENTRY','INTERMEDIATE','SENIOR'])[1 + (i % 3)],
        CASE rec.currency
          WHEN 'AED' THEN 2200 + (i*300) WHEN 'SAR' THEN 2100 + (i*300)
          WHEN 'QAR' THEN 2400 + (i*300) WHEN 'KWD' THEN 220 + (i*40)
          WHEN 'OMR' THEN 210 + (i*30)  WHEN 'BHD' THEN 240 + (i*30)
          WHEN 'SGD' THEN 1800 + (i*200) WHEN 'MYR' THEN 2200 + (i*300)
          ELSE 50000 + (i*5000) END,
        CASE rec.currency
          WHEN 'AED' THEN 3500 + (i*300) WHEN 'SAR' THEN 3300 + (i*300)
          WHEN 'QAR' THEN 3600 + (i*300) WHEN 'KWD' THEN 350 + (i*40)
          WHEN 'OMR' THEN 320 + (i*30)  WHEN 'BHD' THEN 360 + (i*30)
          WHEN 'SGD' THEN 2800 + (i*200) WHEN 'MYR' THEN 3500 + (i*300)
          ELSE 80000 + (i*5000) END,
        rec.currency, 5 + i, true, 'ACTIVE', now() - (i || ' days')::interval, now() + interval '60 days'
      );
      v_job_ids := v_job_ids || v_job_id;
      v_jobs_seeded := v_jobs_seeded + 1;
    END LOOP;
  END LOOP;

  -- 5) Seed workers (30) — spread across states, half via eMitra partners
  FOR i IN 1..30 LOOP
    v_uid := gen_random_uuid();
    v_email := 'demo+worker' || lpad(i::text,2,'0') || '@safeworkglobal.demo';

    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
      confirmation_token,recovery_token,email_change_token_new,email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid,'authenticated','authenticated',
      v_email, extensions.crypt('Demo@1234', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name',
        (ARRAY['Ramesh','Suresh','Mahesh','Dinesh','Mukesh','Naresh','Vinod','Ashok','Manoj','Rakesh',
               'Sanjay','Vijay','Rajesh','Anil','Sunil','Sandeep','Amit','Deepak','Vikas','Prakash',
               'Kishore','Mohan','Mahendra','Bhanu','Pradeep','Arun','Anand','Kartik','Lokesh','Hemant'])[i] || ' '
        || (ARRAY['Kumar','Singh','Sharma','Verma','Yadav','Gupta','Patel','Reddy','Nair','Pillai'])[1+(i%10)],
        'role','worker'),
      now() - ((30-i) || ' days')::interval, now(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text,'email',v_email),
      'email', v_uid::text, now(), now(), now());

    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid,'worker') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id,email,full_name,phone,mobile_verified)
    VALUES (v_uid, v_email,
      (ARRAY['Ramesh','Suresh','Mahesh','Dinesh','Mukesh','Naresh','Vinod','Ashok','Manoj','Rakesh',
             'Sanjay','Vijay','Rajesh','Anil','Sunil','Sandeep','Amit','Deepak','Vikas','Prakash',
             'Kishore','Mohan','Mahendra','Bhanu','Pradeep','Arun','Anand','Kartik','Lokesh','Hemant'])[i] || ' '
      || (ARRAY['Kumar','Singh','Sharma','Verma','Yadav','Gupta','Patel','Reddy','Nair','Pillai'])[1+(i%10)],
      '+9198' || lpad((10000000 + i*131)::text, 8, '0'), true)
    ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name;

    -- half via partners (i.e. first 15 organic, last 15 via partner rotation)
    v_partner_id := NULL;
    IF i > 15 THEN
      SELECT id INTO v_partner_id FROM public.partner_profiles
        WHERE user_id = v_partner_uids[1 + ((i-15) % array_length(v_partner_uids,1))];
    END IF;

    INSERT INTO public.worker_profiles (
      user_id, bio, nationality, current_city, current_location, country,
      primary_work_type, years_of_experience, skill_level,
      expected_salary_min, expected_salary_max, currency,
      availability, has_passport, has_visa, languages, ecr_status, ecr_category,
      open_to_relocation, preferred_shift, onboarding_completed,
      source_type, source_partner_id, review_status
    ) VALUES (
      v_uid,
      'Experienced ' || (ARRAY['Electrician','Welder','Plumber','Mason','Carpenter','HVAC Technician','Driver','Helper'])[1+(i%8)]
        || ' seeking GCC placement.',
      'Indian',
      (ARRAY['Jaipur','Lucknow','Patna','Kochi','Chennai','Chandigarh','Bhubaneswar','Kolkata'])[1+(i%8)],
      (ARRAY['Jaipur, Rajasthan','Lucknow, Uttar Pradesh','Patna, Bihar','Kochi, Kerala','Chennai, Tamil Nadu','Chandigarh, Punjab','Bhubaneswar, Odisha','Kolkata, West Bengal'])[1+(i%8)],
      'India',
      (ARRAY['Electrician','Welder','Plumber','Mason','Carpenter','HVAC Technician','Driver','Helper'])[1+(i%8)],
      2 + (i % 12),
      (ARRAY['Helper','Semi Skilled','Skilled'])[1 + (i % 3)],
      (40000 + (i*500))::numeric, (75000 + (i*500))::numeric, 'INR',
      'Immediate', (i % 3 <> 0), (i % 5 = 0),
      ARRAY['Hindi','English'],
      CASE WHEN i % 3 <> 0 THEN 'required' ELSE 'not_checked' END,
      CASE WHEN i % 3 <> 0 THEN 'ECR' END,
      true, 'Day', true,
      CASE WHEN v_partner_id IS NOT NULL THEN 'emitra' ELSE 'organic' END,
      v_partner_id,
      CASE WHEN v_partner_id IS NULL THEN 'not_required'
           WHEN i % 4 = 0 THEN 'pending'
           ELSE 'approved' END
    ) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.worker_skills (worker_id, skill_name, proficiency_level, years_of_experience)
    VALUES (v_uid,
      (ARRAY['Electrician','Welder','Plumber','Mason','Carpenter','HVAC Technician','Driver','Helper'])[1+(i%8)],
      (ARRAY['beginner','intermediate','advanced'])[1+(i%3)],
      2 + (i % 12))
    ON CONFLICT DO NOTHING;

    v_worker_uids := v_worker_uids || v_uid;
    v_workers_seeded := v_workers_seeded + 1;
  END LOOP;

  -- 6) Applications: each worker applies to 1-2 jobs; statuses spread
  FOR i IN 1..array_length(v_worker_uids,1) LOOP
    -- first application
    v_job_id := v_job_ids[1 + (i % array_length(v_job_ids,1))];
    INSERT INTO public.job_applications (job_id, worker_id, employer_id, status, applied_at)
    VALUES (
      v_job_id, v_worker_uids[i],
      (SELECT employer_id FROM public.jobs WHERE id = v_job_id),
      (ARRAY['PENDING','SHORTLISTED','INTERVIEW_SCHEDULED','SELECTED','REJECTED','OFFERED','HIRED','PENDING','SHORTLISTED','HIRED'])[1+(i%10)],
      now() - ((30 - i) || ' days')::interval
    ) ON CONFLICT DO NOTHING;
    v_apps_seeded := v_apps_seeded + 1;
    IF (i % 10) IN (6, 9) THEN v_hired := v_hired + 1; END IF;

    -- second application for half the workers
    IF i % 2 = 0 THEN
      v_job_id := v_job_ids[1 + ((i+5) % array_length(v_job_ids,1))];
      INSERT INTO public.job_applications (job_id, worker_id, employer_id, status, applied_at)
      VALUES (
        v_job_id, v_worker_uids[i],
        (SELECT employer_id FROM public.jobs WHERE id = v_job_id),
        (ARRAY['PENDING','SHORTLISTED','REJECTED','SELECTED','OFFERED'])[1+(i%5)],
        now() - ((20 - (i%20)) || ' days')::interval
      ) ON CONFLICT DO NOTHING;
      v_apps_seeded := v_apps_seeded + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'workers', v_workers_seeded,
    'employers', v_employers_seeded,
    'jobs', v_jobs_seeded,
    'partners', v_partners_seeded,
    'applications', v_apps_seeded,
    'hired_estimate', v_hired
  );
END $$;

REVOKE ALL ON FUNCTION public.seed_officials_demo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_officials_demo() TO authenticated, service_role;
