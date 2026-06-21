## Goal

Move all three role portals (Worker, Employer, E-Mitra Partner) to a unified flow: public marketing pages with no sidebar → Google or email sign-in/sign-up → role dashboard → optional profile completion → role-specific actions. Wipe demo jobs/applications. Add E-Mitra reward & 3-stage skill-test scaffolding.

---

## 1. Public layout (pre-login)

- Remove the role sidebar from public landing pages: Worker landing (`/worker`-ish landing currently showing "Worker Portal" sidebar), Employer landing ("Hire Workers" page), Partner landing ("Become a SafeWork Partner" page).
- New public layout: top nav + hero + CTAs only. Two clear CTAs on every role landing: **"Continue with Google"** and **"Sign up with email"** (plus "Sign in" link).
- Sidebar (role nav) renders only inside `/<role>/dashboard/*` after auth.
- Keep the existing dark theme + design tokens. No new visual identity.

## 2. Auth flow (all three roles)

- Single auth entry per role, both methods enabled:
  - Google (via existing `lovable.auth.signInWithOAuth("google")`) — on first sign-in, `handle_new_user` creates `profiles` row, then we call `assign_initial_role(<role>)` from the client based on which landing page they came from.
  - Email/password — same flow, role passed via `raw_user_meta_data.role`.
- On success → redirect to `/worker/dashboard`, `/employer/dashboard`, or `/partner/dashboard`.
- Profile-completion banners (dismissible) inside the dashboard, **not** blocking gates.

## 3. Minimum-to-act gating

| Role | Minimum required before main action |
|------|-------------------------------------|
| Worker | full name + mobile + 10th-pass confirmed + state + **primary skill** → can browse & apply |
| Employer | company name + your name + work email + **company country** → can post a job |
| Partner | full name + mobile + E-Mitra centre name + state → can submit worker applications (after admin approval) |

Everything else (passport, address, education detail, skills media, banking, documents) is optional but nudged via progress card.

## 4. Worker module

- Profile fields: full name, mobile, address, state, district, DOB, gender, education (10th-pass mandatory), passport (yes/no + number if yes), ECR, languages, expected salary, GCC country/city preference, availability.
- **Primary skill + secondary skills**, each skill needs at least one photo or video for "verified skill" badge (already partially exists — wire into onboarding step 3).
- After basic-min fields complete: unlock jobs list and apply button.
- Pre-selection education banners (10th-pass requirement, "FREE to register/browse/apply", ₹35,400 only after selection + interview) stay on the worker landing page.

## 5. Employer module

- Quick signup → dashboard → "Post a job" available immediately after the 4 min fields.
- Profile completion (industry, size, address, KYC docs) nudged, not blocking.
- Employer sees only workers who applied to their jobs (existing rule).

## 6. E-Mitra Partner module

- Quick signup → "Pending admin approval" dashboard state.
- After admin approval (existing flow): can register workers (organic worker schema, `registration_source = 'PARTNER'`, linked to `partner_profile_id`).
- New: **3-stage skill-test tracker** per partner-registered worker:
  1. Partner local test (partner marks pass/fail with notes)
  2. SafeWork phone interview (admin/ops marks)
  3. Physical test (admin marks) — gated on ₹35,400 fee marked "received" by admin
- New: **Placement reward** — ₹1,000 default, configurable in `partner_reward_config` table; credited via existing `partner_incentives` when worker status → `placed`. Update existing trigger to read amount from config table.

## 7. Data wipe (now)

- Delete ALL rows from: `jobs`, `job_skills`, `job_applications`, `application_status_history`, `saved_jobs`, `interviews`, `offers`, `job_formalities`, `shortlisted_workers`, `saved_searches`.
- **Keep** all auth users, profiles, worker_profiles, employer_profiles, partner_profiles, worker_skills, reference data (skills/states/countries seed).
- (Removing other non-listed users is **not** done per your answer — only jobs/applications wiped.)

## 8. Out of scope (for this pass)

- Real payment gateway for ₹35,400 / ₹1,000 (admin-marked only).
- Actual skill-test scoring engine.
- Mobile (React Native) app changes — web only.
- Renaming / merging Phase-1 SQLite backend with Supabase (still two stacks; Supabase remains source of truth for this flow).

---

## Technical details

### DB migrations
1. Wipe SQL on jobs + application-related tables.
2. New table `partner_reward_config` (single row, amount numeric, updated_at).
3. New table `partner_worker_skill_tests` (worker_id, stage enum partner|phone|physical, status, notes, fee_paid bool, created_by, timestamps) + RLS for partner read-own / admin all.
4. Update `handle_partner_worker_status_change` to read `placed` reward from `partner_reward_config` instead of hardcoded 750.
5. Add `tenth_pass_confirmed boolean` + `primary_skill text` to `worker_profiles` if missing.
6. Add `country` to `employer_profiles` already exists — verify.

### Frontend
- New `src/layouts/PublicRoleLayout.tsx` (top nav + footer, no sidebar). Apply to `/worker`, `/employer`, `/partner` landing routes.
- Existing `EmitraLayout`, worker portal layout, employer layout: only mount inside authenticated routes.
- Replace landing pages' sidebar with hero + dual-CTA (Google + email).
- New `src/pages/auth/RoleAuth.tsx` (one component, role param) used by `/worker/auth`, `/employer/auth`, `/partner/auth` — Google button + email form, role inferred from path.
- Dashboard gating helper `useCanAct(role)` returns booleans for browse/apply/post-job/register-worker; dashboards show progress card with deep-links to remaining fields.
- Partner dashboard: add "Skill tests" section per worker with 3 cards (partner / phone / physical).
- Admin: new `/admin/partner-rewards` page to edit `partner_reward_config` and mark fees received.

### Files removed/repurposed
- `src/pages/worker/QuickWorkerSignup.tsx` → folded into new `RoleAuth`.
- Sidebar nav configs (`phase1WorkerNav.ts`, `emitraNav.ts`, employer nav) gated to authenticated routes only.

---

## Open questions (please confirm)

1. Should the worker landing keep the long educational panel (10th-pass / FREE / ₹35,400) or move it behind a "Learn more" expander to keep the hero focused?
2. For Google sign-up, if the user picks the wrong landing page (e.g. signs in via Worker but already has Employer role), should we (a) reject with a message, (b) auto-redirect to existing role dashboard, or (c) allow multi-role on same auth user?
3. The Phase-1 SQLite backend (`backend/`) currently powers `/register`, `/login`, `/home`, `/onboarding`. Confirm we are **deprecating** that path and routing all new worker auth through Supabase — or do you want to keep Phase-1 for organic workers?

Once you confirm (or say "just proceed with sensible defaults"), I'll execute in this order: DB migration → wipe data → public layout + auth pages → dashboard gating → partner skill-test UI → admin reward config.
