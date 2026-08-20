# Admin-Controlled Employer Access to Workers

## Today's behaviour (analysis)

- Employers call a single backend function (`list_public_workers`) that returns **every** public worker profile, then filter client-side (`SearchWorkers.tsx`, `RecommendedWorkers.tsx`, `Workers.tsx`). There is no per-employer scoping.
- Detailed worker data comes from `get_worker_profile_for_employer`, which allows access only when the worker applied to the employer's job. Field selection is hardcoded — admin cannot tune it per employer.
- Employer identity today = one auth user (`employer_profiles.user_id`). There is no employer *organisation* entity, so any per-employer config keyed to a user id would need rework when multiple users per employer arrive.

## Proposed architecture

### 1. Employer organisation layer (future-proofing, no behaviour change)
Introduce `employer_organizations` and `employer_org_members` (member row carries `role`: owner / hr / recruiter / supervisor, plus a `permissions` jsonb for later granularity). Every existing employer gets an auto-created org with the current user as `owner`. All access config below is keyed to **org id**, never to a user id — so adding multiple users later requires zero schema change: they just become members.

### 2. Worker assignment — support BOTH individual and rule-based
Two complementary tables:

- `employer_worker_assignments` (org_id, worker_user_id, assigned_by, note) — explicit, curated grants. Highest precedence, supports revoke.
- `employer_worker_access_rules` (org_id, rule_type, rule_value) — declarative bulk grants such as `trade = Welder`, `state = Rajasthan`, `verification_stage = gcc_ready`. Lets admin say "all welders and carpenters" without picking 400 rows, and new matching workers become visible automatically.

Effective visibility = explicit assignments ∪ rule matches, minus an explicit `revoked` flag on the assignment row. Employers can never browse outside this set.

### 3. Field visibility per employer
`employer_field_visibility` (org_id, field_key, visible). Field keys come from a single server-side catalogue (`employer_visible_field_catalog`) grouping fields into: identity/basic, contact, trade & experience, documents (Aadhaar/PAN/passport), medical, salary, family. Absent row = platform default (safe: PII hidden). Admin toggles per employer; sensitive groups default off.

### 4. Backend enforcement
All employer worker reads go through SECURITY DEFINER functions that resolve the caller's org, compute the assignment set, and **build the row from the visibility map** — restricted columns are returned as `null`/omitted, never fetched into the response:

- `employer_list_workers(filters…, limit, offset)`
- `employer_get_worker(worker_user_id)`
- `employer_visible_fields()` — so the UI knows what to render

Direct table SELECT on `worker_profiles` / `worker_documents` etc. stays closed to the employer role (RLS unchanged or tightened). Admin-side config tables are admin-only via `has_role(auth.uid(),'admin')`.

### 5. Frontend changes
- `SearchWorkers.tsx`, `RecommendedWorkers.tsx`, `WorkerShortlist.tsx`, application/worker detail views switch from `list_public_workers` to `employer_list_workers` / `employer_get_worker`; filters move server-side.
- Field rendering becomes driven by `employer_visible_fields()` — hidden fields simply don't render (no "•••" leaking existence of data unless admin allows).
- New admin screens: **Employer Access** — worker assignment (search + bulk assign by trade/individual) and a field-visibility toggle matrix per employer.

### 6. Security
- Deny-by-default: no config = no workers visible.
- Enforcement in the database function, not the client; RLS blocks direct reads.
- Assignment/visibility writes admin-only, audited via `admin_actions`.
- Aadhaar/PAN/passport/medical remain off unless explicitly enabled per employer.

## Delivery phases

1. **Schema + enforcement core** — org tables & backfill, assignment tables, field visibility, catalogue, RPCs. No UI change; existing pages keep working.
2. **Admin control panel** — assign workers (individual + rule), field-visibility matrix, per-employer preview of what the employer sees.
3. **Employer portal switchover** — worker search/detail/shortlist/recommended read through the new RPCs with dynamic field rendering.
4. **Cleanup & hardening** — remove employer usage of `list_public_workers`, tighten RLS, add audit entries, verify each employer sees only their set.

## Technical notes

- All new public tables get explicit GRANTs plus RLS with admin-write / member-read-own-org policies.
- `current_employer_org()` helper (SECURITY DEFINER, stable) resolves org from `auth.uid()` via `employer_org_members`; every RPC uses it, so future multi-user employers work unchanged.
- Assignment resolution lives in one function (`employer_visible_worker_ids(org_id)`) reused by list/detail/count paths, so no path can bypass it.
