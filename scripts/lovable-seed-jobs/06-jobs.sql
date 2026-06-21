-- Jobs batch 6 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '80c42f51-1fb5-47ed-9df4-e10b13b41b87',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Tower Crane Operator - Crane Operation',
  'Reputed employer hiring experienced tower crane operator for a crane operation project in Sydney, Australia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of crane operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Australia Basic English communication',
  'Monthly salary ₹52K – ₹59K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute crane operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sydney',
  'Australia',
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
  '2026-06-15T09:09:36.903Z',
  '2026-08-17T09:09:36.903Z'
),
(
  'ce78d82c-4100-4694-b8c2-7a8097491f66',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Mobile Crane Operator - Crane Operation',
  'Reputed employer hiring experienced mobile crane operator for a crane operation project in London, UK. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of crane operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UK Basic English communication',
  'Monthly salary ₹55K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute crane operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'London',
  'UK',
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
  '2026-06-14T09:09:36.903Z',
  '2026-08-18T09:09:36.903Z'
),
(
  '0c7a22db-1e71-4ea7-b205-13d9f9479a6e',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Overhead Crane Operator - Crane Operation',
  'Reputed employer hiring experienced overhead crane operator for a crane operation project in Dubai, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of crane operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹58K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute crane operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dubai',
  'UAE',
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
  '2026-06-13T09:09:36.903Z',
  '2026-08-19T09:09:36.903Z'
),
(
  'a3be6e41-2ea4-4715-bff8-897c74561db9',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Rigger - Crane Operation',
  'Reputed employer hiring experienced rigger for a crane operation project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of crane operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹61K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute crane operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sharjah',
  'UAE',
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
  '2026-06-12T09:09:36.903Z',
  '2026-08-20T09:09:36.903Z'
),
(
  '304b4862-8bad-48d9-825a-b16707a7c058',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Crane Signalman - Crane Operation',
  'Reputed employer hiring experienced crane signalman for a crane operation project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of crane operation experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹56K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute crane operation tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Jeddah',
  'Saudi Arabia',
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
  '2026-06-11T09:09:36.903Z',
  '2026-08-21T09:09:36.903Z'
),
(
  '798526d4-dbcc-47e9-b824-948c5f97c2e4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Delivery Driver - Delivery & Logistics',
  'Reputed employer hiring experienced delivery driver for a delivery & logistics project in Seoul, South Korea. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of delivery & logistics experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in South Korea Basic English communication',
  'Monthly salary ₹53K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute delivery & logistics tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Seoul',
  'South Korea',
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
  '2026-06-10T09:09:36.903Z',
  '2026-08-18T09:09:36.903Z'
),
(
  '83055971-73ac-442c-b0c3-5c9a9ce2d9b1',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Warehouse Supervisor - Delivery & Logistics',
  'Reputed employer hiring experienced warehouse supervisor for a delivery & logistics project in Abu Dhabi, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of delivery & logistics experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹56K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute delivery & logistics tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Abu Dhabi',
  'UAE',
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
  '2026-06-09T09:09:36.903Z',
  '2026-08-19T09:09:36.903Z'
),
(
  '47200363-c9e1-4bba-ac34-a15422b67cd0',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Forklift Operator - Delivery & Logistics',
  'Reputed employer hiring experienced forklift operator for a delivery & logistics project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of delivery & logistics experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹59K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute delivery & logistics tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Riyadh',
  'Saudi Arabia',
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
  '2026-06-08T09:09:36.903Z',
  '2026-08-20T09:09:36.903Z'
),
(
  'e765f22d-7ad5-4d84-8ccb-ee6cb70d86f9',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Logistics Coordinator - Delivery & Logistics',
  'Reputed employer hiring experienced logistics coordinator for a delivery & logistics project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of delivery & logistics experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹62K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute delivery & logistics tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dammam',
  'Saudi Arabia',
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
  '2026-06-07T09:09:36.903Z',
  '2026-08-21T09:09:36.903Z'
),
(
  'd0835b1b-ce1b-43f8-a5d0-a1ead6fd166b',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Fleet Dispatcher - Delivery & Logistics',
  'Reputed employer hiring experienced fleet dispatcher for a delivery & logistics project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of delivery & logistics experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹57K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute delivery & logistics tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Al Wakrah',
  'Qatar',
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
  '2026-06-06T09:09:36.903Z',
  '2026-08-22T09:09:36.903Z'
),
(
  '7520c0da-fe10-4d12-8dfb-02c5af0eb585',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Hotel Housekeeper - Hospitality',
  'Reputed employer hiring experienced hotel housekeeper for a hospitality project in Sharjah, UAE. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of hospitality experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UAE Basic English communication',
  'Monthly salary ₹54K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hospitality tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sharjah',
  'UAE',
  'FULL_TIME',
  'ENTRY',
  54000,
  63000,
  'INR',
  '₹54K – ₹63K',
  2,
  true,
  false,
  'ACTIVE',
  '2026-06-05T09:09:36.903Z',
  '2026-08-19T09:09:36.903Z'
),
(
  '898f2947-3ba3-4fca-b82a-0445f9ff4d59',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Room Attendant - Hospitality',
  'Reputed employer hiring experienced room attendant for a hospitality project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of hospitality experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹57K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hospitality tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Jeddah',
  'Saudi Arabia',
  'CONTRACT',
  'INTERMEDIATE',
  57137,
  66274,
  'INR',
  '₹57K – ₹66K',
  3,
  true,
  false,
  'ACTIVE',
  '2026-06-04T09:09:36.903Z',
  '2026-08-20T09:09:36.903Z'
);
