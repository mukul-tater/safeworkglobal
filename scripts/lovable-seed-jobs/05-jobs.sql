-- Jobs batch 5 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '738c20b7-a654-481c-b360-9948602ad53f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Bar Bending Operator - Steel Fixing',
  'Reputed employer hiring experienced bar bending operator for a steel fixing project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of steel fixing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹63K – ₹78K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute steel fixing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Osaka',
  'Japan',
  'CONTRACT',
  'EXPERT',
  63411,
  77822,
  'INR',
  '₹63K – ₹78K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-05-30T09:09:36.903Z',
  '2026-08-17T09:09:36.903Z'
),
(
  '000b15b0-eda9-4979-8569-9aaa5f05ea0b',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Steel Supervisor - Steel Fixing',
  'Reputed employer hiring experienced steel supervisor for a steel fixing project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of steel fixing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹58K – ₹72K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute steel fixing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Berlin',
  'Germany',
  'FULL_TIME',
  'INTERMEDIATE',
  57548,
  72096,
  'INR',
  '₹58K – ₹72K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-05-29T09:09:36.903Z',
  '2026-08-18T09:09:36.903Z'
),
(
  '396bad64-1814-40fb-b33c-e4ce47ae4414',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Scaffolder - Scaffolding',
  'Reputed employer hiring experienced scaffolder for a scaffolding project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of scaffolding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹50K – ₹55K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute scaffolding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Salalah',
  'Oman',
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
  '2026-05-28T09:09:36.903Z',
  '2026-08-15T09:09:36.903Z'
),
(
  'e476c1cb-aa03-4b99-b300-1a56b4ed1fba',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Scaffolding Supervisor - Scaffolding',
  'Reputed employer hiring experienced scaffolding supervisor for a scaffolding project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of scaffolding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹53K – ₹58K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute scaffolding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Tokyo',
  'Japan',
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
  '2026-05-27T09:09:36.903Z',
  '2026-08-16T09:09:36.903Z'
),
(
  '395c7c71-b654-48be-b5bf-e361a48f1467',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Tube & Fitting Specialist - Scaffolding',
  'Reputed employer hiring experienced tube & fitting specialist for a scaffolding project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of scaffolding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹56K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute scaffolding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Singapore',
  'Singapore',
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
  '2026-05-26T09:09:36.903Z',
  '2026-08-17T09:09:36.903Z'
),
(
  '6eb3e0c1-7c8f-4ace-83ab-7cc7ce0752c3',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'System Scaffold Erector - Scaffolding',
  'Reputed employer hiring experienced system scaffold erector for a scaffolding project in Sydney, Australia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of scaffolding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Australia Basic English communication',
  'Monthly salary ₹59K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute scaffolding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sydney',
  'Australia',
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
  '2026-05-25T09:09:36.903Z',
  '2026-08-18T09:09:36.903Z'
),
(
  '31e49a29-8b88-4ce8-a516-721e44c1d580',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Scaffold Inspector - Scaffolding',
  'Reputed employer hiring experienced scaffold inspector for a scaffolding project in London, UK. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of scaffolding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UK Basic English communication',
  'Monthly salary ₹54K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute scaffolding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'London',
  'UK',
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
  '2026-05-24T09:09:36.903Z',
  '2026-08-19T09:09:36.903Z'
),
(
  'aaa47623-7d96-42fc-8bcc-73d71ae2d76f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Excavator Operator - Heavy Equipment Operation',
  'Reputed employer hiring experienced excavator operator for a heavy equipment operation project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of heavy equipment operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹51K – ₹57K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute heavy equipment operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Osaka',
  'Japan',
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
  '2026-05-23T09:09:36.903Z',
  '2026-08-16T09:09:36.903Z'
),
(
  'af0d0033-d5fb-4b57-a114-d72509eceb45',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Bulldozer Operator - Heavy Equipment Operation',
  'Reputed employer hiring experienced bulldozer operator for a heavy equipment operation project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of heavy equipment operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹54K – ₹60K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute heavy equipment operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Berlin',
  'Germany',
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
  '2026-06-19T09:09:36.903Z',
  '2026-08-17T09:09:36.903Z'
),
(
  '23ab65b3-08ac-4ad1-b9d5-9c37a538e625',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Loader Operator - Heavy Equipment Operation',
  'Reputed employer hiring experienced loader operator for a heavy equipment operation project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of heavy equipment operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹57K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute heavy equipment operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Toronto',
  'Canada',
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
  '2026-06-18T09:09:36.903Z',
  '2026-08-18T09:09:36.903Z'
),
(
  '1bf8da41-0215-4439-aaa5-2273bd3bcf45',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Grader Operator - Heavy Equipment Operation',
  'Reputed employer hiring experienced grader operator for a heavy equipment operation project in Seoul, South Korea. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of heavy equipment operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in South Korea Basic English communication',
  'Monthly salary ₹60K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute heavy equipment operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Seoul',
  'South Korea',
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
  '2026-06-17T09:09:36.903Z',
  '2026-08-19T09:09:36.903Z'
),
(
  'b4caf003-03bb-41cf-bb56-626fc868b0c8',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Heavy Plant Operator - Heavy Equipment Operation',
  'Reputed employer hiring experienced heavy plant operator for a heavy equipment operation project in Abu Dhabi, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of heavy equipment operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹55K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute heavy equipment operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Abu Dhabi',
  'UAE',
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
  '2026-06-16T09:09:36.903Z',
  '2026-08-20T09:09:36.903Z'
);
