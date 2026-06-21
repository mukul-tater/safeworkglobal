-- Jobs batch 10 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '0a9fe50b-94cb-4a56-a7ef-b4bf94de36c6',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Harvest Worker - Agriculture',
  'Reputed employer hiring experienced harvest worker for a agriculture project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of agriculture experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹60K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute agriculture tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-26T09:09:36.903Z',
  '2026-08-29T09:09:36.903Z'
),
(
  '0d0548eb-0707-4961-bffe-f53e17ceb249',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Livestock Handler - Agriculture',
  'Reputed employer hiring experienced livestock handler for a agriculture project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of agriculture experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹55K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute agriculture tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-25T09:09:36.903Z',
  '2026-08-30T09:09:36.903Z'
),
(
  '73b1901d-c0a0-4168-a711-03e8ced467e6',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Rig Helper - Oil & Gas',
  'Reputed employer hiring experienced rig helper for a oil & gas project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of oil & gas experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹52K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute oil & gas tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-24T09:09:36.903Z',
  '2026-08-27T09:09:36.903Z'
),
(
  'ea7911ae-4093-40b3-9aa6-dcb48ec56c7b',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Pipefitter - Oil & Gas',
  'Reputed employer hiring experienced pipefitter for a oil & gas project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of oil & gas experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹55K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute oil & gas tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-23T09:09:36.903Z',
  '2026-08-28T09:09:36.903Z'
),
(
  'cc3dbf1e-651a-46e3-900d-66264c0db6f4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Instrument Technician - Oil & Gas',
  'Reputed employer hiring experienced instrument technician for a oil & gas project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of oil & gas experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹58K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute oil & gas tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Salalah',
  'Oman',
  'FULL_TIME',
  'SENIOR',
  58274,
  65548,
  'INR',
  '₹58K – ₹66K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-19T09:09:36.903Z',
  '2026-08-29T09:09:36.903Z'
),
(
  '3c58ad31-f5df-4051-9ff9-f95a1b275718',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mechanical Fitter - Oil & Gas',
  'Reputed employer hiring experienced mechanical fitter for a oil & gas project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of oil & gas experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹61K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute oil & gas tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Tokyo',
  'Japan',
  'CONTRACT',
  'EXPERT',
  61411,
  68822,
  'INR',
  '₹61K – ₹69K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-18T09:09:36.903Z',
  '2026-08-30T09:09:36.903Z'
),
(
  'b176b620-5327-46c8-bb71-fe2ad103f13c',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'HSE Officer Assistant - Oil & Gas',
  'Reputed employer hiring experienced hse officer assistant for a oil & gas project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of oil & gas experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹56K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute oil & gas tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Singapore',
  'Singapore',
  'FULL_TIME',
  'INTERMEDIATE',
  55548,
  63096,
  'INR',
  '₹56K – ₹63K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-17T09:09:36.903Z',
  '2026-08-31T09:09:36.903Z'
),
(
  'b1c1d30b-ce4a-49cf-a4d9-9091d23dab72',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mine Operator - Mining',
  'Reputed employer hiring experienced mine operator for a mining project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of mining experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹53K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute mining tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Muscat',
  'Oman',
  'FULL_TIME',
  'ENTRY',
  53000,
  61000,
  'INR',
  '₹53K – ₹61K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-16T09:09:36.903Z',
  '2026-08-28T09:09:36.903Z'
),
(
  'b3b8f060-c174-4b2c-a1ee-8c04d1292582',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Underground Miner - Mining',
  'Reputed employer hiring experienced underground miner for a mining project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of mining experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹56K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute mining tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Manama',
  'Bahrain',
  'CONTRACT',
  'INTERMEDIATE',
  56137,
  64274,
  'INR',
  '₹56K – ₹64K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-15T09:09:36.903Z',
  '2026-08-29T09:09:36.903Z'
),
(
  'b2145fb7-108a-4d6c-88e8-4011d227352d',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Blasting Helper - Mining',
  'Reputed employer hiring experienced blasting helper for a mining project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of mining experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹59K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute mining tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Osaka',
  'Japan',
  'FULL_TIME',
  'SENIOR',
  59274,
  67548,
  'INR',
  '₹59K – ₹68K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-14T09:09:36.903Z',
  '2026-08-30T09:09:36.903Z'
),
(
  'f66c01e6-6395-4fa0-8c22-64203f31bdd2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mineral Processing Operator - Mining',
  'Reputed employer hiring experienced mineral processing operator for a mining project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of mining experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹62K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute mining tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Berlin',
  'Germany',
  'CONTRACT',
  'EXPERT',
  62411,
  70822,
  'INR',
  '₹62K – ₹71K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-13T09:09:36.903Z',
  '2026-08-31T09:09:36.903Z'
),
(
  'd5af3d2d-ce62-413d-9990-1e7eaddb013d',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mine Maintenance Worker - Mining',
  'Reputed employer hiring experienced mine maintenance worker for a mining project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of mining experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹57K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute mining tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Toronto',
  'Canada',
  'FULL_TIME',
  'INTERMEDIATE',
  56548,
  65096,
  'INR',
  '₹57K – ₹65K',
  6,
  true,
  false,
  'ACTIVE',
  '2026-06-12T09:09:36.903Z',
  '2026-09-01T09:09:36.903Z'
);
