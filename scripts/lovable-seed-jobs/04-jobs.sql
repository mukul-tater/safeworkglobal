-- Jobs batch 4 (12 rows)
INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
(
  '4d8dd882-2099-4f6f-b845-3aa76ad1c00b',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Spray Painter - Painting',
  'Reputed employer hiring experienced spray painter for a painting project in Riyadh, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of painting experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹55K – ₹67K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute painting tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Riyadh',
  'Saudi Arabia',
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
  '2026-06-11T09:09:36.902Z',
  '2026-08-13T09:09:36.902Z'
),
(
  '490efba9-6979-4069-ba15-202285b281ab',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Decorative Painter - Painting',
  'Reputed employer hiring experienced decorative painter for a painting project in Dammam, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of painting experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹58K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute painting tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Dammam',
  'Saudi Arabia',
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
  '2026-06-10T09:09:36.902Z',
  '2026-08-14T09:09:36.902Z'
),
(
  'fb049994-6bdb-479d-8b49-51c83683f0dc',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Coating Specialist - Painting',
  'Reputed employer hiring experienced coating specialist for a painting project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of painting experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹61K – ₹74K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute painting tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Al Wakrah',
  'Qatar',
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
  '2026-06-09T09:09:36.903Z',
  '2026-08-15T09:09:36.903Z'
),
(
  '20220f09-240a-4ee4-9953-eae4470f48d9',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Surface Prep Technician - Painting',
  'Reputed employer hiring experienced surface prep technician for a painting project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of painting experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹56K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute painting tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Muscat',
  'Oman',
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
  '2026-06-08T09:09:36.903Z',
  '2026-08-16T09:09:36.903Z'
),
(
  '5eee8662-7265-4fbc-82f8-4ec437387ea7',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Brick Mason - Masonry',
  'Reputed employer hiring experienced brick mason for a masonry project in Jeddah, Saudi Arabia. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of masonry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Saudi Arabia Basic English communication',
  'Monthly salary ₹53K – ₹66K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute masonry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Jeddah',
  'Saudi Arabia',
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
  '2026-06-07T09:09:36.903Z',
  '2026-08-13T09:09:36.903Z'
),
(
  'b24283ce-3d83-4717-b64d-6a6bdb32b956',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Block Mason - Masonry',
  'Reputed employer hiring experienced block mason for a masonry project in Doha, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of masonry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹56K – ₹69K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute masonry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Doha',
  'Qatar',
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
  '2026-06-06T09:09:36.903Z',
  '2026-08-14T09:09:36.903Z'
),
(
  '88a461f5-948c-4553-b4fd-159938333138',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Stone Mason - Masonry',
  'Reputed employer hiring experienced stone mason for a masonry project in Kuwait City, Kuwait. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of masonry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Kuwait Basic English communication',
  'Monthly salary ₹59K – ₹73K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute masonry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Kuwait City',
  'Kuwait',
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
  '2026-06-05T09:09:36.903Z',
  '2026-08-15T09:09:36.903Z'
),
(
  'a2f528ca-86d3-4ddc-afee-a10c99af53f2',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Tile Setter - Masonry',
  'Reputed employer hiring experienced tile setter for a masonry project in Salalah, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '8+ years of masonry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹62K – ₹76K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute masonry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Salalah',
  'Oman',
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
  '2026-06-04T09:09:36.903Z',
  '2026-08-16T09:09:36.903Z'
),
(
  '693e9df5-1f16-4ad4-9c7c-21f7acf5fb8a',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Masonry Foreman - Masonry',
  'Reputed employer hiring experienced masonry foreman for a masonry project in Tokyo, Japan. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of masonry experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Japan Basic English communication',
  'Monthly salary ₹57K – ₹70K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute masonry tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Tokyo',
  'Japan',
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
  '2026-06-03T09:09:36.903Z',
  '2026-08-17T09:09:36.903Z'
),
(
  '3635beae-483f-4afd-ab7e-4ce90d65a8fa',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Steel Fixer - Steel Fixing',
  'Reputed employer hiring experienced steel fixer for a steel fixing project in Al Wakrah, Qatar. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '1–2 years of steel fixing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Qatar Basic English communication',
  'Monthly salary ₹54K – ₹68K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute steel fixing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Al Wakrah',
  'Qatar',
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
  '2026-06-02T09:09:36.903Z',
  '2026-08-14T09:09:36.903Z'
),
(
  'd2950a3e-4321-4613-8067-620117da8c89',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Rebar Installer - Steel Fixing',
  'Reputed employer hiring experienced rebar installer for a steel fixing project in Muscat, Oman. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '3–5 years of steel fixing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Oman Basic English communication',
  'Monthly salary ₹57K – ₹71K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute steel fixing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Muscat',
  'Oman',
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
  '2026-06-01T09:09:36.903Z',
  '2026-08-15T09:09:36.903Z'
),
(
  'f8964fc4-d794-402b-9c8b-2e36bf83ca38',
  (
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
),
  'Structural Steel Worker - Steel Fixing',
  'Reputed employer hiring experienced structural steel worker for a steel fixing project in Manama, Bahrain. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.',
  '5–8 years of steel fixing experience Valid passport with minimum 2 years validity Relevant trade certification (preferred) Willingness to work in Bahrain Basic English communication',
  'Monthly salary ₹60K – ₹75K Free accommodation or allowance Medical insurance Annual home leave ticket Overtime as per local labour law',
  'Execute steel fixing tasks as per site specifications Follow HSE and quality standards Coordinate with supervisors and team members Complete daily work logs and safety checks Maintain tools and work area',
  'Manama',
  'Bahrain',
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
  '2026-05-31T09:09:36.903Z',
  '2026-08-16T09:09:36.903Z'
);
