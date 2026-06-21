-- Jobs batch 2 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '574f18c1-faff-422c-b576-69962591825a',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Pipeline Welder - Welding',
  'Reputed employer hiring experienced pipeline welder for a welding project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of welding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹58K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute welding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-07T09:09:36.902Z',
  '2026-08-09T09:09:36.902Z'
),
(
  '724dfbca-06dc-444a-8002-8f6e5fcfc29f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Structural Welder - Welding',
  'Reputed employer hiring experienced structural welder for a welding project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of welding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹61K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute welding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-06T09:09:36.902Z',
  '2026-08-10T09:09:36.902Z'
),
(
  '449c7562-87a8-40e6-a4a3-68605d2670e6',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Fabrication Welder - Welding',
  'Reputed employer hiring experienced fabrication welder for a welding project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of welding experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹56K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute welding tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-05T09:09:36.902Z',
  '2026-08-11T09:09:36.902Z'
),
(
  '27dafd8b-c77f-40f2-b88a-50a1e6a9bd96',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Master Plumber - Plumbing',
  'Reputed employer hiring experienced master plumber for a plumbing project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of plumbing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹53K – ₹61K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute plumbing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-04T09:09:36.902Z',
  '2026-08-08T09:09:36.902Z'
),
(
  'b0e041cc-4345-479a-a5e4-9897f84400e5',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Pipefitter - Plumbing',
  'Reputed employer hiring experienced pipefitter for a plumbing project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of plumbing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹56K – ₹64K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute plumbing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-03T09:09:36.902Z',
  '2026-08-09T09:09:36.902Z'
),
(
  '8ad84940-dd1c-4366-af87-5be2ce8d1b34',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'HVAC Plumber - Plumbing',
  'Reputed employer hiring experienced hvac plumber for a plumbing project in Osaka, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of plumbing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹59K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute plumbing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-02T09:09:36.902Z',
  '2026-08-10T09:09:36.902Z'
),
(
  '7e02b495-a07a-4749-acdf-805bdc46897a',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Service Plumber - Plumbing',
  'Reputed employer hiring experienced service plumber for a plumbing project in Berlin, Germany. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of plumbing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Germany Basic English communication',
  'Monthly salary ₹62K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute plumbing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-06-01T09:09:36.902Z',
  '2026-08-11T09:09:36.902Z'
),
(
  'd896a403-5da2-4361-99a6-14efad265785',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Industrial Plumber - Plumbing',
  'Reputed employer hiring experienced industrial plumber for a plumbing project in Toronto, Canada. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of plumbing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Canada Basic English communication',
  'Monthly salary ₹57K – ₹65K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute plumbing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
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
  '2026-05-31T09:09:36.902Z',
  '2026-08-12T09:09:36.902Z'
),
(
  '31f777db-ab87-455a-8047-e2c7d09f4356',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'HVAC Technician - HVAC',
  'Reputed employer hiring experienced hvac technician for a hvac project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of hvac experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹54K – ₹63K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hvac tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Tokyo',
  'Japan',
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
  '2026-05-30T09:09:36.902Z',
  '2026-08-09T09:09:36.902Z'
),
(
  'f9ec5ace-2b15-4b37-bbb2-920edb109b8f',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'AC Technician - HVAC',
  'Reputed employer hiring experienced ac technician for a hvac project in Singapore, Singapore. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of hvac experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Singapore Basic English communication',
  'Monthly salary ₹57K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hvac tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Singapore',
  'Singapore',
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
  '2026-05-29T09:09:36.902Z',
  '2026-08-10T09:09:36.902Z'
),
(
  'eea6d86f-8bd9-46d0-8168-00efc5db7bd3',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Chiller Operator - HVAC',
  'Reputed employer hiring experienced chiller operator for a hvac project in Sydney, Australia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of hvac experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Australia Basic English communication',
  'Monthly salary ₹60K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hvac tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Sydney',
  'Australia',
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
  '2026-05-28T09:09:36.902Z',
  '2026-08-11T09:09:36.902Z'
),
(
  '925f6025-4179-4bc1-8666-614501b32a06',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Ducting Specialist - HVAC',
  'Reputed employer hiring experienced ducting specialist for a hvac project in London, UK. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of hvac experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in UK Basic English communication',
  'Monthly salary ₹63K – ₹73K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute hvac tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'London',
  'UK',
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
  '2026-05-27T09:09:36.902Z',
  '2026-08-12T09:09:36.902Z'
);
