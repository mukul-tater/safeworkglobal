# Lovable / implementation prompt — Full Worker GCC Journey

Copy from **Mission** downward into Lovable (or use as the Cursor build brief).

---

## Mission

Turn the existing `/worker/journey` (`worker_verification`) flow into the production **12-stage GCC journey**. Reuse the current wizard — **no new wizard**, no stage renames beyond adding **`pdot`** and **`deployment`**. Pilot interview/payment waive stays **dev/preview only**.

**Stages:** Register → Basics → Test 1 → Skill proof → KYC → Interview (admin-scheduled, interviewer-decided) → Payment ₹35,400 → Trade test + Medical → Bond (print + courier) → PDOT training → GCC ready → Deployment checklist.

**Rules (locked):**
- Worker pays Razorpay **₹35,400**; interviewer never pays
- Admin schedules interview **and assigns interviewer**
- Interviewer Approved → payment unlocks **automatically**
- Not approved → **re-interview** allowed
- Test 1 fail → **retry allowed** (no cap yet)
- GCC ready only after **bond received + PDOT completed**
- Full **Aadhaar number** stored; no preferred GCC countries on basics
- Bond = download sample → print → sign → **courier** + tracking number

**Entry:** organic `QuickWorkerSignup` and partner/eMitra create both land on `/worker/journey` (partner prefills only). Verified mobile never forces `/worker/bind-mobile` again.

---

## Implementation order (run in sequence)

### Phase 1 — Database foundation (one migration set)

Requires human approval of the migration SQL before apply.

- **`worker_verification`:** interview schedule/assignment mirror fields; bond (`bond_template_version`, `bond_courier_tracking`, `bond_received_at`); `pdot_status` + provider/batch/completion/proof; trade-test + medical schedule fields (`*_scheduled_at`, `*_place`, `*_instructions`); `kyc_status` / `kyc_verified_at` mirrors if useful; deployment checklist columns (offer, contract, emigration/PoE, visa, insurance, ticket, deployed).
- **`worker_verification_interviews`:** `interviewer_user_id`, `decision`, `decision_reason`, `attempt_no`; keep reschedule history as separate rows.
- **`worker_profiles`:** add `aadhaar_number` (full, admin-readable) alongside existing PAN/passport / `aadhaar_last4` (keep last4 if useful for display).
- **Quiz CMS:** `region` on `worker_skill_quiz_items`; new `skill_quiz_configs` (`skill_code`, nullable `region`, `questions_to_show`, `selection_mode`, `selected_ids`).
- **`bond_templates`:** sample PDF URL + version + courier address/instructions.
- Add **`interviewer`** to `app_role`; RLS so interviewers read/update **only assigned** interviews and read assigned worker summary.
- Extend **`guard_worker_verification_update`** so workers can never self-set `kyc_verified`, interview decision, payment, `bond_received`, `pdot_completed`, `gcc_ready`. Prefer **SECURITY DEFINER RPCs** for interviewer approve and admin privileged actions (interviewer is not full admin).
- Each new public table: **GRANTs before RLS policies**. Migrations in `supabase/migrations/` with descriptive names.

### Phase 2 — Services + shared constants

- `src/modules/worker-verification/constants.ts` — stages/nav steps gain `pdot` and `deployment`; labels updated; `ASSESSMENT_FEE_INR = 35400`.
- `verificationService.ts` — `verifyKyc`, `scheduleInterview`, `recordInterviewDecision` (approved → `awaiting_payment` immediately; rejected → reschedulable), `scheduleTradeTest`, `scheduleMedical`, `submitBondTracking`, `markBondReceived`, `setPdotPlan`, `markPdotCompleted` (**sets `gcc_ready` only if bond received**), deployment checklist setters, quiz-config-aware question loader.
- `types.ts` + `src/integrations/supabase/types.ts` extended.

### Phase 3 — Admin

- New **Quiz CMS** page: question CRUD (EN + HI + image/YouTube + region + active); per-skill(+region) config for count + explicit selection; worker preview.
- Extend **`AdminVerificationQueue`**: KYC review (gates scheduling); schedule/reschedule interview + assign interviewer; schedule trade test + medical; bond (upload sample, mark received); PDOT (link/batch, mark completed → GCC ready); deployment checklist.
- Admin nav entries for Quiz CMS and journey scheduling.

### Phase 4 — Interviewer portal

- Interviewer login route (reuse auth); simple dedicated layout.
- Queue of **assigned** interviews only; worker summary (profile, quiz score, skill proof); **Approved / Not approved** + reason.

### Phase 5 — Worker journey UI (`WorkerVerificationPage`)

Per-stage: Basics (no preferred countries; DOB, experience, passport status, emergency contact, face photo) · Test 1 bilingual from CMS + retry · Skill proof quotas · KYC full Aadhaar + waiting · Interview schedule or “waiting to be scheduled” · Payment only when unlocked (existing Razorpay) · Trade/medical read-only schedules · Bond download + courier address + tracking + waiting · PDOT explanation, optional proof, waiting · GCC ready celebration → deployment status. Sidebar + `?journey=` stay in sync. Split into step components under `components/steps/` if the page is too large.

### Phase 6 — Public + partner

- Rewrite `WorkerJourneyDemo` + `SignupJourneyPanel` to the canonical 12 stages; drop “verbal screening / document-first” copy.
- Partner/eMitra create seeds `worker_verification` essentials (skill/state); “Registered via partner” banner; verified mobile never triggers bind-mobile again.

---

## Reuse (do not rewrite from scratch)

- `src/modules/worker-verification/pages/WorkerVerificationPage.tsx`
- `src/modules/worker-verification/services/verificationService.ts`
- `src/modules/worker-verification/constants.ts`
- `src/modules/worker-verification/types.ts`
- `src/modules/worker-verification/lib/razorpayCheckout.ts`
- `src/pages/admin/AdminVerificationQueue.tsx`
- `src/pages/admin/AdminTradeTestAllocations.tsx`
- `src/components/SignupJourneyPanel.tsx`
- `src/components/WorkerJourneyDemo.tsx`
- `src/modules/worker-registration/hooks/useWorkerGccJourneyProgress.ts`
- `src/pages/worker/QuickWorkerSignup.tsx`
- `src/modules/emitra/pages/EmitraOnboardWorkerPage.tsx`
- `src/modules/worker-registration/lib/createVerifiedWorkerAccount.ts`
- `supabase/migrations/20260731120000_guard_worker_verification_privileges.sql` (extend)

---

## Non-goals

- No WebRTC (Zoom/Meet link only)
- No eSign (print + courier bond)
- Do not reintroduce legacy `WorkerOnboarding.tsx` before Test 1
- No hard Test 1 attempt cap yet

---

## Delivery / verification

Run phases **in order**. After each phase: TypeScript check (`tsc` / project typecheck). Playwright is optional if not already in the repo — prefer smoke-testing affected routes manually or add Playwright only if the project already supports it. **Phase 1 migration requires explicit human approval before apply.**

## Acceptance checklist

- [ ] Homepage + signup panel + sidebar match stages including PDOT + deployment
- [ ] Organic + partner reach journey without second bind-mobile when verified
- [ ] Admin quiz CMS skill + region; worker EN+HI; retries work
- [ ] Full Aadhaar; admin KYC verify gates interview schedule
- [ ] Admin schedules interview + assigns interviewer; worker sees date/time/link
- [ ] Interviewer approve → payment auto-enabled; reject → re-interview
- [ ] Worker pays ₹35,400 via Razorpay
- [ ] Admin schedules trade + medical; worker sees date/time/place
- [ ] Bond sample + courier + tracking; admin marks received
- [ ] PDOT completed after bond → `gcc_ready`
- [ ] Deployment checklist after GCC ready
- [ ] Pilot waive remains dev/preview only
- [ ] Workers cannot self-set privileged fields (guard + RPCs)
