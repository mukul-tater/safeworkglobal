# Worker Module — Built vs Needed

> Based on agreed flow (GCC-only, 10th pass, E-Mitra full registration, skills upload KPI).  
> Diagrams: [worker-flow.png](./diagrams/worker-flow.png) · [worker-stages-bar.png](./diagrams/worker-stages-bar.png)

---

## Architecture note (important)

Today there are **three separate worker data paths**:

| Path | Stack | Used by |
|------|-------|---------|
| **Phase-1** | Express + SQLite (`backend/`) | `/register`, `/login`, `/home`, `/onboarding` |
| **E-Mitra** | Supabase `partner_workers` | `/emitra/workers/register` |
| **Legacy portal** | Supabase `worker_profiles` | `/worker/*` (20+ pages) |

They are **not unified**. Completing the worker module requires deciding whether Phase-1 becomes the single source of truth (with E-Mitra + legacy bridged), or Supabase remains canonical.

---

## Stage-by-stage gap analysis

### Stage ① — Registered (OTP + 10th pass + state/district)

| Item | Built | Gap |
|------|-------|-----|
| Mobile OTP signup | ✅ Phase-1 `WorkerRegisterPage` + backend OTP | — |
| Google auth | ✅ Partial (needs mobile completion after) | — |
| Full name at signup | ✅ | — |
| Email + password | ✅ Required | Consider optional email for low-literacy organic users |
| **10th pass confirmation** | ❌ | **Add field + validation (both paths)** |
| State / district at signup | ⚠️ Backend uses **placeholder defaults** on register | **Collect in Stage 1, not hardcoded** |
| Aadhaar | ⚠️ Stored as `'PENDING'` placeholder | Collect when needed (Stage 1 or 3) |
| Visible stage “Registered” | ❌ | Status exists (`REGISTERED`) but UI stages not wired |
| E-Mitra partner fills all | ⚠️ **Separate Supabase flow** | 5 steps: Personal, Job Info, Skill Screening, Migration, Photo/Video — **not linked to Phase-1 worker** |
| Worker OTP consent on E-Mitra | ❌ | Partner enters mobile; worker does not confirm on own phone yet |

---

### Stage ② — Profile complete (trade, GCC country + **city**, experience, availability)

| Item | Built | Gap |
|------|-------|-----|
| Primary skill / trade | ⚠️ Default skill on register; onboarding has secondary skills only | Primary skill must be explicit in Stage 2 |
| Experience level | ✅ Backend enum + E-Mitra | Wire in Phase-1 onboarding UI |
| **GCC country** | ⚠️ `PREFERRED_COUNTRIES` includes non-GCC | **Restrict to GCC 6 only** |
| **GCC city** | ❌ | **Add `preferred_city` (Dubai, Riyadh, Doha, etc.)** |
| Availability | ✅ Phase-1 onboarding step 3 | Move/consolidate into Stage 2 |
| Expected salary | ✅ Phase-1 onboarding | OK |
| Languages | ✅ Phase-1 onboarding | OK |
| **Browse jobs after Stage 2** | ⚠️ Public `/jobs` exists (Supabase) | **Gate browse on Phase-1 stage; filter GCC + city** |
| DOB, gender, address, pincode | ✅ Phase-1 onboarding step 1 | OK for profile |

---

### Stage ③ — Skills uploaded ⭐ (KPI: photos + videos per skill)

| Item | Built | Gap |
|------|-------|-----|
| Skill list / selection | ⚠️ Secondary skills IDs only, no media | **Core KPI missing** |
| **Photos per skill** | ❌ Phase-1 | **New upload UI + storage + API** |
| **Videos per skill** | ❌ Phase-1 | **New upload UI + storage + API** |
| Worker intro photo + video | ✅ E-Mitra step 5 (single photo/video) | Per-**skill** media not E-Mitra either |
| `WorkerVideoUpload` component | ✅ Legacy Supabase `/worker/profile` | Not in Phase-1 module |
| Job-ready unlock on skills | ❌ | **`JOB_READY` status should require ≥1 skill with media** |
| Dashboard KPI | ❌ Hardcoded zeros | Wire to real skill upload count |

---

### Stage ④ — Skill test passed (conditional)

| Item | Built | Gap |
|------|-------|-----|
| Employer skill test | ❌ | **New flow: assign test → pass/fail → retry** |
| E-Mitra “Skill Screening” | ⚠️ Operator notes + skill level only | Not a real test; partner judgment |
| Block passport until test pass | ❌ | **Business rule + UI** |

---

### Stage ⑤ — Passport & ECR (paid via E-Mitra, after test)

| Item | Built | Gap |
|------|-------|-----|
| Browse/register without passport | ⚠️ Intended but onboarding asks passport in step 2 | **Move passport to Stage 5; allow browse earlier** |
| Passport help (paid) | ❌ | **Service catalog + payment + order status** |
| ECR / ECNR capture | ⚠️ Phase-1 onboarding step 2 | OK field, wrong **stage timing** |
| Commission (hidden from worker) | ❌ | Backend pricing for partner services |
| Link to E-Mitra center | ⚠️ Partner registers worker | **Worker service request to partner** |

---

### Stage ⑥ — Travel ready (medical, training — paid)

| Item | Built | Gap |
|------|-------|-----|
| Medical service (paid) | ❌ Worker-facing | E-Mitra can offer; no worker order flow |
| Training / PDOT (paid) | ❌ | Legacy `/worker/training` is placeholder |
| Document verification | ⚠️ Legacy `/worker/documents`, `/worker/verification` | Not Phase-1 |
| Employer formalities | ✅ `/employer/formalities` (visa, medical, flight) | Worker read-only view not built |

---

### Stage ⑦ — Hired (offer → visa → flight)

| Item | Built | Gap |
|------|-------|-----|
| Job applications | ✅ Legacy Supabase `/worker/applications` | **Not Phase-1 API** |
| Apply after Stage 3 | ❌ | Gate apply on skills uploaded |
| Interviews / offers | ✅ Legacy pages | Not Phase-1 |
| Travel / visa worker view | ⚠️ Legacy `/worker/travel` | Not connected to Phase-1 |

---

## Cross-cutting features

| Feature | Built | Gap |
|---------|-------|-----|
| **Visible stages with conditions** | ⚠️ `WorkerStatus` enum in backend; `ProfileProgressCard` in legacy | **Align enum + UI to 7 stages; conditional gates** |
| **Mobile web first** | ✅ Responsive registration/onboarding | Port legacy pages or rebuild in Phase-1 |
| **Support (WhatsApp, call, E-Mitra, in-app)** | ⚠️ Contact pages exist | **In-app help links on every worker screen** |
| **Paid services** | ❌ | Passport, training, medical service module |
| **Organic vs E-Mitra unified record** | ❌ | **Critical: merge `partner_workers` ↔ Phase-1 `workers`** |
| **Registration source tracking** | ✅ `WEB` / `PARTNER` in backend entity | E-Mitra uses separate table today |

---

## What is already built (reuse)

### Phase-1 module (`src/modules/worker-registration/`)
- OTP + register + login + JWT auth
- 3-step onboarding (personal → work/docs → preferences)
- Backend CRUD for onboarding steps
- Dashboard shell + progress cards (need wiring)
- Reference data: states, districts, skills

### E-Mitra (`src/modules/emitra/`)
- Partner onboarding + approval
- **Full worker registration wizard** (closest to your spec)
- Photo + video upload to Supabase storage
- Migration readiness score
- Draft save (DB + session)
- `partner_workers` table with status pipeline

### Legacy Supabase worker portal (`src/pages/worker/`)
- Full job search, apply, applications, tracking
- Documents, verification, interviews, offers
- Contracts, travel, payments (mostly built UI)
- `WorkerVideoUpload`, job comparison, saved jobs

### Public
- `/jobs` job listings (Supabase)
- GCC in constants

---

## Recommended build order (aligned to your flow)

1. **Unify data model decision** — Phase-1 backend vs Supabase as source of truth  
2. **Stage ①** — Add 10th pass; real state/district; visible stage bar  
3. **Stage ②** — GCC-only country + city; gate browse jobs  
4. **Stage ③** — Skills with photo/video upload (KPI); unlock apply  
5. **Bridge E-Mitra** — Partner registration creates same worker record + `PARTNER` source  
6. **Stage ④–⑦** — Skill test, paid services, applications, travel (incrementally)

---

## Backend status enum — proposed alignment

Current (`backend/src/entity/Worker.ts`):

```
REGISTERED → PROFILE_INCOMPLETE → PROFILE_COMPLETED → PASSPORT_AVAILABLE →
DOCUMENTS_VERIFIED → JOB_READY → INTERVIEW_SCHEDULED → SELECTED →
VISA_PROCESSING → DEPLOYED
```

Proposed mapping to agreed stages:

| Agreed stage | Backend status |
|--------------|----------------|
| ① Registered | `REGISTERED` |
| ② Profile complete | `PROFILE_COMPLETED` |
| ③ Skills uploaded | `JOB_READY` |
| ④ Skill test passed | `SKILL_TEST_PASSED` (new) |
| ⑤ Passport ready | `PASSPORT_AVAILABLE` |
| ⑥ Travel ready | `DOCUMENTS_VERIFIED` |
| ⑦ Hired | `SELECTED` → `VISA_PROCESSING` → `DEPLOYED` |

---

## Files to reference

| Area | Path |
|------|------|
| Organic register | `src/modules/worker-registration/pages/WorkerRegisterPage.tsx` |
| Organic onboarding | `src/modules/worker-registration/pages/WorkerOnboardingPage.tsx` |
| Dashboard | `src/modules/worker-registration/pages/WorkerDashboardPage.tsx` |
| E-Mitra worker reg | `src/modules/emitra/pages/EmitraRegisterWorkerPage.tsx` |
| Backend worker | `backend/src/service/WorkerService.ts` |
| Backend onboarding | `backend/src/service/WorkerOnboardingService.ts` |
| Legacy worker nav | `src/config/workerNav.ts` |
| Phase-1 nav | `src/config/phase1WorkerNav.ts` |
