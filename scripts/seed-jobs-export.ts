/**
 * Generate Lovable-ready SQL to seed 5+ jobs per category (distinct cities each).
 *
 * Usage:
 *   npx tsx scripts/seed-jobs-export.ts
 *   npx tsx scripts/seed-jobs-export.ts <employer-user-uuid>   # optional fixed employer
 *
 * Output:
 *   scripts/lovable-seed-jobs/README.md
 *   scripts/lovable-seed-jobs/00-setup.sql
 *   scripts/lovable-seed-jobs/01-jobs.sql … 08-jobs.sql
 *   scripts/lovable-seed-jobs/09-skills.sql … 14-skills.sql
 */
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { buildAllJobSeeds } from '../src/data/jobSeedCatalog';

const OUT_DIR = 'scripts/lovable-seed-jobs';
const employerIdArg = process.argv[2];

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''").replace(/\s+/g, ' ').trim();
}

function employerExpr(): string {
  if (employerIdArg) return `'${employerIdArg}'`;
  // Match SeedService: prefer employer-role user with employer_profiles row
  return `(
  SELECT ep.user_id
  FROM employer_profiles ep
  INNER JOIN user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
  ORDER BY ep.created_at
  LIMIT 1
)`;
}

const { jobs, skills } = buildAllJobSeeds(employerIdArg ?? '00000000-0000-0000-0000-000000000001');
const jobIds = jobs.map(() => randomUUID());
const employerExprSql = employerExpr();

const jobRows = jobs.map((job, index) => {
  const id = jobIds[index];
  return `(
  '${id}',
  ${employerExprSql},
  '${sqlEscape(job.title)}',
  '${sqlEscape(job.description)}',
  '${sqlEscape(job.requirements)}',
  '${sqlEscape(job.benefits)}',
  '${sqlEscape(job.responsibilities)}',
  '${sqlEscape(job.location)}',
  '${sqlEscape(job.country)}',
  '${job.job_type}',
  '${job.experience_level}',
  ${job.salary_min},
  ${job.salary_max},
  '${job.currency}',
  '${sqlEscape(job.salary_display)}',
  ${job.openings},
  ${job.visa_sponsorship},
  ${job.remote_allowed},
  '${job.status}',
  '${job.posted_at}',
  '${job.expires_at}'
)`;
});

const skillRows: string[] = [];
for (const skill of skills) {
  const categoryJobs = jobs
    .map((job, idx) => ({ job, idx }))
    .filter(({ job }) => job.category === skill.category);
  const target = categoryJobs[skill.jobIndex];
  if (!target) continue;
  skillRows.push(`('${randomUUID()}', '${jobIds[target.idx]}', '${sqlEscape(skill.skill_name)}')`);
}

mkdirSync(OUT_DIR, { recursive: true });

const setupSql = `-- SafeWorkGlobal: employer preflight (run first)
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
`;

writeFileSync(`${OUT_DIR}/00-setup.sql`, setupSql);

const jobInsertHeader = `INSERT INTO jobs (
  id, employer_id, title, description, requirements, benefits, responsibilities,
  location, country, job_type, experience_level, salary_min, salary_max, currency,
  salary_display, openings, visa_sponsorship, remote_allowed, status, posted_at, expires_at
) VALUES
`;

const jobBatchSize = 12;
let jobPart = 1;
for (let i = 0; i < jobRows.length; i += jobBatchSize) {
  const chunk = jobRows.slice(i, i + jobBatchSize);
  const sql = `-- Jobs batch ${jobPart} (${chunk.length} rows)\n${jobInsertHeader}${chunk.join(',\n')};\n`;
  writeFileSync(`${OUT_DIR}/${String(jobPart).padStart(2, '0')}-jobs.sql`, sql);
  jobPart++;
}

const skillInsertHeader = 'INSERT INTO job_skills (id, job_id, skill_name) VALUES\n';
const skillBatchSize = 60;
let skillPart = 1;
for (let i = 0; i < skillRows.length; i += skillBatchSize) {
  const chunk = skillRows.slice(i, i + skillBatchSize);
  const fileNum = String(jobPart - 1 + skillPart).padStart(2, '0');
  const sql = `-- Skills batch ${skillPart} (${chunk.length} rows)\n${skillInsertHeader}${chunk.join(',\n')};\n`;
  writeFileSync(`${OUT_DIR}/${fileNum}-skills.sql`, sql);
  skillPart++;
}

const verifySql = `-- Verification: expect 24 categories, each with count >= 5 and distinct_cities >= 5
SELECT
  regexp_replace(title, '^.* - ', '') AS category,
  COUNT(*) AS job_count,
  COUNT(DISTINCT location) AS distinct_cities,
  string_agg(DISTINCT location, ', ' ORDER BY location) AS cities
FROM jobs
WHERE status = 'ACTIVE'
  AND title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$'
GROUP BY 1
ORDER BY 1;
`;

writeFileSync(`${OUT_DIR}/99-verify.sql`, verifySql);

const jobFileCount = Math.ceil(jobRows.length / jobBatchSize);
const skillFileCount = Math.ceil(skillRows.length / skillBatchSize);
const firstSkillFile = jobFileCount + 1;
const lastSkillFile = jobFileCount + skillFileCount;

const readme = `# Lovable job seed scripts

Seeds **120 active jobs** — **5 per category** across **24 trade categories**, each in a **different city** (Dubai, Riyadh, Doha, Tokyo, Singapore, etc.).

## Important: alignment with in-app seed (\`/seed-data\`)

| | In-app \`SeedService\` | Lovable SQL scripts |
|--|------------------------|---------------------|
| Job data | \`jobSeedCatalog.ts\` | **Same** (generated from same file) |
| Category | Title suffix \` - Welding\` etc. | **Same** |
| Employer | \`employer@safeworkglobal.demo\` or employer-role user | **Employer-role user only** |
| Idempotent | Skips categories that already have 5+ jobs | **No** — re-run duplicates unless you delete first |
| RLS | Uses Supabase client (employer must match \`auth.uid()\`) | Bypasses RLS (SQL editor / MCP) |

### Your Lovable DB right now (checked via MCP)

- **2 profiles** — both \`admin\` role (kailash, mukul)
- **1 employer_profiles** row on **admin** kailash (from old setup script — **wrong**)
- **0 jobs**

Jobs seeded under an **admin** account will show on public \`/jobs\`, but **no one can manage them** in \`/employer/manage-jobs\` (requires \`employer\` role).

**Before running job SQL:**

1. Create an employer account (\`/employer/quick-signup\`) **or** run \`/seed-data\` to create \`employer@safeworkglobal.demo\`
2. Run \`00-setup.sql\` — must show \`OK: employer found\`
3. Then run job + skills files

Or pin a known employer UUID when regenerating:

\`\`\`bash
npx tsx scripts/seed-jobs-export.ts YOUR-EMPLOYER-USER-UUID
\`\`\`

## How to run on Lovable

1. Open your project → **Database** → SQL editor (or ask Lovable: *"run this SQL file"*).
2. Run files **in order** (copy-paste each file):

| Order | File | What it does |
|-------|------|----------------|
| 1 | \`00-setup.sql\` | Creates employer profile if missing |
| 2 | \`01-jobs.sql\` … \`${String(jobFileCount).padStart(2, '0')}-jobs.sql\` | Inserts 120 jobs |
| 3 | \`${String(firstSkillFile).padStart(2, '0')}-skills.sql\` … \`${String(lastSkillFile).padStart(2, '0')}-skills.sql\` | Inserts job skills |
| 4 | \`99-verify.sql\` | Confirms 5+ jobs & 5 cities per category |

3. **Re-run safe:** If seed jobs already exist, delete them first (see below) or skip — setup uses \`ON CONFLICT DO NOTHING\`.

### Clear existing seed jobs (optional)

\`\`\`sql
DELETE FROM job_skills WHERE job_id IN (
  SELECT id FROM jobs
  WHERE title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$'
);
DELETE FROM jobs
WHERE title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$';
\`\`\`

## Regenerate SQL (local)

\`\`\`bash
npm run seed:jobs:sql
# Or pin a specific employer profile UUID:
npx tsx scripts/seed-jobs-export.ts YOUR-PROFILE-UUID
\`\`\`

## Categories (5 jobs each, different cities)

Construction, Electrical, Welding, Plumbing, HVAC, Manufacturing, Carpentry, Painting, Masonry, Steel Fixing, Scaffolding, Heavy Equipment Operation, Crane Operation, Delivery & Logistics, Hospitality, Healthcare, IT & Technology, Engineering, Security, Cleaning & Maintenance, Food & Beverage, Agriculture, Oil & Gas, Mining

## Alternative: in-app seed

Log in as employer → \`/seed-data\` → **Seed Demo Data**.
`;

writeFileSync(`${OUT_DIR}/README.md`, readme);

console.log(`Generated Lovable seed SQL in ${OUT_DIR}/`);
console.log(`  ${jobs.length} jobs, ${skillRows.length} skills, ${new Set(jobs.map((j) => j.category)).size} categories`);
console.log(`  Run 00-setup.sql first, then 01-jobs.sql through skills files, then 99-verify.sql`);
