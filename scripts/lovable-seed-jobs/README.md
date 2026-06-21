# Lovable job seed scripts

Seeds **120 active jobs** — **5 per category** across **24 trade categories**, each in a **different city** (Dubai, Riyadh, Doha, Tokyo, Singapore, etc.).

## Important: alignment with in-app seed (`/seed-data`)

| | In-app `SeedService` | Lovable SQL scripts |
|--|------------------------|---------------------|
| Job data | `jobSeedCatalog.ts` | **Same** (generated from same file) |
| Category | Title suffix ` - Welding` etc. | **Same** |
| Employer | `employer@safeworkglobal.demo` or employer-role user | **Employer-role user only** |
| Idempotent | Skips categories that already have 5+ jobs | **No** — re-run duplicates unless you delete first |
| RLS | Uses Supabase client (employer must match `auth.uid()`) | Bypasses RLS (SQL editor / MCP) |

### Your Lovable DB right now (checked via MCP)

- **2 profiles** — both `admin` role (kailash, mukul)
- **1 employer_profiles** row on **admin** kailash (from old setup script — **wrong**)
- **0 jobs**

Jobs seeded under an **admin** account will show on public `/jobs`, but **no one can manage them** in `/employer/manage-jobs` (requires `employer` role).

**Before running job SQL:**

1. Create an employer account (`/employer/quick-signup`) **or** run `/seed-data` to create `employer@safeworkglobal.demo`
2. Run `00-setup.sql` — must show `OK: employer found`
3. Then run job + skills files

Or pin a known employer UUID when regenerating:

```bash
npx tsx scripts/seed-jobs-export.ts YOUR-EMPLOYER-USER-UUID
```

## How to run on Lovable

1. Open your project → **Database** → SQL editor (or ask Lovable: *"run this SQL file"*).
2. Run files **in order** (copy-paste each file):

| Order | File | What it does |
|-------|------|----------------|
| 1 | `00-setup.sql` | Creates employer profile if missing |
| 2 | `01-jobs.sql` … `10-jobs.sql` | Inserts 120 jobs |
| 3 | `11-skills.sql` … `15-skills.sql` | Inserts job skills |
| 4 | `99-verify.sql` | Confirms 5+ jobs & 5 cities per category |

3. **Re-run safe:** If seed jobs already exist, delete them first (see below) or skip — setup uses `ON CONFLICT DO NOTHING`.

### Clear existing seed jobs (optional)

```sql
DELETE FROM job_skills WHERE job_id IN (
  SELECT id FROM jobs
  WHERE title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$'
);
DELETE FROM jobs
WHERE title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$';
```

## Regenerate SQL (local)

```bash
npm run seed:jobs:sql
# Or pin a specific employer profile UUID:
npx tsx scripts/seed-jobs-export.ts YOUR-PROFILE-UUID
```

## Categories (5 jobs each, different cities)

Construction, Electrical, Welding, Plumbing, HVAC, Manufacturing, Carpentry, Painting, Masonry, Steel Fixing, Scaffolding, Heavy Equipment Operation, Crane Operation, Delivery & Logistics, Hospitality, Healthcare, IT & Technology, Engineering, Security, Cleaning & Maintenance, Food & Beverage, Agriculture, Oil & Gas, Mining

## Alternative: in-app seed

Log in as employer → `/seed-data` → **Seed Demo Data**.
