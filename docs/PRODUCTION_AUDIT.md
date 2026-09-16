# SafeWorkGlobal Production Audit

**Date:** 16 September 2026  
**Scope:** Full repository at `/Users/kailash/Code/freelance/safeworkglobal` (web `src/`, mobile, Express `backend/`, Supabase migrations and edge functions, CI/config).  
**Method:** Static review of enforcement layers (RLS, SECURITY DEFINER RPCs, edge functions, Express middleware). UI behavior was not treated as a security control. No application code was modified. No live penetration test was run against `safeworkglobal.com`.  
**Live-ops reminder:** production `razorpay-assessment` was last verified (21 Aug 2026) to still use Razorpay **test** keys (`rzp_test_…`). Swap to `rzp_live_…` before charging real customers.

---

## Executive Summary

SafeWorkGlobal is a Vite/React SPA on Lovable + Supabase (Auth, PostgREST, Storage, Edge Functions), with a React Native app sharing the same project, and a legacy Express/SQLite worker API used mainly in local/dev. Server-side authorization is **mostly** the right model: roles live in `user_roles`, privileged GCC/payment fields are trigger-guarded, Razorpay order amounts are set server-side, and `complete_assessment_payment_razorpay` is granted only to `service_role`.

The product is **not ready to take real payments or treat the worker journey as a trusted compliance gate**. Several controls that look solid in the UI are not enforced, or are enforced incorrectly, at the database/API layer.

**Highest-confidence production blockers:**

1. A worker can skip the paid GCC journey by writing `worker_verification.stage = 'bond'` (trigger allow-list includes `bond`).
2. A captured Razorpay payment can be reused on a second account via `verify_payment` / `recover_payment` when no order is bound to the row.
3. `purge-storage` can wipe KYC/media buckets with only the public anon JWT.
4. `seed_demo_users` is still granted to `authenticated` and can insert `admin` into `user_roles`.
5. Phone-verified account RPCs create **email-confirmed** Auth users without verifying Firebase OTP on the server.
6. Production Razorpay is still on test keys if live charges are intended.

Several “pilot waive” RPCs remain granted to every authenticated user, but the latest verification trigger **no longer honors** `app.verification_guard_bypass`. Those RPCs likely fail closed today — they are still a landmine and must be revoked. The same trigger change likely **breaks interviewer scoring** for non-admin interviewers.

**Launch decision:** **BLOCKED** for paid GCC journey / real money. Marketing/content pages could be served, but worker payment, identity, and storage integrity are not production-safe.

---

## P0 Critical Issues

### AUD-P0-01

* **Severity:** P0  
* **Category:** Authorization / business logic / payment  
* **Title:** Workers can skip payment, interview, trade test, and medical by setting stage to `bond`  
* **Exact file/path:** `supabase/migrations/20260827180000_change_journey_job.sql` (`guard_worker_verification_update`); `supabase/migrations/20260802090749_cf43964c-4b04-46c6-bb97-dbeb2da350c3.sql` (`Workers update own verification`)  
* **Exact function/component/route:** `guard_worker_verification_update()`; PostgREST `PATCH /rest/v1/worker_verification?user_id=eq.<self>`  
* **What is wrong:** The update trigger allows workers/partners to change `stage` to any of `essentials | find_jobs | apply_job | quiz | media | identity | awaiting_interview | bond`. `bond` is after payment in the product. Privileged *fields* (`payment_status`, Razorpay IDs, pass/fail) are blocked, but **stage itself is not limited to forward-one-step or to unpaid-safe stages**. `gcc_ready` is blocked separately; `awaiting_payment` / `trade_test` / `medical` are not in the allow-list, but `bond` is.  
* **Why it matters:** The ₹35,400 assessment fee and the interview/medical/trade-test gates are not actually required to reach bond submission.  
* **Attack/Failure scenario:** Authenticated worker at `essentials` or `awaiting_payment` runs `UPDATE worker_verification SET stage = 'bond' WHERE user_id = auth.uid()`. RLS allows own-row UPDATE. Trigger allows `bond`. Worker then calls `worker_submit_bond_tracking` and sits in the admin GCC-ready queue unpaid.  
* **Recommended fix:** Remove `bond` (and `awaiting_interview` if interview must be staff-gated) from `allowed_worker_stages`. Allow only the current stage plus explicitly documented self-service next stages. Enforce `payment_status = 'paid'` in `worker_submit_bond_tracking` and in any admin GCC-ready RPC.  
* **Blocks production:** Yes  
* **How to test the fix:** As a worker JWT, `PATCH` stage to `bond` from `essentials` — must 400/exception. Repeat from `awaiting_payment`. Confirm legitimate UI transitions (essentials → find_jobs, identity → awaiting_interview if still intended) still succeed. Confirm paid path to trade/medical still works via Razorpay `service_role` completion.

### AUD-P0-02

* **Severity:** P0  
* **Category:** Razorpay / payment verification / IDOR  
* **Title:** Captured Razorpay payments can be bound to a different worker  
* **Exact file/path:** `supabase/functions/razorpay-assessment/index.ts`  
* **Exact function/component/route:** `action === "verify_payment"` (approx. lines 250–297); `action === "recover_payment"` (approx. lines 300–341); RPC `complete_assessment_payment_razorpay`  
* **What is wrong:**  
  1. `verify_payment` only rejects a mismatched order if `row.razorpay_order_id` is already set. A worker with a null order can submit **any** `order_id` + `payment_id`. If signature is omitted/wrong, the function falls back to `GET /v1/payments/{id}` and only checks that Razorpay says the payment is settled for *that submitted* order — not that the order belongs to this user.  
  2. `recover_payment` skips the order-ownership check when `targetOrder` is empty (`if (targetOrder && payment.order_id !== targetOrder)`).  
  3. Completion amount comes from the current job fee, not `payment.amount`.  
  4. There is no unique constraint on `razorpay_payment_id` / provider reference across `worker_assessment_payments` or `worker_verification`.  
* **Why it matters:** One real capture can unlock many journeys. Frontend payment status is irrelevant; this is the server enforcement gap.  
* **Attack/Failure scenario:** Attacker pays once on account A, copies `pay_…` from Checkout / network / `worker_verification`. Creates account B, reaches `awaiting_payment` **without** calling `create_order`. `POST /functions/v1/razorpay-assessment` with `{ action: "recover_payment", razorpay_payment_id: "pay_…" }` as B. B is marked paid. Repeat for account C.  
* **Recommended fix:** Always require `row.razorpay_order_id` to equal the verified order; reject recover/verify if the row has no bound order. Fetch the Razorpay payment **and** order; require `notes.user_id === payerId`, `order_id` match, `amount` (paise) === stored `payment_amount * 100`, status `captured`. Add `UNIQUE (razorpay_payment_id)` (or equivalent) and reject reuse. Prefer constant-time signature compare; do not treat missing signature as equivalent to a successful HMAC.  
* **Blocks production:** Yes  
* **How to test the fix:** Two test accounts. Pay on A. As B with no `razorpay_order_id`, call `recover_payment` with A’s `pay_id` — must 400. As B after `create_order`, call `verify_payment` with A’s order/payment — must 400. Replay A’s own `verify_payment` — must return `already_paid` once. Underpay / amount mismatch — must 400.

### AUD-P0-03

* **Severity:** P0  
* **Category:** API security / catastrophic data loss  
* **Title:** `purge-storage` deletes all media with no application auth  
* **Exact file/path:** `supabase/functions/purge-storage/index.ts`  
* **Exact function/component/route:** default export `Deno.serve`; not listed in `supabase/config.toml` (platform default JWT gate only)  
* **What is wrong:** Handler uses `SUPABASE_SERVICE_ROLE_KEY` and recursively deletes `avatars`, `worker-documents`, `worker-videos`, `partner-documents`, `partner-worker-media`, `assessment-evidence`. There is no admin check, cron secret, or allow-listed caller. The public anon key in `src/integrations/supabase/client.ts` is a valid JWT, so gateway `verify_jwt` does **not** protect this.  
* **Why it matters:** One unauthenticated HTTP call can destroy KYC, videos, and assessment evidence.  
* **Attack/Failure scenario:** `POST https://<project>.supabase.co/functions/v1/purge-storage` with `Authorization: Bearer <anon key from the JS bundle>`.  
* **Recommended fix:** Delete the function from production, or require a high-entropy `PURGE_SECRET` header **and** admin JWT, and never deploy it to the production project. Confirm in the Supabase dashboard that it is not deployed.  
* **Blocks production:** Yes, if the function is deployed (treat as deployed until proven otherwise).  
* **How to test the fix:** Call the function URL with anon JWT — must 401/404. Call with user JWT — must 401. Only a break-glass secret from a controlled operator session should succeed, if the function is kept at all.

### AUD-P0-04

* **Severity:** P0  
* **Category:** Authentication / privilege escalation  
* **Title:** `seed_demo_users` is executable by any logged-in user and can grant `admin`  
* **Exact file/path:** `supabase/migrations/20260423034437_dc43b201-d039-4bae-887e-f3181f5d2859.sql` (function body); `supabase/migrations/20260624191018_d7b85414-4a3c-4300-abe3-db2f733078b1.sql` (`GRANT EXECUTE … TO authenticated`)  
* **Exact function/component/route:** `public.seed_demo_users(jsonb)`  
* **What is wrong:** SECURITY DEFINER inserts into `auth.users` (email already confirmed) and `user_roles` with `v_role::app_role` with **no allow-list**. Latest grant is to `authenticated`. Earlier revokes were undone.  
* **Why it matters:** Privilege escalation to admin from any worker/employer/partner session.  
* **Attack/Failure scenario:** `POST /rest/v1/rpc/seed_demo_users` with `p_users: [{ "email": "evil@x.com", "password": "Passw0rd", "role": "admin", "full_name": "x" }]`. Sign in as that email.  
* **Recommended fix:** `REVOKE EXECUTE ON FUNCTION public.seed_demo_users FROM PUBLIC, anon, authenticated;` Grant only to `service_role` or drop the function in production. If seeding is needed, require existing admin and forbid `admin` in `p_users`.  
* **Blocks production:** Yes  
* **How to test the fix:** As a worker JWT, RPC must 401/42501. Confirm types/cache no longer advertise it to clients if dropped.

### AUD-P0-05

* **Severity:** P0  
* **Category:** Authentication  
* **Title:** Unauthenticated RPCs create email-confirmed worker and partner accounts without server OTP  
* **Exact file/path:** `supabase/migrations/20260823120000_create_phone_verified_worker_account.sql`; `supabase/migrations/20260823050000_create_phone_verified_partner_account.sql`; `supabase/migrations/20260823040000_confirm_phone_verified_partner_signup.sql`  
* **Exact function/component/route:** `create_phone_verified_worker_account` (granted `anon, authenticated`); `create_phone_verified_partner_account` (granted `anon, authenticated`); trigger `confirm_mobile_verified_auth_user` on `auth.users`  
* **What is wrong:** Comments say Firebase OTP already succeeded **on the client**. SQL never sees an ID token. It inserts `auth.users` with `email_confirmed_at = now()` and `raw_user_meta_data.mobile_verified = true`. The BEFORE INSERT trigger also auto-confirms **any** signup whose metadata contains `mobile_verified: true`. Passwords may be 6 alphanumeric characters (explicitly to bypass HaveIBeenPwned). Partner signup assigns `role=partner` via `handle_new_user`.  
* **Why it matters:** Phone OTP is the product’s identity gate. Attackers can mass-create confirmed workers/partners, squat real mobile numbers (`already registered`), and skip email confirmation.  
* **Attack/Failure scenario:** Anon `rpc('create_phone_verified_partner_account', { p_email, p_password, p_full_name, p_phone })` then `signInWithPassword`. Or `supabase.auth.signUp({ options: { data: { mobile_verified: true, role: 'partner' }}})`.  
* **Recommended fix:** Move account creation into `worker-otp-login`-style edge functions that verify the Firebase ID token server-side. Revoke `anon`/`authenticated` execute on both RPCs. Drop or rewrite `confirm_mobile_verified_auth_user` so metadata cannot confirm email.  
* **Blocks production:** Yes  
* **How to test the fix:** Anon RPC without a verified token must fail. After a real Firebase token, creation succeeds once. `signUp` with `mobile_verified: true` must **not** set `email_confirmed_at` unless the project’s Auth settings independently confirm.

### AUD-P0-06

* **Severity:** P0 (for live charges)  
* **Category:** Razorpay / production configuration  
* **Title:** Production still configured with Razorpay test keys  
* **Exact file/path:** `supabase/functions/razorpay-assessment/index.ts` (reads `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`); workspace verification 21 Aug 2026 for `safeworkglobal.com`  
* **Exact function/component/route:** Edge function `razorpay-assessment`; Checkout `key_id` returned by `create_order`  
* **What is wrong:** Live site is on `rzp_test_…`. Checkout shows TEST MODE. Settlements are not real.  
* **Why it matters:** Customers cannot actually pay; or operators may believe they can. Mixing test captures with a later live-key switch also breaks recover/verify.  
* **Attack/Failure scenario:** Operational: go-live with test banner; or after switching keys, old `order_id`s cannot be verified.  
* **Recommended fix:** Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` on the production function to `rzp_live_…`. Never put the secret in `VITE_`. Confirm Checkout has no TEST MODE banner. Rotate test vs live webhook secrets independently once webhooks exist.  
* **Blocks production:** Yes if collecting real money  
* **How to test the fix:** `create_order` returns `rzp_live_`. Checkout has no TEST MODE. One live ₹1/full-fee sandbox-off payment captures and unlocks the journey.

---

## P1 High Issues

### AUD-P1-01

* **Severity:** P1  
* **Category:** Payment / business logic  
* **Title:** Assessment fee is not checked against the Razorpay capture amount; job can be switched to a cheaper listing  
* **Exact file/path:** `supabase/functions/razorpay-assessment/index.ts` (`resolveAssessmentFee`, `completePayment`); `supabase/migrations/20260827180000_change_journey_job.sql`; `supabase/migrations/20260913190000_job_service_charge.sql`  
* **Exact function/component/route:** `create_order` / `verify_payment`; `change_journey_job`; `jobs.service_charge` (admin-set, min ₹1)  
* **What is wrong:** Amount is recomputed from the current `journey_job_id` at verify time and passed into the completion RPC. Razorpay `payment.amount` is ignored. `change_journey_job` is allowed until `gcc_ready`. Constraint allows `service_charge >= 1`.  
* **Why it matters:** Revenue bypass if any ACTIVE job has a low admin fee, or if an order was created at one fee and the job changed before verify (create_order recovery uses *current* fee).  
* **Attack/Failure scenario:** Complete interview on a ₹35,400 job, `change_journey_job` to a ₹1 listing, then `create_order` / pay ₹1, journey unlocks.  
* **Recommended fix:** Freeze `payment_amount` on first `create_order`. Forbid `change_journey_job` once `stage = awaiting_payment` or once `razorpay_order_id` is set. Verify Razorpay amount == frozen paise.  
* **Blocks production:** Should fix before launch if multiple `service_charge` values exist  
* **How to test the fix:** Bind a high-fee order, switch job, verify — must reject. Create order on low-fee job — charges that fee only if product intends it.

### AUD-P1-02

* **Severity:** P1  
* **Category:** Razorpay webhook / reliability  
* **Title:** No Razorpay webhook; activation depends on the browser callback  
* **Exact file/path:** no webhook function under `supabase/functions/`; `src/modules/worker-verification/services/verificationService.ts` (`payAssessmentFeeWithRazorpay`, `syncAssessmentPaymentAfterCheckout`, comment on `markPaymentPaid`)  
* **Exact function/component/route:** Checkout `handler` → `verify_payment`; fallback `recover_payment`  
* **What is wrong:** If the tab closes after capture, activation relies on the worker clicking “Already paid? Sync” and on recover logic (which is currently unsafe — AUD-P0-02). No `X-Razorpay-Signature` verification, no `RAZORPAY_WEBHOOK_SECRET`, no event idempotency table.  
* **Why it matters:** Paid users stuck; support marks paid by hand (`markPaymentPaid` is admin-only at RLS, but operationally painful).  
* **Attack/Failure scenario:** Capture succeeds, `verify_payment` never runs. Worker is unpaid in DB. Attacker cannot fake HMAC without the secret (good), but the business fails closed for honest users.  
* **Recommended fix:** Add `razorpay-webhook` with `verify_jwt = false`, HMAC of raw body with webhook secret, persist `event.id` uniquely, call the same completion RPC.  
* **Blocks production:** Strongly recommended before real money; can be accepted briefly if recover is hardened and support playbook exists  
* **How to test the fix:** Capture with webhook enabled, kill the browser before verify — webhook still marks paid. Replay same event — 200 no double insert.

### AUD-P1-03

* **Severity:** P1  
* **Category:** Authorization / payment (latent)  
* **Title:** Pilot waive RPCs still granted to every authenticated user  
* **Exact file/path:** `supabase/migrations/20260731130000_p0_profiles_apply_pilot_payment.sql`; `supabase/migrations/20260803120000_waive_interview_accept_identity.sql`; client `src/modules/worker-verification/services/verificationService.ts` (`waiveAssessmentPaymentPilot`, `waiveAssessmentInterviewPilot`); UI hide `src/modules/worker-verification/constants.ts` `isJourneyResetEnabled()`  
* **Exact function/component/route:** `waive_assessment_payment_pilot()`; `waive_assessment_interview_pilot()`  
* **What is wrong:** UI hides shortcuts on `safeworkglobal.com`, but PostgREST still exposes the RPCs. They set `app.verification_guard_bypass` then UPDATE privileged fields. **Latest** `guard_worker_verification_update` (`20260827180000_…`) **ignores that GUC** and will likely throw for a normal JWT (`auth.uid()` is not null and not admin). So this is probably fail-closed today, but GRANT remains. Restoring bypass (needed to fix interviewers — AUD-P1-04) would immediately re-enable free payment/interview skip.  
* **Why it matters:** Payment and interview integrity.  
* **Attack/Failure scenario:** Today: RPC errors. After a naive bypass restore: worker calls RPC → `payment_status=paid` / `stage=awaiting_payment` with fake score 80.  
* **Recommended fix:** `REVOKE EXECUTE` from `authenticated`/`anon`. Optionally `DROP FUNCTION` in prod. Do not restore bypass globally without role checks inside the trigger (`service_role` / admin / named RPCs only).  
* **Blocks production:** Revoke before launch even if currently broken  
* **How to test the fix:** Worker JWT RPC must be 42501. Admin/service completion via Razorpay still works.

### AUD-P1-04

* **Severity:** P1  
* **Category:** Reliability / authorization  
* **Title:** Interviewer decisions (and other bypass-based RPCs) likely fail after the guard change  
* **Exact file/path:** `supabase/migrations/20260820080219_73c2ea61-6351-4731-91dd-1a4479b7e0f0.sql` (`interviewer_record_decision`); `supabase/migrations/20260827180000_change_journey_job.sql` (guard)  
* **Exact function/component/route:** `interviewer_record_decision`  
* **What is wrong:** Function is SECURITY DEFINER, checks assignment, sets bypass, updates `worker_verification` (score, stage `awaiting_payment`). Trigger no longer honors bypass. Caller is the interviewer, so `is_subject` is false → `Not allowed to update another worker verification row`. Admins still pass `is_admin`. `complete_assessment_payment_razorpay` still works because the edge function uses **service_role** (`auth.uid()` IS NULL).  
* **Why it matters:** Staff interview path may be dead except for admins.  
* **Attack/Failure scenario:** Failure: assigned interviewer cannot progress workers.  
* **Recommended fix:** In the trigger, allow bypass only when `current_user`/`session_user` is the function owner **and** a dedicated `SET LOCAL` flag is set from allow-listed RPCs; or perform interviewer updates as a table-owner operation that sets `auth.uid()` null via `SET LOCAL ROLE`. Add a regression test.  
* **Blocks production:** If interviewers (non-admin) are in the launch path  
* **How to test the fix:** Non-admin interviewer assigned to a row can approve → worker enters `awaiting_payment`. Unassigned interviewer cannot.

### AUD-P1-05

* **Severity:** P1  
* **Category:** Authorization / RBAC  
* **Title:** Any roleless user can self-assign `interviewer`  
* **Exact file/path:** `supabase/migrations/20260605191552_842c5b01-d718-4f8d-b0af-ea5494108d5b.sql`; `src/contexts/AuthContext.tsx` `assignRole`; enum `supabase/migrations/20260803121000_add_interviewer_app_role.sql`  
* **Exact function/component/route:** `assign_initial_role(_role app_role)` — blocks only `admin`  
* **What is wrong:** Client only prevents choosing admin. RPC allows `interviewer`. Combined with AUD-P1-04, this is currently limited; once interviewer RPC works, this is privilege escalation.  
* **Why it matters:** Interviewers can pass/fail journeys.  
* **Attack/Failure scenario:** New Google user with no role: `rpc('assign_initial_role', { _role: 'interviewer' })`.  
* **Recommended fix:** Allow only `worker | employer | partner`. Interviewer granted solely by existing admin SQL/`user_roles` insert.  
* **Blocks production:** Should fix before launch  
* **How to test the fix:** Roleless JWT with `_role: 'interviewer'` must exception. `worker` still works.

### AUD-P1-06

* **Severity:** P1  
* **Category:** Authentication  
* **Title:** Users can set `profiles.mobile_verified` (and partner `mobile_verified`) themselves  
* **Exact file/path:** `supabase/migrations/20260731130000_p0_profiles_apply_pilot_payment.sql` (`Users can update own profile` — no column guard); `supabase/migrations/20260826100258_32e3a966-9f8f-4370-a7a5-0b7a2391f311.sql` (`partner_profile_self_update_allowed` includes `'mobile_verified'`)  
* **Exact function/component/route:** `PATCH /rest/v1/profiles`; partner profile UPDATE policy  
* **What is wrong:** Bind-mobile UI is client-gated (`ProtectedRoute` + `isMobileVerified`). The column is writable. Combined with AUD-P0-05 metadata confirm, OTP can be skipped end-to-end.  
* **Why it matters:** Phone possession is a security control for this product.  
* **Attack/Failure scenario:** `UPDATE profiles SET mobile_verified = true WHERE id = auth.uid()`.  
* **Recommended fix:** Trigger: only SECURITY DEFINER OTP confirmation may set `mobile_verified` true. Remove it from partner editable columns.  
* **Blocks production:** Should fix before launch  
* **How to test the fix:** Direct UPDATE must leave the flag false / error. OTP bind path still sets true.

### AUD-P1-07

* **Severity:** P1  
* **Category:** API security / abuse  
* **Title:** `send-notification` lets any logged-in user email arbitrary addresses with unsanitized HTML  
* **Exact file/path:** `supabase/functions/send-notification/index.ts`; `supabase/config.toml` `verify_jwt = false` (in-function JWT only)  
* **Exact function/component/route:** `POST /functions/v1/send-notification`  
* **What is wrong:** Auth required, but no role/relationship check. `recipientEmail` is attacker-controlled. Templates interpolate `name`, `data.*`, `dashboardUrl`, `meetingLink` into HTML. If `RESEND_API_KEY` is set, this is a spam/phishing relay. If not set, the response includes full `emailContent`.  
* **Why it matters:** Brand abuse, phishing, HTML injection in mail clients.  
* **Attack/Failure scenario:** Authenticated worker posts `{ type: "offer_received", recipientEmail: "victim@…", recipientName: "<img>", data: { offerUrl: "https://evil" } }`.  
* **Recommended fix:** Restrict to service_role or admin; or derive recipient from DB (application/offer id) and escape HTML. Never echo email HTML to clients.  
* **Blocks production:** If Resend is enabled; otherwise P2 information leak  
* **How to test the fix:** Worker JWT to a stranger’s email must 403. Application-status path still emails the real applicant.

### AUD-P1-08

* **Severity:** P1  
* **Category:** API security / abuse  
* **Title:** `contact-enquiry` is unauthenticated and unthrottled  
* **Exact file/path:** `supabase/functions/contact-enquiry/index.ts`; `supabase/config.toml`  
* **Exact function/component/route:** public POST  
* **What is wrong:** `verify_jwt = false`, length caps only, no CAPTCHA/rate limit. Sends mail via shared helper; `replyTo` is attacker email.  
* **Why it matters:** Inbox flooding / cost.  
* **Attack/Failure scenario:** Scripted POSTs with rotating `submissionId`.  
* **Recommended fix:** IP + email rate limit (Redis/DB), honeypot, or Turnstile.  
* **Blocks production:** No if email volume is acceptable; fix soon  
* **How to test the fix:** 30 POSTs/minute from one IP — later ones 429.

### AUD-P1-09

* **Severity:** P1  
* **Category:** Session management  
* **Title:** Partner kiosk parks access + refresh tokens in `sessionStorage`  
* **Exact file/path:** `src/modules/partner/lib/partnerAssistedWorker.ts` (`parkPartnerSession`, `swg_parked_partner_session`, `swg_parked_worker_resume`, 30 min TTL)  
* **Exact function/component/route:** partner add-worker / continue-as-worker  
* **What is wrong:** Switching the browser session to the worker stores both sessions in `sessionStorage`. Shared kiosk, XSS, or an abandoned tab yields worker **and** partner takeover. Attributed kiosk via `partner_manages_worker` does not need this.  
* **Why it matters:** Full account takeover.  
* **Attack/Failure scenario:** Internet-cafe kiosk; next user opens DevTools Application → sessionStorage.  
* **Recommended fix:** Prefer stay-as-partner + `worker_user_id` on Razorpay/quiz (already supported). If switch is required, use one-time server-side codes, not refresh tokens, and force logout on idle.  
* **Blocks production:** For unattended partner kiosks  
* **How to test the fix:** Add-worker flow never writes refresh tokens to web storage.

### AUD-P1-10

* **Severity:** P1  
* **Category:** Secrets / OTP  
* **Title:** Edge OTP login honors `OTP_DEV_BYPASS` / `dev-otp:` if mis-set in production  
* **Exact file/path:** `supabase/functions/worker-otp-login/index.ts` (`allowDevOtpBypass`)  
* **Exact function/component/route:** `POST /functions/v1/worker-otp-login`  
* **What is wrong:** Client `src/lib/otpConfig.ts` correctly forces Firebase on production hosts. The **edge function** independently enables bypass when `OTP_DEV_BYPASS=true|1` **or** `SUPABASE_URL` looks like localhost. A production secret left on unlocks session minting with `idToken: "dev-otp:…"`. Firebase ID token verification itself is implemented (phone match) — good.  
* **Why it matters:** Full worker account takeover for any phone in `profiles`.  
* **Attack/Failure scenario:** If bypass is on: POST `{ mobile, idToken: "dev-otp:x" }` → magic-link session.  
* **Recommended fix:** Never set `OTP_DEV_BYPASS` on the production project. Fail closed unless `SUPABASE_URL` is localhost **and** a second explicit flag. Log and metric bypass uses.  
* **Blocks production:** Verify secret is unset; then residual risk is P2  
* **How to test the fix:** Production function with `dev-otp:` must 401. Real Firebase token for that mobile still logs in.

### AUD-P1-11

* **Severity:** P1  
* **Category:** Authentication / IDOR (conditional on deploy)  
* **Title:** Legacy Express API: unauthenticated profile IDOR and Google email trust  
* **Exact file/path:** `backend/src/app.ts`; `backend/src/service/WorkerService.ts` (`getProfile`, `googleAuth`); `backend/src/middleware/uploadMiddleware.ts`  
* **Exact function/component/route:** `GET /api/workers/profile/:id` (no `authMiddleware`); `POST /api/workers/google-auth`; static `/uploads`  
* **What is wrong:** `getProfile` returns aadhaar, email, mobile for any numeric id. `googleAuth` issues a 7-day JWT if the posted email matches a row — **no Google/Firebase/Supabase token verification**. Contrast: `supabase/functions/worker-portal` verifies JWT email. Uploads are world-readable. Production Lovable host does not proxy `/api` (`vite.config.ts` proxy is dev-only); this is P0 **if** `VITE_WORKER_API_URL` or a public `:3001` is live. `WorkerAuthProvider` is still mounted in `src/App.tsx`.  
* **Why it matters:** PII scrape + account takeover of the Phase-1 worker table.  
* **Attack/Failure scenario:** If API is public: `GET /api/workers/profile/1`; `POST /api/workers/google-auth { email: "victim@…" }`.  
* **Recommended fix:** Do not deploy Express to the internet. If kept, require auth on getProfile, verify Google ID token, disable static `/uploads`, add helmet + rate limits.  
* **Blocks production:** Only if the API is reachable from the internet  
* **How to test the fix:** Production `safeworkglobal.com/api/health` should 404. If a worker API host exists, unauthenticated profile GET must 401; google-auth without a verified ID token must 401.

### AUD-P1-12

* **Severity:** P1  
* **Category:** Data privacy / assessment integrity  
* **Title:** Confirm quiz answer keys are not readable via PostgREST  
* **Exact file/path:** `supabase/migrations/20260820160607_e287375f-69ba-4fa8-b84c-9bcaa18f3ab1.sql` (dropped `"Anyone authenticated reads quiz items"`; `get_worker_quiz_items` omits `correct_option` / `expected_answer`); `supabase/migrations/20260913180000_basic_trade_knowledge_mcq.sql`  
* **Exact function/component/route:** `get_worker_quiz_items`; table `worker_skill_quiz_items`  
* **What is wrong:** Design is correct **if** no later policy restored table SELECT. This must be verified on the live `pg_policies`. Admin FOR ALL remains.  
* **Why it matters:** If SELECT leaked back, every worker could 100% the trade quiz.  
* **Attack/Failure scenario:** `GET /rest/v1/worker_skill_quiz_items?select=id,correct_option`.  
* **Recommended fix:** Confirm zero SELECT policies for `authenticated` except via RPC. Add a CI check.  
* **Blocks production:** If live policy is open; otherwise verify-only  
* **How to test the fix:** Worker JWT select of `correct_option` returns empty/42501. RPC still returns options without the key.

### AUD-P1-13

* **Severity:** P1  
* **Category:** File upload / client  
* **Title:** One-year signed URLs and `getPublicUrl` on a private video bucket  
* **Exact file/path:** `src/modules/worker-verification/services/verificationService.ts` (`createSignedUrl(path, 31536000)`); `src/pages/worker/WorkerDocuments.tsx`; `src/components/worker/WorkerVideoUpload.tsx` (`getPublicUrl`); `mobile/src/screens/worker/WorkerDocumentsScreen.tsx` (`getPublicUrl` on `worker-documents`)  
* **Exact function/component/route:** KYC/document preview; worker videos  
* **What is wrong:** Private buckets (`20260731150000_p2_privacy_discovery.sql`) plus public URL helpers = broken UX or accidental public objects. 1-year signed URLs are shareable bearer links for KYC.  
* **Why it matters:** Document leakage if URLs leak into logs/chat.  
* **Attack/Failure scenario:** Worker forwards a signed KYC URL; it works for 365 days.  
* **Recommended fix:** Signed URL TTL 60–3600s. Mobile must use `createSignedUrl`. Video playback via signed URLs only.  
* **Blocks production:** Should fix for KYC  
* **How to test the fix:** Expired short TTL 403. Mobile document open works with a signed URL.

---

## P2 Medium Issues

### AUD-P2-01

* **Severity:** P2  
* **Category:** Razorpay  
* **Title:** `authorized` treated as settled  
* **Exact file/path:** `supabase/functions/razorpay-assessment/index.ts` `isSettled()`  
* **What is wrong:** `captured || authorized`. Authorization can later fail to capture.  
* **Recommended fix:** Require `captured` only (or capture via API before complete).  
* **Blocks production:** No if all Checkout methods auto-capture  
* **How to test the fix:** Mock `authorized` payment — must not advance stage.

### AUD-P2-02

* **Severity:** P2  
* **Category:** CSRF / CORS  
* **Title:** Edge functions use `Access-Control-Allow-Origin: *`  
* **Exact file/path:** `supabase/functions/razorpay-assessment/index.ts`, `worker-otp-login/index.ts`, `upload/index.ts`, `send-notification/index.ts`, others  
* **What is wrong:** Any origin can call from a browser. Auth is Bearer (localStorage), so classic cookie CSRF is limited; XSS + CORS `*` still helps exfil.  
* **Recommended fix:** Allowlist `https://safeworkglobal.com` and `https://www.safeworkglobal.com`.  
* **How to test the fix:** Origin `https://evil.example` preflight must fail.

### AUD-P2-03

* **Severity:** P2  
* **Category:** Security headers / CSP / HSTS  
* **Title:** No CSP, HSTS, or host `_headers`  
* **Exact file/path:** `index.html` (SEO only); no `vercel.json` / `netlify.toml` / `public/_headers`; `vite.config.ts` has no security plugin; Express has no Helmet  
* **What is wrong:** XSS impact is unbounded (sessions in localStorage). HSTS depends entirely on Lovable/CDN.  
* **Recommended fix:** Platform headers: `Content-Security-Policy` (start Report-Only), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`.  
* **How to test the fix:** Response headers on `https://www.safeworkglobal.com/`.

### AUD-P2-04

* **Severity:** P2  
* **Category:** Error handling / logging  
* **Title:** Edge functions return raw `error.message`; emails logged  
* **Exact file/path:** `razorpay-assessment/index.ts` catch; `contact-enquiry/index.ts`; `send-notification/index.ts`  
* **What is wrong:** Internal Razorpay/PostgREST messages leak to clients. PII in logs.  
* **Recommended fix:** Generic client errors; structured server logs with request ids.  
* **How to test the fix:** Force a DB error — client sees a stable code, not SQL.

### AUD-P2-05

* **Severity:** P2  
* **Category:** Rate limiting / abuse  
* **Title:** Almost no server rate limits  
* **Exact file/path:** `auth_continue` in `supabase/migrations/20260823050000_auth_continue.sql` (25/15m — good); Express `backend/src/app.ts` (none); edge OTP/contact/upload (none)  
* **What is wrong:** OTP, login, signup, upload, Razorpay create_order, `resolve_worker_auth_email` are brute/abuse surfaces. Client `src/lib/security.ts` is not a control.  
* **Recommended fix:** Supabase Auth rate limits + edge function counters + WAF.  
* **How to test the fix:** Burst `create_order` / OTP login — 429.

### AUD-P2-06

* **Severity:** P2  
* **Category:** Account enumeration  
* **Title:** `resolve_worker_auth_email` and `auth_continue` disclose account existence  
* **Exact file/path:** `supabase/migrations/20260912110000_enable_emitra_worker_login.sql`; `supabase/migrations/20260823050000_auth_continue.sql`  
* **Exact function/component/route:** granted to `anon, authenticated`  
* **What is wrong:** Phone/email → Auth email mapping (enumeration). `auth_continue` is rate-limited and avoids user ids (better).  
* **Recommended fix:** Constant responses; stricter rate limits; authenticated-only where possible.  
* **How to test the fix:** Anon lookup of random vs real phone should be indistinguishable or throttled.

### AUD-P2-07

* **Severity:** P2  
* **Category:** File upload  
* **Title:** MIME trusted from the client; no magic-byte / AV  
* **Exact file/path:** `supabase/functions/upload/index.ts`; `backend/src/middleware/uploadMiddleware.ts`  
* **What is wrong:** Allowlists `image/jpeg|png` and `application/pdf` from `file.type`. Size 10MB (photos) / 50MB (videos). Path sanitized and scoped to `user.id/` (good).  
* **Recommended fix:** Sniff magic bytes; block PDF JavaScript; virus scan if storing KYC.  
* **How to test the fix:** Upload `polyglot.exe` renamed `.pdf` — reject.

### AUD-P2-08

* **Severity:** P2  
* **Category:** Database / RLS  
* **Title:** Partners have `FOR ALL` on attributed `worker_verification` (includes DELETE)  
* **Exact file/path:** `supabase/migrations/20260821190000_partner_kiosk_worker_journey.sql`  
* **What is wrong:** A partner can delete a worker’s verification row. Insert guard would recreate a fresh `essentials` row — payment history confusion.  
* **Recommended fix:** SELECT/INSERT/UPDATE only; no DELETE.  
* **How to test the fix:** Partner DELETE must fail.

### AUD-P2-09

* **Severity:** P2  
* **Category:** Database / RLS  
* **Title:** Legacy escrow `payments` INSERT policy may still exist  
* **Exact file/path:** `supabase/migrations/20250928102547_580eb7ee-a12c-4675-8e1a-0cc67cb830ee.sql` (`Users can create payments they are paying for`); later P0 migration dropped other employer insert policies by name but **not this one** (`20260731130000_p0_profiles_apply_pilot_payment.sql`)  
* **What is wrong:** If `payer_id` still exists, clients may insert escrow-like rows. Assessment fees use `worker_assessment_payments` (pending-only insert — good).  
* **Recommended fix:** Inspect live `pg_policies` on `payments`; drop client INSERT/UPDATE.  
* **How to test the fix:** Authenticated INSERT into `payments` fails.

### AUD-P2-10

* **Severity:** P2  
* **Category:** Client-side security / secrets  
* **Title:** Demo passwords and public keys committed  
* **Exact file/path:** `src/services/SeedService.ts` `DEMO_ACCOUNTS` (`admin@safeworkglobal.demo` / `Admin@2024!`); `src/pages/SeedData.tsx` (not routed in `App.tsx` — good); `src/integrations/supabase/client.ts` default anon JWT; `src/lib/firebase.ts` default web config  
* **What is wrong:** Anon/Firebase web keys are expected in browsers. Demo passwords are not. `seed_demo_users` (P0) is the dangerous cousin.  
* **Recommended fix:** Remove demo passwords from the client bundle. Confirm those Auth users do not exist in prod; if they do, disable and rotate.  
* **How to test the fix:** Bundle grep finds no `Admin@2024!`. Login with demo emails fails.

### AUD-P2-11

* **Severity:** P2  
* **Category:** Race conditions / duplicate requests  
* **Title:** No unique provider payment id; HMAC not constant-time  
* **Exact file/path:** `supabase/migrations/20260731190000_razorpay_assessment_payment.sql` (INSERT without unique provider_ref); `razorpay-assessment/index.ts` `expected !== signature`  
* **What is wrong:** `FOR UPDATE` on the worker row prevents double-complete **for that user**, not cross-user reuse (P0) or duplicate payment rows. Timing leak on HMAC is low practical risk.  
* **Recommended fix:** Unique index; `crypto.subtle` verify with constant-time compare.  
* **How to test the fix:** Parallel verify on same user — one paid row. Second user same pay_id — reject.

### AUD-P2-12

* **Severity:** P2  
* **Category:** Architecture / maintainability  
* **Title:** Three auth stacks  
* **Exact file/path:** Supabase Auth (`src/contexts/AuthContext.tsx`); Express JWT (`backend/`); `worker_portal_*` + `supabase/functions/worker-portal/index.ts` (tokens generated, persistence/validation incomplete)  
* **What is wrong:** Confused threat model; leftover register/login with 6-char passwords on worker-portal.  
* **Recommended fix:** Freeze/retire Express and worker-portal in production. One identity: Supabase Auth.  
* **How to test the fix:** Production network tab never calls `/api/workers/*` or `worker-portal`.

### AUD-P2-13

* **Severity:** P2  
* **Category:** Authorization  
* **Title:** Partner subtype portals are UI-only  
* **Exact file/path:** `src/App.tsx` (`/partner/ssvn/*`, `/emitra/*`); `ApprovedPartnerGate`  
* **What is wrong:** Any `partner` role can open another subtype’s routes. Data isolation depends on RLS/`partner_type`.  
* **Recommended fix:** Confirm RLS per subtype; optionally check `partner_types` in a SECURITY DEFINER gate.  
* **How to test the fix:** SEN partner cannot read SSVN assessment rows.

### AUD-P2-14

* **Severity:** P2  
* **Category:** Monitoring  
* **Title:** No APM/error tracking  
* **Exact file/path:** `src/components/ErrorBoundary.tsx` (`console.error` only); no Sentry/Datadog usage in app code  
* **What is wrong:** Payment/OTP failures will be invisible.  
* **Recommended fix:** Sentry (or equivalent) on web + edge; alert on Razorpay 5xx and verify failures.  
* **How to test the fix:** Throw in ErrorBoundary — event in APM.

### AUD-P2-15

* **Severity:** P2  
* **Category:** CI/CD / testing  
* **Title:** No CI workflows; almost no tests; no payment smoke  
* **Exact file/path:** no `.github/workflows`; root `package.json` has no `test` script; tests: `src/lib/*.test.ts` (4 files), `mobile/__tests__/App.test.tsx`  
* **What is wrong:** RLS/payment regressions ship unnoticed.  
* **Recommended fix:** CI: lint, unit, `supabase db lint`/policy tests, deploy preview. Smoke: create_order (test keys) + verify reject path.  
* **How to test the fix:** PR without tests still runs lint; a broken policy test fails CI.

### AUD-P2-16

* **Severity:** P2  
* **Category:** XSS  
* **Title:** Email HTML injection (see AUD-P1-07); SPA XSS amplified by localStorage sessions  
* **Exact file/path:** `src/integrations/supabase/client.ts` (`persistSession` + `localStorage` via `brokeredPreviewStorage`); `src/components/ui/chart.tsx` `dangerouslySetInnerHTML` (Recharts CSS — low risk)  
* **What is wrong:** No CSP. One XSS = session theft. React default escaping is generally used in UI.  
* **Recommended fix:** CSP + reduce `dangerouslySetInnerHTML`; consider httpOnly cookie session later (do not rush — AUD-D).  
* **How to test the fix:** Stored XSS in profile name does not execute.

### AUD-P2-17

* **Severity:** P2  
* **Category:** Admin UX / auth  
* **Title:** `/admin/register` implies admin creation; server no longer auto-grants  
* **Exact file/path:** `src/pages/admin/AdminRegisterPage.tsx`; `src/lib/adminAuth.ts` (`WHITELISTED_ADMIN_EMAILS`); `supabase/migrations/20260803120952_be1c5cd6-edf1-4744-ba3b-78d1d2242f6f.sql` (dropped `ensure_whitelisted_admin`)  
* **What is wrong:** Client allow-list only. Signup creates a normal user. Email squatting on `admin@safeworkglobal.com`.  
* **Recommended fix:** Remove public admin register or require an invite token. Keep `ensureAdminAccess` (server `user_roles` check) — that part is correct.  
* **How to test the fix:** Whitelisted email signup still has no admin row until an existing admin grants it.

### AUD-P2-18

* **Severity:** P2  
* **Category:** Privacy  
* **Title:** Long-lived document URLs; DPDP operational evidence thin  
* **Exact file/path:** `src/pages/PrivacyPolicy.tsx`; `admin_delete_user` in `supabase/migrations/20260609120000_admin_management_fixes.sql`; `src/services/AdminService.ts` storage cleanup  
* **What is wrong:** Policy page exists. Retention/deletion SLAs, encryption-at-rest evidence, and audit logs are not operationalized in code beyond admin delete.  
* **Recommended fix:** Document PITR, retention, and a DSAR runbook. Shorten signed URLs (P1-13).  
* **How to test the fix:** Admin delete removes Auth user + storage prefixes.

---

## P3 Low Issues

### AUD-P3-01 — HMAC compare not constant-time (`razorpay-assessment/index.ts`).  
### AUD-P3-02 — Hardcoded Firebase web API key in `worker-otp-login` (`DEFAULT_FIREBASE_API_KEY`) — expected for web clients; enables quota abuse of Identity Toolkit.  
### AUD-P3-03 — `assign_initial_role` / unused admin email list confuse operators.  
### AUD-P3-04 — `contact-enquiry` and transactional templates still say “© 2024”.  
### AUD-P3-05 — Vite `^5.4.19` and toolchain CVEs (`npm audit`: 9 high / 5 moderate / 1 low, 0 critical). Most are **dev-server / build-tool** (Vite `server.fs`, esbuild, postcss, glob CLI), not runtime SPA XSS. Still upgrade Vite 5.4.x → patched 5.4 / 6.x and `npm audit fix` for brace-expansion, nanoid, postcss.  
### AUD-P3-06 — Duplicate `@supabase/supabase-js` versions (web `^2.110.1` vs mobile `^2.108.1`).  
### AUD-P3-07 — Public `avatars` bucket is acceptable; ensure KYC never lands there (`src/components/AvatarUpload.tsx`).  
### AUD-P3-08 — `send-push-notification` / `upload` use `verify_jwt = false` and re-check JWT in-process — prefer gateway JWT **plus** in-function auth. Push recipient checks are good.  
### AUD-P3-09 — LSP session cookie `sw_lsp` is `SameSite=Lax` (not `Strict`) and not `HttpOnly` (`src/modules/lsp/services/lspSession.ts`) — client-readable by design.  
### AUD-P3-10 — `list_public_workers` revoked from anon (`20260731150000_p2_privacy_discovery.sql`) — keep it that way.  
### AUD-P3-11 — Worker apply gate was relaxed from `gcc_ready` to essentials (`20260822120000_journey_find_jobs_apply.sql`) — product choice; employers may see unverified applicants.  
### AUD-P3-12 — SEO basics exist in `index.html` (canonical, OG, JSON-LD). Accessibility not systematically tested (focus traps, skip links, quiz contrast).  
### AUD-P3-13 — `handle_new_user` silently ignores `role=admin` in metadata (good).  
### AUD-P3-14 — Debug: `build:dev` script exists; confirm Lovable production build is `vite build` without source maps (`vite.config.ts` does not enable `build.sourcemap` — default false). Confirm host does not publish `.map`.  
### AUD-P3-15 — `scripts/phase0-reset-*.mjs` / `create-admin.mjs` are operator tools; keep them off production HTTP routes.

---

## Razorpay Payment Audit

### Flow as implemented

| Step | Component | Enforcement |
|------|-----------|-------------|
| 1 | `WorkerVerificationPage` → `payAssessmentFeeWithRazorpay` | UI only |
| 2 | `verificationService.callRazorpayFn` | User JWT to `functions/v1/razorpay-assessment` |
| 3 | `create_order` | Auth; optional `partner_manages_worker`; fee from `jobs.service_charge` or ₹35,400; Razorpay Orders API; stores `razorpay_order_id` + `payment_amount` |
| 4 | `razorpayCheckout.ts` | Checkout.js with **server** `key_id` + `order_id` |
| 5 | `verify_payment` | HMAC `order_id\|payment_id` **or** Payments API fallback (too loose — AUD-P0-02) |
| 6 | `complete_assessment_payment_razorpay` | `service_role` only; `FOR UPDATE`; sets `payment_status='paid'`; advances stage |
| 7 | `recover_payment` / create_order recovery / “Sync payment” | Intended safety net; currently unsafe |
| 8 | Webhook | **Missing** |

### Malicious-user tests (static conclusion)

| Abuse | Possible? | Why |
|-------|-----------|-----|
| Change amount in Checkout | No for order creation | Amount set server-side in paise |
| Change amount at verify | **Yes (underpay)** | Capture amount not compared; fee shopping via `change_journey_job` |
| Change order ID | **Yes if row has no bound order** | AUD-P0-02 |
| Fake payment success in UI | No for DB | `guard_worker_verification_update` blocks `payment_status` / Razorpay IDs; workers cannot INSERT `status='paid'` |
| Call payment APIs directly | Yes, as intended | JWT required; must still satisfy Razorpay |
| Replay verify for same user | Mostly safe | Early return if already `paid` + row lock |
| Replay / reuse payment on another user | **Yes** | No unique payment id; recover without bound order |
| Duplicate webhooks | N/A | No webhook |
| Activate without paying | **Yes** | Stage skip to `bond` (AUD-P0-01); waive RPC latent (AUD-P1-03) |
| Access another user’s order | Create/verify scoped to `payerId` after `partner_manages_worker` | Good for partner pay-for-worker **if** order binding is fixed |
| Manipulate status from frontend | `markPaymentPaid` | Admin RLS/trigger; workers fail |

### What is already correct

- Secret not in `VITE_`.  
- `complete_assessment_payment_razorpay` revoked from `authenticated` (`20260731190000_razorpay_assessment_payment.sql`, reaffirmed `20260803123739_…`).  
- Partner pay-for-other uses `partner_manages_worker`.  
- Employers cannot rewrite `jobs.service_charge` (`stamp_job_posted_by`).  
- Workers insert assessment payments only with `status = 'pending'`.

---

## Authentication Audit

| Control | Where | Verdict |
|---------|--------|---------|
| Email/password | `AuthContext.login/signup` → `supabase.auth` | Standard GoTrue |
| Google OAuth | `src/lib/googleAuth.ts` | Supabase provider / Lovable broker |
| Phone OTP login | Firebase client → `worker-otp-login` | Sound **if** bypass secret off; matches Firebase phone to profile |
| Session store | localStorage (web), AsyncStorage (mobile) | XSS = takeover |
| Password reset | `src/lib/passwordReset.ts` | Next-path allowlisted; synthetic emails blocked |
| Admin grant-by-email | Dropped `ensure_whitelisted_admin` | Correct |
| Admin UI login | `ensureAdminAccess` re-reads `user_roles` | Correct (UI); RPCs also check `has_role` |
| Account factory RPCs | `create_phone_verified_*` | **Fail** — no server OTP |
| Email confirm via metadata | `confirm_mobile_verified_auth_user` | **Fail** |
| Express Google | `WorkerService.googleAuth` | **Fail** if deployed |
| Dual session (kiosk) | `partnerAssistedWorker.ts` | **Fail** for shared devices |

---

## Authorization Audit

**Roles (`app_role`):** `admin`, `employer`, `worker`, `partner`, `interviewer`. eMitra / LSP / SSVN / ITI are partner subtypes, not DB roles.

| Surface | Auth required? | Ownership? | Role? | Server-side? | IDOR if ID changed? |
|---------|----------------|------------|-------|--------------|---------------------|
| `ProtectedRoute` / mobile stacks | Yes | N/A | Client | **No** | UI only |
| PostgREST tables with RLS | Yes (JWT) | Usually `auth.uid()` | `has_role` | **Yes** | Generally blocked |
| `admin_*` RPCs | Yes | Target id | `has_role(...,'admin')` | Yes | Cannot self-delete admin; cannot assign admin via `admin_set_user_role` |
| `assign_initial_role` | Yes | Self | Blocks admin only | Yes | Self-assign interviewer |
| `razorpay-assessment` | Yes | `resolvePayerUserId` | Partner RPC | Yes | Order binding gap (P0) |
| `send-notification` | Yes | **No** | **No** | Partial | Email anyone |
| `send-push-notification` | Yes | Self / admin / application relationship | Yes | Yes | URL must be internal path (SSRF-safe) |
| `upload` | Yes | Path `user.id/` | No extra | Yes | Cannot write another prefix |
| `purge-storage` | Anon JWT enough | N/A | **No** | **No** | Wipes all |
| `interviewer_record_decision` | Yes | Assigned interviewer | interviewer/admin | Yes | Likely broken by guard |
| Express `GET profile/:id` | **No** | **No** | **No** | **No** | IDOR if live |

Client role checks are defense-in-depth for UX only. Do not add more client-only gates and call them “fixed.”

---

## Database/RLS Audit

Effective posture from **latest** migrations (live DB can drift — verify `pg_policies`).

### `profiles`

| Op | Who |
|----|-----|
| SELECT | Own; admin all; employer of applicants; worker of applied-to employers; partners of attributed workers |
| UPDATE | Own row (all columns — **including `mobile_verified`**) |
| INSERT | Typically `handle_new_user` |
| DELETE | Not granted to users |
| Anon | Blocked (blanket authenticated SELECT dropped in `20260731130000_…`) |

RLS enabled. Sensitive columns (phone, email) visible to those SELECT policies — expected for hiring, not public.

### `user_roles`

RLS on. Own SELECT. Restrictive `Block direct role self-insert` (`20260511075601_…`). Admins manage. **Cannot** self-insert admin. `seed_demo_users` bypasses via SECURITY DEFINER (P0).

### `worker_verification`

RLS on. Workers: SELECT/INSERT/UPDATE own (no DELETE after `20260802090749_…`). Partners: `FOR ALL` attributed (includes DELETE — P2). Admins: ALL. Privileged columns blocked by trigger except stage allow-list (P0). Insert sanitizer forces `essentials` / pending payment.

### `worker_assessment_payments`

SELECT own / partner / admin. INSERT own or partner **only `pending`**. Paid UPDATE/DELETE admin. Completions via service_role RPC.

### `jobs`

Public SELECT of ACTIVE listings (intentional). Employers create DRAFT/PENDING; cannot `ACTIVE` (`guard_employer_job_status`). `service_charge` frozen for non-admins.

### `job_applications`

INSERT after essentials (`worker_can_apply_to_jobs`). Employers view/update applications on their jobs.

### `worker_documents` / storage `worker-documents`

Private bucket; path `user_id/…`. Employers read verified applicant docs (path-matched, `20260803120952_…`). Partners attributed.

### `worker-videos`

Forced private; public SELECT policies dropped.

### `messages`

Participants only; content immutable trigger (`20260819130244_…`). Anon blocked.

### Partner money tables (`partner_payout_requests`, invoices, wallets)

RLS on; `REVOKE UPDATE (status, processed_at, …)` from authenticated (`20260708064551_…`) — correct.

### Bonds

Workers draft/submit; cannot self-approve. Admin review RPCs.

### Quiz items

Table SELECT for authenticated **dropped**; answers only via trigger/RPC — **verify live**.

### `payments` (escrow, possibly unused)

RLS on; leftover INSERT policy possible (P2).

---

## API Security Audit

### Edge functions (`supabase/functions/`)

| Function | Gateway JWT (`config.toml`) | In-function auth | Notes |
|----------|-----------------------------|------------------|-------|
| `razorpay-assessment` | default on | User JWT + partner RPC | P0 verify/recover |
| `purge-storage` | default on | **None** | P0 |
| `worker-otp-login` | false | Firebase / dev bypass | P1 if bypass on |
| `upload` | false | Bearer `getUser` | MIME trust |
| `send-notification` | false | Any valid JWT | P1 |
| `send-push-notification` | false | JWT + relationship | Good |
| `contact-enquiry` | false | None | P1 abuse |
| `preview-transactional-email` | false | `LOVABLE_API_KEY` | OK |
| `contract-expiry-reminder` | false | `x-cron-secret` | OK |
| `worker-portal` | false | Weak register/login | Retire |

### Express (`backend/src/app.ts`)

Public: health, reference data, OTP, register, login, google-auth, **profile :id**, `/uploads`. Onboarding/applications: Bearer JWT. CORS fail-closed in `NODE_ENV=production` without `CORS_ORIGINS` (good). No Helmet, no rate limit. `JWT_SECRET` fail-closed and forbids old default (good). Zod on many DTOs; SQLite queries parameterized.

### SSRF

Push `url` must start with `/`. Razorpay fetch is fixed `https://api.razorpay.com`. No user-controlled server-side URL fetch found in payment/OTP paths. **Low SSRF risk.**

### SQL injection

PostgREST + parameterized SQL / plpgsql. No string-concat query builders found in Express repos reviewed. Dynamic identifiers in SECURITY DEFINER functions were not exhaustively fuzzed; treat as residual P3.

### CSRF

Primary API is Bearer-from-header. Cookie CSRF is mainly LSP `SameSite=Lax`. CORS `*` is the residual browser issue.

---

## Secrets Audit

| Secret | Location | OK? |
|--------|----------|-----|
| Supabase anon key | Client + committed default | Expected; not a privilege key |
| Supabase service_role | Edge only | **Do not** put in `VITE_` |
| Razorpay secret | Edge env | Correct pattern; **test keys in prod** (P0 for live money) |
| Razorpay key_id | Returned from `create_order` | Correct |
| Firebase web config | Client + edge default | Public by design |
| `JWT_SECRET` | Express env | Fail-closed |
| `CRON_SECRET` | `contract-expiry-reminder` | Required |
| `LOVABLE_API_KEY` | preview email | Required |
| `RESEND_API_KEY` | send-notification / contact | Enables P1 if send-notification stays open |
| `OTP_DEV_BYPASS` | Edge | Must be unset in prod |
| `VAPID` private | Edge push | Not in `VITE_` (public VAPID is OK) |
| Demo passwords | `SeedService.ts` | Remove |
| `.env` | `.gitignore` | Good |

`.env.example` documents Razorpay as edge-only — good.

---

## Production Configuration Audit

| Check | Status |
|-------|--------|
| Debug mode | Vite production default; `build:dev` exists — do not use for prod |
| Verbose errors | Edge returns `e.message` |
| Source maps | Not enabled in `vite.config.ts` (confirm host) |
| Exposed secrets | Anon/Firebase/demo passwords in bundle |
| CORS | Edge `*`; Express fail-closed in production |
| Cookies | Supabase session not cookie-based; LSP cookie not HttpOnly |
| Security headers / CSP / HSTS | Missing in repo; depend on Lovable |
| Admin/debug routes | `/admin/register` public; `SeedData` **not** routed |
| Internal APIs | `purge-storage`, `worker-portal`, Express |
| Dev credentials | Demo accounts in source |
| Test Razorpay | **Yes** on production function (ops) |
| Test webhooks | No webhooks |
| Hosting | Lovable Publish + custom domain; `firebase.json` is **emulators only** |
| CI | Missing |

---

## Reliability Audit

| Topic | Finding |
|-------|---------|
| Payment verify failure | Recovery exists but unsafe |
| Interviewer scoring | Likely broken for non-admins |
| Waive RPCs | Likely fail closed (good accident, bad ops if UI still calls them on preview) |
| In-memory OTP (Express) | Multi-instance / restart loss |
| worker-portal tokens | Generated, not a coherent session store |
| Error boundary | User can retry; no telemetry |
| Duplicate checkout | create_order recovers settled orders for **that** bound id (good) |

---

## Performance Audit

Indexes exist for jobs, applications, verification stage, messages, partner workers, interviews, skill media, etc. No systematic EXPLAIN review was run.

Watch:

- `guard_worker_verification_update` / `has_role` / `partner_manages_worker` on every verification UPDATE.  
- Storage `list` recursion in `purge-storage` and `AdminService.removeUserStorageFiles`.  
- Quiz `submit_worker_quiz` scans responses for the submitted id set.  
- Missing unique index on Razorpay payment ids (correctness first, then write amplification).

Mobile `getPublicUrl` on private buckets will cause extra failed fetches.

---

## Dependency Audit

**Root `package.json` (`npm audit` 16 Sep 2026):** 0 critical, 9 high, 5 moderate, 1 low.

High (mostly toolchain): `vite` (dev middleware file serving), `postcss` (stringify XSS / sourceMappingURL), `nanoid` ≤3.3.17, `minimatch`, `glob` 10.x CLI injection, `js-yaml` 4.x, `flatted`, `browserslist`, `brace-expansion`.

Moderate: `esbuild` (dev server), `protobufjs` (Firebase tree), `yaml`, `baseline-browser-mapping`, `@humanfs/node`.

**Runtime production SPA risk is lower than the high count suggests**, but Vite should still be patched before exposing `vite preview` or any Node tooling to untrusted input.

**Backend:** Express 4.21, `jsonwebtoken`, `multer` ^2.2.0, `firebase-admin`, `better-sqlite3`. Not included in root audit; run `npm audit` in `backend/` before any public deploy.

**Mobile:** React Native 0.86, separate lockfile — audit independently before store release.

Abandoned/unnecessary: Phase-1 Express + `worker-portal` + `SeedService` demo seeder if unused in prod.

---

## Existing Good Practices

1. Roles in `user_roles` + `has_role` SECURITY DEFINER; restrictive self-insert.  
2. Admin auto-grant by email **removed**. `admin_set_user_role` cannot assign `admin` or change self. `admin_delete_user` cannot delete self or other admins.  
3. `handle_new_user` only auto-assigns `worker|employer|partner`.  
4. Profiles PII not world-readable.  
5. Verification privilege trigger blocks payment/Razorpay/pass-fail/`gcc_ready`.  
6. Assessment paid INSERT blocked for clients; completion RPC is `service_role` only.  
7. Razorpay order amount and `key_id` come from the server. Partner pay-for-worker ownership check.  
8. Job activation and `service_charge` are admin-controlled.  
9. Quiz answer keys intended to stay server-side (`get_worker_quiz_items`).  
10. Password-reset `next` path allowlist; synthetic email reset blocked.  
11. Upload filenames sanitized; objects under `{userId}/`.  
12. Push: relationship check + internal URLs only.  
13. Cron function shared secret. Preview email API key.  
14. Express `JWT_SECRET` and production CORS fail-closed.  
15. `.gitignore` excludes `.env` / service accounts / `backend/data`.  
16. Client OTP bypass forced off on `*.safeworkglobal.com`.  
17. Journey reset UI forced off on production hostnames.  
18. `SeedData` page not mounted in `App.tsx`.  
19. Worker documents storage policies tightened for employers.  
20. Partner payout status columns revoked from client UPDATE.

---

## Production Blockers

Must fix or positively verify as not deployed / not exploitable:

1. AUD-P0-01 stage skip to `bond`  
2. AUD-P0-02 Razorpay payment reuse  
3. AUD-P0-03 `purge-storage`  
4. AUD-P0-04 `seed_demo_users`  
5. AUD-P0-05 phone-verified account RPCs + metadata email confirm  
6. AUD-P0-06 live Razorpay keys (if charging)  
7. Revoke waive RPCs (AUD-P1-03) before restoring trigger bypass  
8. Confirm `OTP_DEV_BYPASS` unset  
9. Confirm Express worker API is not public  

---

## Recommended 24-Hour Fix Plan

1. **Disable/delete** production `purge-storage`.  
2. **REVOKE** `seed_demo_users`, `waive_assessment_payment_pilot`, `waive_assessment_interview_pilot`, `create_phone_verified_*` from `anon`/`authenticated`.  
3. **Patch** `guard_worker_verification_update`: remove `bond` (and any unpaid skip stages) from the allow-list.  
4. **Patch** `razorpay-assessment`: require bound `razorpay_order_id`; match Razorpay amount + `notes.user_id`; unique payment id; reject recover without a bound order; never accept a payment that already completed another user.  
5. **Dashboard:** confirm `OTP_DEV_BYPASS` off; Razorpay keys plan (test vs live).  
6. **SQL:** `UPDATE profiles` column trigger cannot self-set `mobile_verified`; `assign_initial_role` allow-list.  
7. **Verify** `GET https://<project>.supabase.co/functions/v1/purge-storage` with anon key is 401/404.  
8. **Verify** worker JWT cannot `PATCH` stage to `bond` or RPC `seed_demo_users`.

Do **not** restore `app.verification_guard_bypass` in the same 24 hours without an allow-list (AUD-P1-04).

---

## Recommended 48-Hour Fix Plan

1. Move account creation into OTP-verified edge functions; drop metadata auto-confirm.  
2. Freeze fee at order creation; block `change_journey_job` after payment stage/order.  
3. Add signed Razorpay webhook + idempotency table.  
4. Switch to `rzp_live_…` if collecting money; one live smoke charge.  
5. Fix interviewer RPC without re-opening waive.  
6. Lock `send-notification`; rate-limit `contact-enquiry`.  
7. CORS allowlist; basic security headers on the host.  
8. Short signed URLs; fix mobile `getPublicUrl`.  
9. Retire or firewall Express; remove demo passwords from the client.  
10. Minimal CI: lint + a SQL policy regression + Razorpay negative tests.  
11. Sentry (or equivalent) on web + `razorpay-assessment`.

---

## Final Production Checklist

- [ ] `purge-storage` not deployed  
- [ ] `seed_demo_users` not executable by `authenticated`  
- [ ] Phone account RPCs require server-verified Firebase token  
- [ ] `mobile_verified` not client-writable  
- [ ] Worker cannot set `stage` to `bond` / `gcc_ready` / paid stages  
- [ ] Razorpay verify/recover requires bound order + amount + user notes + unique pay_id  
- [ ] Live keys if charging; Checkout not TEST MODE  
- [ ] Webhook HMAC + idempotency (or accepted gap with hardened recover)  
- [ ] Waive RPCs revoked  
- [ ] Interviewer path works for staff without payment waive  
- [ ] `OTP_DEV_BYPASS` unset  
- [ ] `send-notification` not a mail relay  
- [ ] Express `/api` not on the public internet  
- [ ] Demo Auth users absent  
- [ ] Quiz `correct_option` not selectable by workers  
- [ ] CSP/HSTS headers on www  
- [ ] KYC signed URLs ≤ 1 hour  
- [ ] Backup/PITR confirmed in Supabase dashboard  
- [ ] Error monitoring live  
- [ ] One production smoke: signup OTP → essentials → (cannot skip to bond) → pay (test or live) → stage advances only when captured  

---

### BLOCKED

- Worker can skip the paid GCC journey (`stage = 'bond'`).  
- Razorpay capture can be attached to another account.  
- `purge-storage` can destroy all media with the public anon JWT.  
- Any authenticated user can seed users including `admin`.  
- Confirmed worker/partner accounts can be created without server-side OTP.  
- Production Razorpay still on test keys if real money is in scope.

### CONDITIONAL

- No webhook — acceptable for a short period only after recover/verify is bound to the user’s order and amount.  
- Missing CSP/HSTS/CI/monitoring — launch-with-risk if P0s are closed.  
- Express IDOR/Google-auth — acceptable if the API is proven unreachable.  
- Waive RPCs — acceptable only after REVOKE (they likely already error).  
- Interviewer non-admin path — accept admin-only scoring for a few days.  
- Fee shopping — accept only if every ACTIVE `service_charge` is the intended fee and job change is blocked at payment.  
- `send-notification` — accept only if `RESEND_API_KEY` is unset.

### READY

- Admin role is not self-grantable via `assign_initial_role` or signup metadata.  
- `admin_set_user_role` cannot mint admins.  
- Client cannot mark assessment `paid` (RLS + trigger) when using the service_role completion path.  
- Razorpay **order creation** amount is server-side; secret is not in `VITE_`.  
- Partner paying for a worker is gated by `partner_manages_worker`.  
- Employers cannot activate jobs or edit `service_charge`.  
- Profiles are not anonymously readable.  
- Password-reset redirect allowlist.  
- Push notifications cannot target arbitrary users.  
- Cron email reminder requires `CRON_SECRET`.  
- Preview transactional email requires `LOVABLE_API_KEY`.  
- Production hostname disables client OTP bypass and journey-reset UI.  
- Express JWT refuses empty/default secrets (if that API is used at all).

**Launch decision: BLOCKED** until the BLOCKED list is closed and the CONDITIONAL items you accept are written down as explicit time-boxed exceptions.
