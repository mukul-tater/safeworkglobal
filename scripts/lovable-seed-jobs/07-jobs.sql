-- Jobs batch 7 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '23301a40-72fd-4b05-81f6-26bd35ab0a2f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Kitchen Helper - Hospitality',
  'Reputed employer hiring experienced kitchen helper for a hospitality project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of hospitality experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹60K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hospitality tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Doha',
  'Qatar',
  'FULL_TIME',
  'SENIOR',
  60274,
  69548,
  'INR',
  '₹60K – ₹70K',
  4,
  true,
  false,
  'ACTIVE',
  '2026-06-03T09:09:36.903Z',
  '2026-08-21T09:09:36.903Z'
),
(
  '58b5e0fe-6a67-4f7d-9413-face37c8b465',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Bell Captain - Hospitality',
  'Reputed employer hiring experienced bell captain for a hospitality project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of hospitality experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹63K – ₹73K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hospitality tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Kuwait City',
  'Kuwait',
  'CONTRACT',
  'EXPERT',
  63411,
  72822,
  'INR',
  '₹63K – ₹73K',
  5,
  true,
  false,
  'ACTIVE',
  '2026-06-02T09:09:36.903Z',
  '2026-08-22T09:09:36.903Z'
),
(
  'fe39e385-e163-4113-b707-a7daa057ff53',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Laundry Supervisor - Hospitality',
  'Reputed employer hiring experienced laundry supervisor for a hospitality project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of hospitality experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹58K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hospitality tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Salalah',
  'Oman',
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
  '2026-06-01T09:09:36.903Z',
  '2026-08-23T09:09:36.903Z'
),
(
  'ed2b38be-b052-4a97-b1f0-7c4303f5e648',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Healthcare Assistant - Healthcare',
  'Reputed employer hiring experienced healthcare assistant for a healthcare project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of healthcare experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹50K – ₹60K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute healthcare tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dammam',
  'Saudi Arabia',
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
  '2026-05-31T09:09:36.903Z',
  '2026-08-20T09:09:36.903Z'
),
(
  '374eeeb9-15d5-4b53-b351-f1748bcb67be',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Ward Attendant - Healthcare',
  'Reputed employer hiring experienced ward attendant for a healthcare project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of healthcare experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹53K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute healthcare tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Al Wakrah',
  'Qatar',
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
  '2026-05-30T09:09:36.903Z',
  '2026-08-21T09:09:36.903Z'
),
(
  '98c0e5a7-c6f0-44ec-b845-10b36bb91805',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Patient Care Aide - Healthcare',
  'Reputed employer hiring experienced patient care aide for a healthcare project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of healthcare experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹56K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute healthcare tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Muscat',
  'Oman',
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
  '2026-05-29T09:09:36.903Z',
  '2026-08-22T09:09:36.903Z'
),
(
  '28df3edd-b1ae-483d-a2b6-cc17205e76ef',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Medical Equipment Technician - Healthcare',
  'Reputed employer hiring experienced medical equipment technician for a healthcare project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of healthcare experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹59K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute healthcare tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Manama',
  'Bahrain',
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
  '2026-05-28T09:09:36.903Z',
  '2026-08-23T09:09:36.903Z'
),
(
  'defdb390-136b-4308-a76c-bff5ad7895a4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Hospital Porter - Healthcare',
  'Reputed employer hiring experienced hospital porter for a healthcare project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of healthcare experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹54K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute healthcare tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Osaka',
  'Japan',
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
  '2026-05-27T09:09:36.903Z',
  '2026-08-24T09:09:36.903Z'
),
(
  '5a9ef03f-301a-4e47-b6b7-5720eb93eac4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Data Center Technician - IT & Technology',
  'Reputed employer hiring experienced data center technician for a it & technology project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of it & technology experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹51K – ₹62K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute it & technology tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Kuwait City',
  'Kuwait',
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
  '2026-05-26T09:09:36.903Z',
  '2026-08-21T09:09:36.903Z'
),
(
  'ea49c81e-f09b-448a-a984-356fd7a6b18a',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Network Cable Installer - IT & Technology',
  'Reputed employer hiring experienced network cable installer for a it & technology project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of it & technology experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹54K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute it & technology tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Salalah',
  'Oman',
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
  '2026-05-25T09:09:36.903Z',
  '2026-08-22T09:09:36.903Z'
),
(
  'cbb78844-f64d-4c50-82de-bae1ddd10bd4',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'IT Support Assistant - IT & Technology',
  'Reputed employer hiring experienced it support assistant for a it & technology project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of it & technology experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹57K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute it & technology tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Tokyo',
  'Japan',
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
  '2026-05-24T09:09:36.903Z',
  '2026-08-23T09:09:36.903Z'
),
(
  '52cad9c3-5966-4275-982a-e4a97a496acb',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Hardware Technician - IT & Technology',
  'Reputed employer hiring experienced hardware technician for a it & technology project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of it & technology experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹60K – ₹72K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute it & technology tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Singapore',
  'Singapore',
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
  '2026-05-23T09:09:36.903Z',
  '2026-08-24T09:09:36.903Z'
);
