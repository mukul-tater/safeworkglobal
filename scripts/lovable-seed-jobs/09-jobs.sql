-- Jobs batch 9 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  'ab3566d9-3db2-4681-910b-523d510c4644',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Janitorial Supervisor - Cleaning & Maintenance',
  'Reputed employer hiring experienced janitorial supervisor for a cleaning & maintenance project in Seoul, South Korea. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of cleaning & maintenance experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in South Korea Basic English communication',
  'Monthly salary ₹57K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute cleaning & maintenance tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Seoul',
  'South Korea',
  'CONTRACT',
  'INTERMEDIATE',
  57137,
  71274,
  'INR',
  '₹57K – ₹71K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-07T09:09:36.903Z',
  '2026-08-25T09:09:36.903Z'
),
(
  'bc7fcccc-5316-42bc-adfe-38bc922715d7',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Industrial Cleaner - Cleaning & Maintenance',
  'Reputed employer hiring experienced industrial cleaner for a cleaning & maintenance project in Abu Dhabi, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of cleaning & maintenance experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹60K – ₹75K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute cleaning & maintenance tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Abu Dhabi',
  'UAE',
  'FULL_TIME',
  'SENIOR',
  60274,
  74548,
  'INR',
  '₹60K – ₹75K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-06T09:09:36.903Z',
  '2026-08-26T09:09:36.903Z'
),
(
  'e4cc4ba3-6288-45b7-92bf-cb69c7d9e708',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Maintenance Helper - Cleaning & Maintenance',
  'Reputed employer hiring experienced maintenance helper for a cleaning & maintenance project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of cleaning & maintenance experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹63K – ₹78K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute cleaning & maintenance tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Riyadh',
  'Saudi Arabia',
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
  '2026-06-05T09:09:36.903Z',
  '2026-08-27T09:09:36.903Z'
),
(
  'fd6a6a93-3553-4712-980f-13bf16c7c5c4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Sanitation Worker - Cleaning & Maintenance',
  'Reputed employer hiring experienced sanitation worker for a cleaning & maintenance project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of cleaning & maintenance experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹58K – ₹72K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute cleaning & maintenance tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dammam',
  'Saudi Arabia',
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
  '2026-06-04T09:09:36.903Z',
  '2026-08-28T09:09:36.903Z'
),
(
  '1a8c3f87-74f7-4310-8b3b-cb5876369eb4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Line Cook - Food & Beverage',
  'Reputed employer hiring experienced line cook for a food & beverage project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of food & beverage experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹50K – ₹55K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute food & beverage tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-03T09:09:36.903Z',
  '2026-08-25T09:09:36.903Z'
),
(
  '49a7e1cf-9dff-41ca-bfd7-cb4b3cc77aef',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Kitchen Steward - Food & Beverage',
  'Reputed employer hiring experienced kitchen steward for a food & beverage project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of food & beverage experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹53K – ₹58K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute food & beverage tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-02T09:09:36.903Z',
  '2026-08-26T09:09:36.903Z'
),
(
  '80032de3-0c1f-49c0-97c2-b4501e7406c3',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Barista - Food & Beverage',
  'Reputed employer hiring experienced barista for a food & beverage project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of food & beverage experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹56K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute food & beverage tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-01T09:09:36.903Z',
  '2026-08-27T09:09:36.903Z'
),
(
  '686fb7d1-b637-4cdc-86fb-f6f94a4d329f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Food Prep Worker - Food & Beverage',
  'Reputed employer hiring experienced food prep worker for a food & beverage project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of food & beverage experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹59K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute food & beverage tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-31T09:09:36.903Z',
  '2026-08-28T09:09:36.903Z'
),
(
  '7b94ea7f-efe2-451d-a4a6-4e1df34d56ed',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Catering Assistant - Food & Beverage',
  'Reputed employer hiring experienced catering assistant for a food & beverage project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of food & beverage experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹54K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute food & beverage tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-30T09:09:36.903Z',
  '2026-08-29T09:09:36.903Z'
),
(
  'dc1567af-61ab-4d04-b16f-592ac500ad6f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Greenhouse Worker - Agriculture',
  'Reputed employer hiring experienced greenhouse worker for a agriculture project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of agriculture experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹51K – ₹57K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute agriculture tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-29T09:09:36.903Z',
  '2026-08-26T09:09:36.903Z'
),
(
  'ed0f39a1-1876-4585-a3a2-7157e14bf2dc',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Farm Machine Operator - Agriculture',
  'Reputed employer hiring experienced farm machine operator for a agriculture project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of agriculture experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹54K – ₹60K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute agriculture tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-28T09:09:36.903Z',
  '2026-08-27T09:09:36.903Z'
),
(
  '36a1f3e2-405e-4ffb-8311-609ce1f20ea0',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Irrigation Technician - Agriculture',
  'Reputed employer hiring experienced irrigation technician for a agriculture project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of agriculture experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹57K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute agriculture tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-27T09:09:36.903Z',
  '2026-08-28T09:09:36.903Z'
);
