-- Jobs batch 8 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '5d9a05a1-575c-4269-8084-45be521d1ce3',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'AV Installer - IT & Technology',
  'Reputed employer hiring experienced av installer for a it & technology project in Sydney, Australia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of it & technology experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Australia Basic English communication',
  'Monthly salary ₹55K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute it & technology tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sydney',
  'Australia',
  'FULL_TIME',
  'INTERMEDIATE',
  54548,
  66096,
  'INR',
  '₹55K – ₹66K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-19T09:09:36.903Z',
  '2026-08-25T09:09:36.903Z'
),
(
  '016a1b63-4bc4-4df3-aaa0-b1331d35715c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Site Engineer Assistant - Engineering',
  'Reputed employer hiring experienced site engineer assistant for a engineering project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of engineering experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹52K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute engineering tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Manama',
  'Bahrain',
  'FULL_TIME',
  'ENTRY',
  52000,
  64000,
  'INR',
  '₹52K – ₹64K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-18T09:09:36.903Z',
  '2026-08-22T09:09:36.903Z'
),
(
  'ad889d1a-688c-44e7-ae68-f71acacb1dbd',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'QA/QC Inspector - Engineering',
  'Reputed employer hiring experienced qa/qc inspector for a engineering project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of engineering experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹55K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute engineering tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Osaka',
  'Japan',
  'CONTRACT',
  'INTERMEDIATE',
  55137,
  67274,
  'INR',
  '₹55K – ₹67K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-17T09:09:36.903Z',
  '2026-08-23T09:09:36.903Z'
),
(
  'd9020822-ce6f-4222-9ffd-b9caab950e7c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Surveyor Helper - Engineering',
  'Reputed employer hiring experienced surveyor helper for a engineering project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of engineering experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹58K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute engineering tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Berlin',
  'Germany',
  'FULL_TIME',
  'SENIOR',
  58274,
  70548,
  'INR',
  '₹58K – ₹71K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-16T09:09:36.903Z',
  '2026-08-24T09:09:36.903Z'
),
(
  '2bb1b38d-9017-4f05-99d0-dd27219ff1d2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Drafting Technician - Engineering',
  'Reputed employer hiring experienced drafting technician for a engineering project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of engineering experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹61K – ₹74K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute engineering tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Toronto',
  'Canada',
  'CONTRACT',
  'EXPERT',
  61411,
  73822,
  'INR',
  '₹61K – ₹74K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-15T09:09:36.903Z',
  '2026-08-25T09:09:36.903Z'
),
(
  'ffeff68f-043e-452e-9c44-ed5781e0b7ae',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Commissioning Technician - Engineering',
  'Reputed employer hiring experienced commissioning technician for a engineering project in Seoul, South Korea. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of engineering experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in South Korea Basic English communication',
  'Monthly salary ₹56K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute engineering tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Seoul',
  'South Korea',
  'FULL_TIME',
  'INTERMEDIATE',
  55548,
  68096,
  'INR',
  '₹56K – ₹68K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-14T09:09:36.903Z',
  '2026-08-26T09:09:36.903Z'
),
(
  '56758f9c-03a5-4715-a376-fdb12ca151d9',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Security Guard - Security',
  'Reputed employer hiring experienced security guard for a security project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of security experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹53K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute security tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Singapore',
  'Singapore',
  'FULL_TIME',
  'ENTRY',
  53000,
  66000,
  'INR',
  '₹53K – ₹66K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-13T09:09:36.903Z',
  '2026-08-23T09:09:36.903Z'
),
(
  '673ebb34-7ed4-45bb-96fb-94cd79af40a2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'CCTV Operator - Security',
  'Reputed employer hiring experienced cctv operator for a security project in Sydney, Australia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of security experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Australia Basic English communication',
  'Monthly salary ₹56K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute security tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sydney',
  'Australia',
  'CONTRACT',
  'INTERMEDIATE',
  56137,
  69274,
  'INR',
  '₹56K – ₹69K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-12T09:09:36.903Z',
  '2026-08-24T09:09:36.903Z'
),
(
  '1336968e-30b6-48cd-accc-f8e0fff1258a',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Access Control Officer - Security',
  'Reputed employer hiring experienced access control officer for a security project in London, UK. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of security experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UK Basic English communication',
  'Monthly salary ₹59K – ₹73K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute security tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'London',
  'UK',
  'FULL_TIME',
  'SENIOR',
  59274,
  72548,
  'INR',
  '₹59K – ₹73K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-11T09:09:36.903Z',
  '2026-08-25T09:09:36.903Z'
),
(
  'cdcce99b-8a83-404e-85af-c7d15458eeff',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Patrol Supervisor - Security',
  'Reputed employer hiring experienced patrol supervisor for a security project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of security experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹62K – ₹76K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute security tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dubai',
  'UAE',
  'CONTRACT',
  'EXPERT',
  62411,
  75822,
  'INR',
  '₹62K – ₹76K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-10T09:09:36.903Z',
  '2026-08-26T09:09:36.903Z'
),
(
  '2aec7deb-eef6-4bd5-84d3-4ff5dd500dc2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Event Security Staff - Security',
  'Reputed employer hiring experienced event security staff for a security project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of security experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹57K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute security tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sharjah',
  'UAE',
  'FULL_TIME',
  'INTERMEDIATE',
  56548,
  70096,
  'INR',
  '₹57K – ₹70K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-09T09:09:36.903Z',
  '2026-08-27T09:09:36.903Z'
),
(
  '22bc8962-f9ea-4639-826b-737038d3a862',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Facility Cleaner - Cleaning & Maintenance',
  'Reputed employer hiring experienced facility cleaner for a cleaning & maintenance project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of cleaning & maintenance experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹54K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute cleaning & maintenance tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Toronto',
  'Canada',
  'FULL_TIME',
  'ENTRY',
  54000,
  68000,
  'INR',
  '₹54K – ₹68K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-08T09:09:36.903Z',
  '2026-08-24T09:09:36.903Z'
);
