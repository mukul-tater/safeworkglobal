-- SafeWorkGlobal: employer preflight (run first)
-- Aligns with in-app SeedService (/seed-data) — jobs must belong to an employer-role user.

-- 1) Check who can own seed jobs (need role = employer + employer_profiles row)
SELECT
  p.id AS user_id,
  p.email,
  ur.role,
  ep.company_name,
  CASE
    WHEN ur.role = 'employer' AND ep.user_id IS NOT NULL THEN 'ready'
    WHEN ur.role = 'employer' AND ep.user_id IS NULL THEN 'needs employer_profiles row'
    ELSE 'not an employer'
  END AS seed_status
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN employer_profiles ep ON ep.user_id = p.id
ORDER BY p.created_at;

-- 2) Create employer_profiles for employer-role users missing one (same as SeedService)
INSERT INTO employer_profiles (user_id, company_name, industry, company_size)
SELECT p.id, 'Gulf Workforce Partners', 'Construction & Infrastructure', '100-500'
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'employer'
WHERE NOT EXISTS (
  SELECT 1 FROM employer_profiles ep WHERE ep.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3) Stop if no employer is ready (job inserts will fail with NULL employer_id)
SELECT CASE
  WHEN EXISTS (
    SELECT 1
    FROM employer_profiles ep
    INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ) THEN 'OK: employer found — continue with 01-jobs.sql'
  ELSE 'BLOCKED: no employer-role user. Sign up at /employer/quick-signup OR run seed-data for demo accounts first.'
END AS next_step;
