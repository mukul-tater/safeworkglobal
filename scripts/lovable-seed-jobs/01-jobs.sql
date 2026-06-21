-- Jobs batch 1 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '93319c0d-9211-4eec-bddf-84dd5c99e37f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Site Supervisor - Construction',
  'Reputed employer hiring experienced site supervisor for a construction project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of construction experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹50K – ₹55K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute construction tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dubai',
  'UAE',
  'FULL_TIME',
  'ENTRY',
  50000,
  55000,
  'INR',
  '₹50K – ₹55K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-19T09:09:36.901Z',
  '2026-08-05T09:09:36.902Z'
),
(
  '1ec3d22b-fc8e-4ccd-827a-15808e2c5ebf',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mason - Construction',
  'Reputed employer hiring experienced mason for a construction project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of construction experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹53K – ₹58K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute construction tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sharjah',
  'UAE',
  'CONTRACT',
  'INTERMEDIATE',
  53137,
  58274,
  'INR',
  '₹53K – ₹58K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-18T09:09:36.902Z',
  '2026-08-06T09:09:36.902Z'
),
(
  'ee1af625-914a-4b04-a257-622b5398adc8',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Concrete Finisher - Construction',
  'Reputed employer hiring experienced concrete finisher for a construction project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of construction experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹56K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute construction tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Jeddah',
  'Saudi Arabia',
  'FULL_TIME',
  'SENIOR',
  56274,
  61548,
  'INR',
  '₹56K – ₹62K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-17T09:09:36.902Z',
  '2026-08-07T09:09:36.902Z'
),
(
  '56c14205-8cfe-4fa8-948f-e34495365845',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Formwork Carpenter - Construction',
  'Reputed employer hiring experienced formwork carpenter for a construction project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of construction experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹59K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute construction tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Doha',
  'Qatar',
  'CONTRACT',
  'EXPERT',
  59411,
  64822,
  'INR',
  '₹59K – ₹65K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-16T09:09:36.902Z',
  '2026-08-08T09:09:36.902Z'
),
(
  '1f379277-bc36-4a97-b828-d2c0254b171f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Construction Foreman - Construction',
  'Reputed employer hiring experienced construction foreman for a construction project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of construction experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹54K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute construction tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Kuwait City',
  'Kuwait',
  'FULL_TIME',
  'INTERMEDIATE',
  53548,
  59096,
  'INR',
  '₹54K – ₹59K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-15T09:09:36.902Z',
  '2026-08-09T09:09:36.902Z'
),
(
  'd6bd2722-a638-4bb4-908c-dae621d45f03',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Industrial Electrician - Electrical',
  'Reputed employer hiring experienced industrial electrician for a electrical project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of electrical experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹51K – ₹57K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute electrical tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Riyadh',
  'Saudi Arabia',
  'FULL_TIME',
  'ENTRY',
  51000,
  57000,
  'INR',
  '₹51K – ₹57K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-14T09:09:36.902Z',
  '2026-08-06T09:09:36.902Z'
),
(
  '55c1f2fc-f90a-4cd8-b05f-c70e49ee1c8c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Commercial Electrician - Electrical',
  'Reputed employer hiring experienced commercial electrician for a electrical project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of electrical experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹54K – ₹60K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute electrical tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dammam',
  'Saudi Arabia',
  'CONTRACT',
  'INTERMEDIATE',
  54137,
  60274,
  'INR',
  '₹54K – ₹60K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-13T09:09:36.902Z',
  '2026-08-07T09:09:36.902Z'
),
(
  '42abe152-005c-47b2-ac9b-792e27868116',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Maintenance Electrician - Electrical',
  'Reputed employer hiring experienced maintenance electrician for a electrical project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of electrical experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹57K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute electrical tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Al Wakrah',
  'Qatar',
  'FULL_TIME',
  'SENIOR',
  57274,
  63548,
  'INR',
  '₹57K – ₹64K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-12T09:09:36.902Z',
  '2026-08-08T09:09:36.902Z'
),
(
  '3ceaefed-fd09-4a97-bdfd-8d0a019a0d5c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Solar Technician - Electrical',
  'Reputed employer hiring experienced solar technician for a electrical project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of electrical experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹60K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute electrical tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Muscat',
  'Oman',
  'CONTRACT',
  'EXPERT',
  60411,
  66822,
  'INR',
  '₹60K – ₹67K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-11T09:09:36.902Z',
  '2026-08-09T09:09:36.902Z'
),
(
  '60136e8f-70d7-41bf-b9e5-5bbc0e701d4b',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Panel Installer - Electrical',
  'Reputed employer hiring experienced panel installer for a electrical project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of electrical experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹55K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute electrical tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Manama',
  'Bahrain',
  'FULL_TIME',
  'INTERMEDIATE',
  54548,
  61096,
  'INR',
  '₹55K – ₹61K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-10T09:09:36.902Z',
  '2026-08-10T09:09:36.902Z'
),
(
  '5cff405e-dfd5-4d79-822b-c04e065564d8',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'MIG Welder - Welding',
  'Reputed employer hiring experienced mig welder for a welding project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of welding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹52K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute welding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Doha',
  'Qatar',
  'FULL_TIME',
  'ENTRY',
  52000,
  59000,
  'INR',
  '₹52K – ₹59K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-09T09:09:36.902Z',
  '2026-08-07T09:09:36.902Z'
),
(
  'a155a2fb-5c6c-42ef-b9aa-80bc6db202e7',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'TIG Welder - Welding',
  'Reputed employer hiring experienced tig welder for a welding project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of welding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹55K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute welding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Kuwait City',
  'Kuwait',
  'CONTRACT',
  'INTERMEDIATE',
  55137,
  62274,
  'INR',
  '₹55K – ₹62K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-08T09:09:36.902Z',
  '2026-08-08T09:09:36.902Z'
);
