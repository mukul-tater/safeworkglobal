# eMitra Partner Worker Acquisition System

Extends the existing Worker module with eMitra partner source tracking, admin review workflow, configurable rewards, and a wallet/withdrawal system. **No duplicate worker tables** — we reuse `worker_profiles`, `worker_documents`, `worker_skills`, `job_applications`, and add lightweight tracking tables.

---

## 1. Database changes (single migration)

### Extend existing tables
- `partner_profiles`: add `approved_by uuid`, `approved_at timestamptz`, `rejection_reason text`, `approval_notes text` (status column already exists).
- `worker_profiles`: add `source_type text default 'organic'` (`'organic' | 'emitra'`), `source_partner_id uuid references partner_profiles(id)`, `onboarded_at timestamptz`, `review_status text default 'not_required'` (`'not_required' | 'pending' | 'approved' | 'rejected'`), `reviewed_by uuid`, `reviewed_at timestamptz`, `review_notes text`, `review_rejection_reason text`.
- When `source_type='emitra'`, default `review_status='pending'` (trigger).

### New tables
- `reward_transactions` — `partner_id`, `worker_id`, `job_id`, `application_id`, `amount`, `status` (`pending_placement | available | withdrawn`), timestamps.
- `withdrawal_requests` — `partner_id`, `amount`, `bank_account`, `ifsc`, `account_holder`, `upi_id`, `status` (`pending | approved | paid | rejected`), `processed_by`, `processed_at`, `admin_notes`, `rejection_reason`, `paid_at`, `payment_reference`.
- `partner_reward_config` already exists — reuse its `placement_reward_amount`.

### Triggers
- On `job_applications.status` change to `'HIRED'`/placement status: if worker has `source_partner_id`, insert `reward_transactions` row with `status='available'` and amount from `partner_reward_config`.
- On worker_profile insert with `source_type='emitra'`: set `review_status='pending'`.

### RLS / GRANTs
- Partners can SELECT their own reward_transactions, withdrawal_requests; INSERT withdrawal_requests for themselves.
- Admins full access via `has_role`.
- Workers onboarded by a partner: partner can SELECT (extend `worker_profiles` select policy via `source_partner_id = (select id from partner_profiles where user_id=auth.uid())`).

---

## 2. Partner-facing pages (`/emitra/*`)

Reuse `EmitraLayout` + `emitraNavGroups`. Add nav items: Onboard Worker, My Workers, Rewards & Earnings, Withdrawals.

- **EmitraOnboardWorkerPage** — wraps existing Worker Registration flow with a context flag `{ source: 'emitra', partnerId }`. On submit, the existing registration writes to `worker_profiles` plus our metadata columns.
- **EmitraMyWorkersPage** — table of workers where `source_partner_id = my partner id`. Columns: Name, Mobile, Primary Skill, Reg Date, Review Status (with reason if rejected), Placement Status, Reward Status. Filters as specified.
- **EmitraRewardsPage** — wallet card (Total Earned / Available / Withdrawn / Pending) + reward history table. "Request Withdrawal" button opens dialog.
- **EmitraWithdrawalsPage** — list of own withdrawal_requests with status badges.

Gate all of the above with an `ApprovedPartnerGate` that checks `partner_profiles.status = 'approved'` and shows a "Pending approval" screen otherwise.

---

## 3. Admin pages (`/admin/emitra/*`)

- **AdminPartnerApprovals** (exists — extend) — Approve / Reject actions; reject requires reason; writes `approved_by/at`, `rejection_reason`, `approval_notes`.
- **AdminEmitraWorkerReview** — queue of `worker_profiles` where `source_type='emitra' AND review_status='pending'`. Inline drawer shows profile, documents, skills, experience, partner info. Approve / Reject (with mandatory reason).
- **AdminEmitraAnalytics** — KPI cards for partner/worker/reward metrics from real counts.
- **AdminEmitraWithdrawals** — Approve / Reject / Mark Paid. On Mark Paid, set linked reward_transactions to `withdrawn`.
- **AdminEmitraSettings** — edit `partner_reward_config.placement_reward_amount` (default ₹1000).
- Extend AdminWorkers list with filter "Source partner".

---

## 4. Partner registration form

Update `PartnerOnboarding` / `EmitraRegisterPage` to collect exactly the requested fields (Full Name, Center Name, Mobile, Email, Address, State, District, ID Proof, eMitra Cert, Bank, UPI). Most already exist; align labels and required flags. After submit, set status=`pending` and show "Pending Approval" screen.

---

## 5. Reuse, don't duplicate

- Worker Registration flow: `src/modules/worker-registration/*` is reused as-is. We pass an `onboardingContext` prop with `{ source, partnerId }`. After the final step's insert, we patch the new `worker_profiles` row with source metadata (or do it server-side via a trigger reading from a session GUC — simpler: pass through to the insert).
- Documents/Skills/Verification: unchanged.
- Job applications & placement: unchanged. The placement trigger generates the reward.

---

## Files

```text
supabase/migrations/<ts>_emitra_acquisition_system.sql   (new)
src/modules/emitra/
  components/ApprovedPartnerGate.tsx                     (new)
  pages/EmitraOnboardWorkerPage.tsx                      (new)
  pages/EmitraMyWorkersPage.tsx                          (new)
  pages/EmitraRewardsPage.tsx                            (new)
  pages/EmitraWithdrawalsPage.tsx                        (new)
  config/emitraNav.ts                                    (edit — add items)
  services/emitraService.ts                              (edit — reward & withdrawal queries)
src/pages/admin/
  AdminEmitraWorkerReview.tsx                            (new)
  AdminEmitraAnalytics.tsx                               (new)
  AdminEmitraWithdrawals.tsx                             (new)
  AdminEmitraSettings.tsx                                (new)
  PartnerApprovals.tsx                                   (edit — approve/reject UX)
src/config/adminNav.ts                                   (edit — add admin emitra section)
src/App.tsx                                              (edit — register routes)
```

---

## Out of scope (kept simple)

- No payment gateway integration for "Mark Paid" — admin records payment reference manually.
- No partner KYC re-verification — uses existing partner_profiles fields.
- Email/SMS notifications for approve/reject reuse existing `notifications` table inserts.

Confirm to proceed and I'll build it end-to-end.
