# SafeWork Global — Partner Ecosystem V1

## Goal
Extend the platform with a scalable **Partner Ecosystem** that supports four partner types (SEN, SSVN, SRN, SEN Global) under one auth system, without breaking the existing Worker, Employer, or E-Mitra modules. Architecture must allow new partner types (Training, Medical, Insurance, Travel, etc.) with zero schema changes.

Given the size of this scope, this plan proposes a **phased rollout**. Phase 1 is the foundation + first new partner type end-to-end. Later phases add SRN, SEN Global, wallet/reports/support depth.

---

## Phase 1 — Foundation + SSVN (Skill Verification Network)

### 1. Database (scalable, normalized, future-proof)

New tables (all in `public`, with GRANTs + RLS + policies):

- `partner_types` — dynamic catalog: `code` (SEN | SSVN | SRN | SEN_GLOBAL | …), `name`, `description`, `default_permissions jsonb`, `active`.
- `partners` — one row per partner org: `user_id → auth.users`, `partner_type_id → partner_types`, `partner_code`, `status` (pending/approved/rejected/suspended), `verification_status`, `state`, `district`, `city`, `rating`, `created_at`.
- `partner_profiles_ext` — flexible details: `partner_id`, `company_name`, `owner_name`, `mobile`, `email`, `address`, `pincode`, `pan`, `gst`, `website`, `bank jsonb`, `upi`, `metadata jsonb` (per-type extras).
- `partner_documents` — `partner_id`, `doc_type`, `file_url`, `status`, `reviewed_by`, `reviewed_at`, `notes`.
- `partner_wallets` — `partner_id`, `available_balance`, `pending_balance`, `currency`.
- `partner_transactions` — `partner_id`, `type` (credit/debit/withdrawal/fee), `amount`, `reference_type`, `reference_id`, `status`, `metadata`.
- `partner_notifications` — `partner_id`, `type`, `title`, `body`, `link`, `is_read`.
- `partner_assignments` — universal join: `partner_id`, `assignment_type` (worker | employer | assessment), `subject_id`, `status`, `assigned_by`, `metadata jsonb`, `assigned_at`, `completed_at`. Powers worker-partner and employer-partner links for all partner types.
- `partner_permissions` — per-partner overrides on the type's defaults.
- `partner_reports` — cached daily rollups per partner for the reports screen.

SSVN-specific:
- `trades` — dynamic list (admin-managed): `name`, `code`, `active`.
- `assessments` — `worker_id`, `employer_id`, `job_id`, `trade_id`, `partner_id` (SSVN centre), `scheduled_at`, `start_time`, `end_time`, `assessor_name`, `location`, `equipment jsonb`, `scores jsonb` (safety/technical/tool/accuracy/productivity/communication/overall), `recommendation`, `remarks`, `status` (scheduled | checked_in | running | completed | employer_review | approved | rejected | retest), `media jsonb`.

**E-Mitra migration**: existing `partner_profiles`, `partner_workers`, `reward_transactions`, etc. remain untouched. A one-time backfill inserts matching `partners` rows (partner_type = SEN) referencing existing `partner_profiles.user_id`, so the new dashboard shell wraps the existing E-Mitra pages without data migration risk.

All tables: GRANT `SELECT/INSERT/UPDATE/DELETE` to `authenticated`, `ALL` to `service_role`, RLS on, policies scoped via `partners.user_id = auth.uid()` or `has_role(auth.uid(), 'admin')`.

### 2. Auth & Registration

- **Signup page**: add "Partner" to the existing Worker/Employer role picker. When "Partner" is chosen, show a **Partner Type dropdown** populated from `partner_types` (dynamic — never hardcoded).
- **Partner registration form**: single multi-step form capturing company, owner, contact, address, PAN/GST, bank/UPI, document uploads. On submit: creates `partners` (status=pending), `partner_profiles_ext`, `partner_documents`, empty `partner_wallets`.
- Extends existing `AuthContext` role type to include `'partner'` (already present) — new signups land on `/partner/pending-approval` until admin approves.

### 3. Partner Portal Shell (reusable)

- New route tree under `/partner/*` with a shared `PartnerLayout` (sidebar + top cards).
- Sidebar is **driven by `partner_type.code`** via a registry `partnerTypeConfig[code] = { navItems, dashboardCards, routes }`. Adding a new partner type = adding a config entry, no layout changes.
- Top cards (name, ID, type, verification, state/district, wallet, rating) are shared across all partner types.

### 4. Partner Type 1 — SEN (E-Mitra migration)

- Mount the existing E-Mitra pages under `/partner/sen/*` via the new layout. Existing routes keep working (redirect legacy `/emitra/*` → `/partner/sen/*`).
- No changes to E-Mitra business logic, rewards, or DB tables.

### 5. Partner Type 2 — SSVN (new, full build)

- Dashboard cards: today's / upcoming / completed assessments, pending reports, revenue, avg rating (queried from `assessments`).
- Pages: Assessment Calendar, Today's Schedule, Candidate Check-in, Assessment Form, Assessment History, Reports, Wallet, Support.
- Assessment lifecycle enforced by DB triggers that fire `partner_notifications` inserts on state changes (scheduled → notify worker+employer+admin; completed → notify employer + update worker profile).
- Admin `Trades` CRUD page.

### 6. Admin Panel additions

- `/admin/partners` — list all partners with filters (type / state / district / status / verification / performance).
- Actions: approve / reject / suspend, assign workers, assign employers, assign assessments, release payments, view audit trail.
- `/admin/partner-types` — manage catalog + default permissions.
- `/admin/trades` — manage SSVN trades.

### 7. Cross-cutting

- **Notifications**: single `partner_notifications` feed + bell icon in `PartnerLayout`.
- **Wallet**: shared component reads `partner_wallets` + `partner_transactions`.
- **Reports**: shared `PartnerReports` page with date filters + PDF/Excel export (client-side).
- **Permissions**: every query scoped by `partner_id`; RLS enforces isolation.

---

## Phase 2 (later, not built now)

- **SRN** (Recruitment Network) — worker timeline: medical → visa → offer letter → POE → travel → deployment, per-stage document uploads.
- **SEN Global** (Employer Network) — employer leads, commissions, monthly billing.
- Ticketing/live-chat support module (Phase 1 uses the existing contact form).
- Advanced wallet: invoices, payout gateway integration.

---

## Technical details

**Stack**: React + Vite + TS, Tailwind + shadcn, Supabase (Lovable Cloud), React Router. All new code uses semantic tokens (no hardcoded blue/white/green in components — the "Blue + White + Green" brand is expressed via CSS variables added to `index.css`).

**Migrations**: ~4-5 migration files (partner core tables, SSVN tables, RLS policies, E-Mitra backfill, seed `partner_types` + a few `trades`).

**Files added** (Phase 1):
- `supabase/migrations/*_partner_ecosystem_core.sql` (+ SSVN, + seeds, + RLS)
- `src/modules/partner/` — layout, config registry, hooks, shared components
- `src/modules/partner/types/sen/` — thin wrappers around existing E-Mitra
- `src/modules/partner/types/ssvn/` — full new module (dashboard, calendar, check-in, assessment form, history, reports)
- `src/pages/auth/PartnerSignup.tsx`, `src/pages/partner/PendingApproval.tsx`
- Admin: `src/pages/admin/AdminPartnersV2.tsx`, `AdminPartnerTypes.tsx`, `AdminTrades.tsx`
- Route wiring in `src/App.tsx`

**Non-goals for Phase 1**: no changes to Worker or Employer modules beyond adding "Partner" to the signup role picker; no changes to existing E-Mitra tables, rewards logic, or pages (only route mounting).

---

## Deliverable check

- [ ] Existing Worker / Employer / E-Mitra flows untouched and passing smoke tests
- [ ] New partner can sign up, pick a type, submit registration, wait for admin approval
- [ ] Admin can approve/reject/suspend and see all partners with filters
- [ ] SEN partners (E-Mitra) see existing features inside the new shell
- [ ] SSVN partners see the assessment workflow end-to-end
- [ ] Adding a 5th partner type is a config-only change

---

**Scope confirmation**: This is a large multi-day build. I'd like to confirm before starting:
1. Ship Phase 1 as described (Foundation + SEN migration + full SSVN), OR
2. Ship only the Foundation + Partner registration + Admin approval this round, then SSVN next, OR
3. Different phasing?
