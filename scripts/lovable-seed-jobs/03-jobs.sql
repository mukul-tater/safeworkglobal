-- Jobs batch 3 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  'c4ece3da-2510-4683-baaa-1cb1a162bc70',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Refrigeration Mechanic - HVAC',
  'Reputed employer hiring experienced refrigeration mechanic for a hvac project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of hvac experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹58K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hvac tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dubai',
  'UAE',
  'FULL_TIME',
  'INTERMEDIATE',
  57548,
  67096,
  'INR',
  '₹58K – ₹67K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-05-26T09:09:36.902Z',
  '2026-08-13T09:09:36.902Z'
),
(
  '283013f4-91ea-4d38-9226-5b583746a947',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'CNC Operator - Manufacturing',
  'Reputed employer hiring experienced cnc operator for a manufacturing project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of manufacturing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹50K – ₹60K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute manufacturing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Berlin',
  'Germany',
  'FULL_TIME',
  'ENTRY',
  50000,
  60000,
  'INR',
  '₹50K – ₹60K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-05-25T09:09:36.902Z',
  '2026-08-10T09:09:36.902Z'
),
(
  'ece7a0c1-563d-4b1f-9d65-09535cfa42b2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Assembly Line Worker - Manufacturing',
  'Reputed employer hiring experienced assembly line worker for a manufacturing project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of manufacturing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹53K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute manufacturing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Toronto',
  'Canada',
  'CONTRACT',
  'INTERMEDIATE',
  53137,
  63274,
  'INR',
  '₹53K – ₹63K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-05-24T09:09:36.902Z',
  '2026-08-11T09:09:36.902Z'
),
(
  '80bf7159-17da-474f-93a1-18379630b857',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Quality Inspector - Manufacturing',
  'Reputed employer hiring experienced quality inspector for a manufacturing project in Seoul, South Korea. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of manufacturing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in South Korea Basic English communication',
  'Monthly salary ₹56K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute manufacturing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Seoul',
  'South Korea',
  'FULL_TIME',
  'SENIOR',
  56274,
  66548,
  'INR',
  '₹56K – ₹67K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-05-23T09:09:36.902Z',
  '2026-08-12T09:09:36.902Z'
),
(
  '44af4b03-1998-4694-8e6c-b4a5ff16c39c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Machine Operator - Manufacturing',
  'Reputed employer hiring experienced machine operator for a manufacturing project in Abu Dhabi, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of manufacturing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹59K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute manufacturing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Abu Dhabi',
  'UAE',
  'CONTRACT',
  'EXPERT',
  59411,
  69822,
  'INR',
  '₹59K – ₹70K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-19T09:09:36.902Z',
  '2026-08-13T09:09:36.902Z'
),
(
  'bc7bfd05-9408-48c5-885a-8b362c4a6f81',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Production Supervisor - Manufacturing',
  'Reputed employer hiring experienced production supervisor for a manufacturing project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of manufacturing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹54K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute manufacturing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Riyadh',
  'Saudi Arabia',
  'FULL_TIME',
  'INTERMEDIATE',
  53548,
  64096,
  'INR',
  '₹54K – ₹64K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-18T09:09:36.902Z',
  '2026-08-14T09:09:36.902Z'
),
(
  'fd637e7c-4bc7-4e08-a437-a07124a5431e',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Finish Carpenter - Carpentry',
  'Reputed employer hiring experienced finish carpenter for a carpentry project in London, UK. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of carpentry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UK Basic English communication',
  'Monthly salary ₹51K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute carpentry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'London',
  'UK',
  'FULL_TIME',
  'ENTRY',
  51000,
  62000,
  'INR',
  '₹51K – ₹62K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-17T09:09:36.902Z',
  '2026-08-11T09:09:36.902Z'
),
(
  '019886e5-bb05-467b-84d1-f1cd64df7aeb',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Formwork Carpenter - Carpentry',
  'Reputed employer hiring experienced formwork carpenter for a carpentry project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of carpentry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹54K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute carpentry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dubai',
  'UAE',
  'CONTRACT',
  'INTERMEDIATE',
  54137,
  65274,
  'INR',
  '₹54K – ₹65K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-16T09:09:36.902Z',
  '2026-08-12T09:09:36.902Z'
),
(
  'd3a3b55f-6940-4408-b868-99844a9acc1f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Furniture Carpenter - Carpentry',
  'Reputed employer hiring experienced furniture carpenter for a carpentry project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of carpentry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹57K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute carpentry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sharjah',
  'UAE',
  'FULL_TIME',
  'SENIOR',
  57274,
  68548,
  'INR',
  '₹57K – ₹69K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-15T09:09:36.902Z',
  '2026-08-13T09:09:36.902Z'
),
(
  '3467c9a6-6eef-43ab-93f6-688421d632d3',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Joinery Specialist - Carpentry',
  'Reputed employer hiring experienced joinery specialist for a carpentry project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of carpentry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹60K – ₹72K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute carpentry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Jeddah',
  'Saudi Arabia',
  'CONTRACT',
  'EXPERT',
  60411,
  71822,
  'INR',
  '₹60K – ₹72K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-14T09:09:36.902Z',
  '2026-08-14T09:09:36.902Z'
),
(
  'ec63797c-3887-46e2-9d28-09cf848fb586',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Wood Frame Installer - Carpentry',
  'Reputed employer hiring experienced wood frame installer for a carpentry project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of carpentry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹55K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute carpentry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Doha',
  'Qatar',
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
  '2026-06-13T09:09:36.902Z',
  '2026-08-15T09:09:36.902Z'
),
(
  'c20312f0-4eca-4e57-9e8c-6755eee6f6a6',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Industrial Painter - Painting',
  'Reputed employer hiring experienced industrial painter for a painting project in Abu Dhabi, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of painting experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹52K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute painting tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Abu Dhabi',
  'UAE',
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
  '2026-06-12T09:09:36.902Z',
  '2026-08-12T09:09:36.902Z'
);
