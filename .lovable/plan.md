## 1. Fix `/emitra/register` Step 6 error

**Symptom:** "Cannot modify sensitive identity, bank, status, or incentive fields."

**Cause:** Trigger `trg_prevent_partner_sensitive_field_changes` (migration `20260621194350`) blocks ANY update to identity/bank/status fields by the partner. The wizard submits all collected fields on every step save, including these.

**Fix:** Replace the trigger logic so it allows the **first write** of each sensitive field (when OLD value is NULL) and only blocks changes once the field has been set. Status/approval/incentive fields stay locked. Single migration.

## 2. Worker Journey Tracker (horizontal timeline, screenshot-2 style)

New shared component `src/components/worker/WorkerJourneyTimeline.tsx` rendering 7 stages horizontally:

```text
Registered → Profile → Skills → Skill Test → Passport → Travel Ready → Hired
   ●━━━━━━━━━●━━━━━━━━●━━━━━━━●━━━━━━━━━━●━━━━━━━━━━●━━━━━━━━━━━━●
 Completed  Completed Completed Pending    —          —            —
 22/06/26   22/06/26  23/06/26  ...
```

- Green filled node + connector for completed stages, muted for pending.
- Each node shows: stage label, status badge (Completed / Pending / In Progress / Skipped), timestamp.
- Horizontally scrollable on mobile.
- Stage data derived from `worker_profiles`, `worker_skills`, `worker_documents`, `job_applications` (already exist — no schema changes).

**Used on:** `WorkerDashboard.tsx` only (per your scope). Not on eMitra register page.

## 3. Remove hardcoded ₹83 FX

- Delete every `* 83`, `/ 83`, `INR_PER_*` constant in the codebase.
- Job listings, salary cards, employer post-job preview, worker discover, application detail → show **native currency only** (e.g. `AED 3,000 / month`).
- Add a small helper `src/lib/currency.ts` with `formatNative(amount, code)` and a TODO-stub `convertToINR()` that returns `null` until a real FX feed is wired (so callers can render "INR approx —" or hide).
- New table `fx_rates` (currency_code, inr_per_unit, updated_at, source) reserved for future admin-managed rates — created empty, no UI yet. (Per your "live FX (future)" choice — schema ready, no fake numbers shown today.)
- Update the Core memory rule that says "convert non-INR using factor of 83".

## 4. Seed data — officials-demo set

New script `scripts/seed-officials-demo.mjs` + admin button on existing `/seed-data` page:

- **100 workers** across 8 Indian states (Rajasthan, UP, Bihar, Kerala, TN, Punjab, Odisha, WB), realistic Hindi/regional names, mixed skills, varying journey-stage completion (so the new timeline shows variety).
- **20 employers** across 6 GCC countries + Singapore + Malaysia, GST/CIN populated, verified mix.
- **30 live jobs** in native currencies (AED, SAR, QAR, KWD, OMR, BHD, SGD, MYR), 50/50 ECR/ECNR.
- **5 eMitra partners** (Jaipur, Lucknow, Patna, Kochi, Chennai), 3 approved + 1 pending + 1 rejected.
- **~80 applications** spread across all statuses, **~15 HIRED** workers triggering reward_transactions auto-credit so the partner wallet and admin analytics show real numbers.
- Idempotent reset button that wipes only seeded rows (tagged via `created_by_seed=true` metadata or a known email prefix `demo+`).

## 5. Out of scope (per your message)

- No payment-gateway escrow integration.
- No live FX API call now — schema only.

## Files

**New:** `supabase/migrations/<ts>_partner_trigger_fix_and_fx_rates.sql`, `src/components/worker/WorkerJourneyTimeline.tsx`, `src/lib/currency.ts`, `scripts/seed-officials-demo.mjs`.

**Edited:** `src/pages/worker/WorkerDashboard.tsx`, every file that uses `* 83` (jobSalaryUtils, JobDetail, Jobs, WorkerDiscover, employer post-job, etc. — ripgrep will enumerate), `src/pages/SeedData.tsx`, `src/components/SeedDataButton.tsx`, plus the `mem://` core rule update.

Approve and I'll build all four in order: trigger fix → currency cleanup → timeline component → seed script.