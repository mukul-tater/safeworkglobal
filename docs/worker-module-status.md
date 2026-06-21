# Worker Module — Current State & Completion Plan

> **Active priority.** Employer benefits/GCC onboarding is documented separately and deferred until this module is complete.

---



## Architecture: two worker systems

The codebase has **two parallel worker portals**:

| System | Auth | Routes | Data store | Status |
|--------|------|--------|------------|--------|
| **Phase-1 (new)** | Backend JWT (`WorkerAuthContext`) | `/register`, `/login`, `/home`, `/onboarding` | SQLite via Express API (`backend/`) | **In progress — target to complete** |
| **Legacy (Supabase)** | Supabase Auth | `/worker/*` (20+ pages) | Supabase `worker_profiles` | Built but separate stack |

Phase-1 is the direction of travel. Legacy pages can be ported or bridged once the backend API is feature-complete.

---

## Phase-1: what's done

### Registration & auth (`src/modules/worker-registration/`)

- [x] Multi-step registration with OTP (Firebase or backend mock)
- [x] Google auth hook
- [x] Login page
- [x] Worker auth context + protected routes
- [x] Reference data: states, districts, skills
- [x] Backend: register, login, OTP, profile read

### Onboarding (3 steps)

| Step | Fields |
|------|--------|
| 1 Personal | DOB, gender, email, address, pincode |
| 2 Work & Documents | Secondary skills, previous employer, passport, ECR status |
| 3 Job Preferences | Preferred countries, availability, relocation, salary, languages |

- [x] Frontend wizard (`WorkerOnboardingPage.tsx`)
- [x] Backend save step + complete (`WorkerOnboardingService`)
- [x] Profile completion % and status transitions (REGISTERED → PROFILE_COMPLETED → PASSPORT_AVAILABLE)

### Dashboard shell (`WorkerDashboardPage.tsx`)

- [x] Welcome + stat cards (placeholder zeros)
- [x] Profile progress, ECR status, document verification cards
- [x] Onboarding stepper integration
- [x] Empty states for activity and recommended jobs

---

## Phase-1: what's missing

### Portal pages (legacy exists, Phase-1 does not)

| Feature | Legacy route | Phase-1 | Notes |
|---------|--------------|---------|-------|
| Profile edit | `/worker/profile` | ❌ | Need API + UI |
| Job search / apply | `/jobs` | ❌ | Public jobs exist; worker apply not wired to backend |
| Applications | `/worker/applications` | ❌ | |
| Application tracking | `/worker/application-tracking` | ❌ | |
| Saved jobs | `/worker/saved-jobs` | ❌ | |
| Interviews | `/worker/interviews` | ❌ | |
| Offers | `/worker/offers` | ❌ | |
| Documents upload | `/worker/documents` | ❌ | Critical for GCC pipeline |
| Verification status | `/worker/verification` | ❌ | |
| Contracts / travel / payments | `/worker/contracts` etc. | ❌ | Post-hire; lower priority |
| Messaging / notifications | `/worker/messaging` | ❌ | |

### Navigation

Phase-1 nav (`phase1WorkerNav.ts`) has only **Dashboard** and **Complete Profile**. Legacy nav (`workerNav.ts`) has full 20+ item sidebar — needs gradual port.

### Backend API gaps

Current endpoints (`backend/src/app.ts`):

```
GET  /api/workers/reference-data
GET  /api/workers/districts/:stateId
POST /api/workers/otp/send|verify|verify-firebase
POST /api/workers/register|login|google-auth
GET  /api/workers/profile/:id
GET  /api/workers/onboarding
PUT  /api/workers/onboarding/step
POST /api/workers/onboarding/complete
```

**Not yet built:**

- Profile update (PUT `/workers/profile/:id`)
- Document upload + metadata
- Job applications (list, create, status)
- Saved jobs
- Offers / interviews (read + respond)
- Benefits preferences (for future employer matching)
- Sync or export to Supabase for employer Search Workers (if needed)

### Database schema gaps (`backend/src/database/schema.sql`)

Only `workers` + `worker_onboarding` tables exist. Likely need:

- `worker_documents`
- `worker_applications` (or bridge to Supabase jobs)
- `worker_saved_jobs`
- `worker_benefits_preferences` (JSON — aligns with deferred employer spec)

### Dashboard wiring

`WorkerDashboardPage` uses hardcoded zeros and empty arrays. Needs real API calls for:

- Application count
- Verified docs count
- Pending checks
- Recommended jobs (match preferred countries + skills)

### E-Mitra partner registration

Partners register workers via Emitra module (`/emitra/workers/register`) — separate from Phase-1 self-registration. May need unified worker record or sync strategy.

---

## Suggested completion order

### Milestone 1 — Core profile & portal shell

1. Expand Phase-1 nav (Profile, Job Search, Applications, Documents)
2. Profile view + edit page wired to backend
3. Wire dashboard stats to real profile/onboarding data
4. Redirect flow: register → onboarding → home (enforce incomplete onboarding)

### Milestone 2 — Job discovery & apply

1. Job browse from public `/jobs` with worker auth context
2. Apply to job (backend or Supabase bridge)
3. Applications list + detail + tracking
4. Saved jobs

### Milestone 3 — Documents & verification

1. Document upload (passport, Aadhaar, certificates, video intro)
2. Verification status page
3. ECR card wired to real doc state

### Milestone 4 — Hiring pipeline

1. Interviews (view, accept/decline)
2. Offers (view, accept/decline)
3. Notifications for status changes

### Milestone 5 — Worker benefits preferences (feeds employer matching)

1. Add benefits checklist to onboarding Step 3 (or new Step 4)
2. Required vs preferred benefits
3. Use in job recommendations and employer search filters

### Milestone 6 — Post-hire (optional / later)

Contracts, travel/visa tracking, payments, insurance — port from legacy or integrate with employer formalities module.

---

## Key files

| Purpose | Path |
|---------|------|
| Registration UI | `src/modules/worker-registration/pages/WorkerRegisterPage.tsx` |
| Onboarding UI | `src/modules/worker-registration/pages/WorkerOnboardingPage.tsx` |
| Dashboard | `src/modules/worker-registration/pages/WorkerDashboardPage.tsx` |
| API client | `src/modules/worker-registration/services/workerApi.ts` |
| Phase-1 nav | `src/config/phase1WorkerNav.ts` |
| Legacy nav (reference) | `src/config/workerNav.ts` |
| Legacy pages (port from) | `src/pages/worker/*` |
| Backend app | `backend/src/app.ts` |
| DB schema | `backend/src/database/schema.sql` |
| Onboarding service | `backend/src/service/WorkerOnboardingService.ts` |

---

## Running locally

Phase-1 requires the worker API:

```sh
npm run dev:all   # frontend + backend together
```

Without backend, OTP/register fall back to mock (`mockWorkerPortal.ts`); onboarding requires live API.

---

## Next step

Pick **Milestone 1** and start with profile edit + expanded nav, unless you want to prioritize job apply or documents first.
