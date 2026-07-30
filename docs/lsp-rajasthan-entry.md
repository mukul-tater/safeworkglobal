# LSP → SafeWork Entry (Rajasthan)

> **Status:** Implemented (v1) — apply migration `20260729100000_lsp_partners.sql` in Supabase  
> **Goal:** Rajasthan LSP portals show a SafeWork icon; click opens SafeWork with trusted entry + partner verification; operators land in the E-Mitra portal.  
> **Date:** July 2026  
> **How to deploy:** see [lsp-setup-runbook.md](./lsp-setup-runbook.md) and admin page `/admin/lsp-docs` §2

---

## 1. Verdict: are we ready?

**No.** Login and E-Mitra partner approval exist. LSP launch + attribution + post-login verification do **not**.

| Capability | Today | Needed for LSP |
|------------|-------|----------------|
| Partner / E-Mitra login (`/emitra/login`) | ✅ Mobile OTP (demo) + email/password; blocks non-approved | Reuse |
| Partner apply + admin approve (`partner_profiles`, `emitra_id`, `partner_code`) | ✅ | Reuse |
| E-Mitra worker registration | ✅ `/emitra/onboard-worker` | Reuse |
| LSP catalog (Rajasthan companies) | ❌ | New |
| Signed / tokenized deep-link from LSP platform | ❌ | New |
| `/lsp/entry` landing + session attribution | ❌ | New |
| Post-login verify (OTP + E-Mitra ID tied to LSP) | ❌ Partial (OTP on login only; no E-Mitra ID step; no LSP link) | Extend |
| Tag workers / partners with `source_lsp_id` | ❌ | New |

**Estimate to v1 pilot:** ~5–8 engineering days after LSP confirms who clicks and whether they can sign tokens.

---

## 2. Product model

```
Rajasthan LSP company portal
        │
        │  SafeWork app icon
        ▼
https://safeworkglobal.com/lsp/entry?lsp=<code>&token=<one-time>
        │
        ├─ Validate LSP + token
        ├─ Store source_lsp in session / cookie
        ▼
Login (/emitra/login or /auth) — existing
        │
        ▼
Verify (NEW) — OTP (if not already) + E-Mitra ID
        │
        ├─ approved partner → /emitra/dashboard
        ├─ no profile → /emitra/register (prefill + source_lsp)
        └─ pending / rejected → blocked message
```

- **LSP** = Rajasthan company that surfaces SafeWork to e-Mitra centers (distribution channel).
- **E-Mitra partner** = operator who registers workers inside SafeWork.
- Clicking the icon does **not** replace login; it proves the launch came from an approved LSP and attributes activity to that LSP.

### Ownership & continuity (internal — do not put in LSP-facing kit)

- SafeWork owns partner identity and login (`/emitra/login`). LSP does **not** issue or revoke SafeWork credentials.
- `source_lsp_id` is **attribution** for reporting / commercials — not exclusive control of the operator.
- Suspend / offboard an LSP → block **new launches** only. Approved partners keep working unless SafeWork suspends that partner for cause.
- Ask LSP for company + tech + pilot contacts — not a full operator roster as account ownership.
- Full offboarding checklist: [lsp-setup-runbook.md](./lsp-setup-runbook.md) §6.

---

## 3. Decisions to lock with LSP (before build)

1. Who clicks the icon — e-Mitra operator only, citizen/worker, or both?  
   → **Default for v1:** operator only (partner role).
2. Can LSP issue a **short-lived signed token**, or only a static URL with `lsp_code`?  
   → Prefer signed token; static `lsp_code` alone is forgeable (acceptable only for closed pilot).
3. Does LSP know operator mobile / E-Mitra ID so they can prefill query params?
4. First-time operators: self-register under that LSP, or allowlist only?

---

## 4. Data model (new)

### 4.1 `lsp_partners` (Rajasthan LSP companies)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `code` | text UNIQUE | e.g. `RJ-CSC-01` — used in URL |
| `name` | text | Company name |
| `state` | text | Default `Rajasthan` |
| `contact_name` / `contact_mobile` / `contact_email` | text | Ops contact |
| `status` | text | `pending` \| `active` \| `suspended` |
| `token_secret` | text | Server-only; HMAC for launch tokens (or store hash) |
| `allowed_origins` | text[] | Optional: LSP portal hostnames |
| `metadata` | jsonb | Contract id, districts, etc. |
| `created_at` / `updated_at` | timestamptz | |

Admin CRUD: create LSP, rotate secret, activate/suspend.

### 4.2 `lsp_launch_tokens` (optional but recommended)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `lsp_id` | uuid FK → `lsp_partners` | |
| `token_hash` | text UNIQUE | Store hash of one-time token |
| `expires_at` | timestamptz | e.g. 5–15 minutes |
| `used_at` | timestamptz nullable | One-time use |
| `payload` | jsonb | Optional: `emitra_id`, `mobile` prefills from LSP |

**Alternative (no table):** HMAC URL  
`token = base64url(payload).base64url(hmac_sha256(secret, payload))`  
with `payload = { lsp, exp, nonce, emitra_id?, mobile? }`. Prefer HMAC for fewer moving parts if LSP can sign.

### 4.3 Attribution on existing tables

```sql
-- partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS source_lsp_id uuid REFERENCES public.lsp_partners(id),
  ADD COLUMN IF NOT EXISTS lsp_verified_at timestamptz;

-- partner_workers (and/or worker_profiles when unified)
ALTER TABLE public.partner_workers
  ADD COLUMN IF NOT EXISTS source_lsp_id uuid REFERENCES public.lsp_partners(id);
```

When an operator registers a worker after an LSP launch, copy `source_lsp_id` from the partner session onto the worker row (commission / reporting).

---

## 5. Routes & pages to build

| Route | Purpose |
|-------|---------|
| `GET /lsp/entry` | Public landing: validate `lsp` + `token`, set session cookie `sw_lsp`, redirect to login or verify |
| `/lsp/verify` | Post-login: confirm mobile OTP (if needed) + E-Mitra ID; bind `source_lsp_id`; set `lsp_verified_at` |
| `/admin/lsps` | Admin: list/create/activate LSPs, rotate secrets, view launch stats |
| (optional) `/lsp/denied` | Expired/invalid token / suspended LSP |

### Reuse as-is

- `/emitra/login` — after successful LSP entry, redirect here with `?next=/lsp/verify`
- `/emitra/register` — first-time; pass `source_lsp` in query/state
- `/emitra/dashboard` — after verify + approved
- Partner approval admin — unchanged; optionally show `source_lsp`

### Files (suggested)

```
src/modules/lsp/
  pages/LspEntryPage.tsx
  pages/LspVerifyPage.tsx
  pages/LspDeniedPage.tsx
  services/lspToken.ts          # verify HMAC or lookup one-time token
  services/lspSession.ts        # cookie / sessionStorage helpers
  types/lsp.types.ts

src/pages/admin/AdminLsps.tsx

supabase/migrations/YYYYMMDD_lsp_partners.sql
supabase/functions/lsp-issue-token/   # optional: LSP calls this with API key
# OR document server-side HMAC for LSP to implement themselves
```

Wire routes in `src/App.tsx` next to existing `/emitra/*` routes.

---

## 6. Verification rules (v1)

After login, on `/lsp/verify`:

1. Session must contain valid `source_lsp_id` from `/lsp/entry` (not expired; e.g. 24h cookie).
2. User role must be `partner` (or prompt to apply).
3. Collect / confirm:
   - **Mobile** — OTP via existing Firebase / partner OTP path (replace demo OTP before production).
   - **E-Mitra ID** — must match `partner_profiles.emitra_id` for this user, **or** be entered during first-time register and stored.
4. Partner `status` must be operational (`approved` / whatever `isPartnerOperational` uses today).
5. On success: set `partner_profiles.source_lsp_id`, `lsp_verified_at = now()`, navigate to `/emitra/dashboard`.

**Do not** treat a bare `?lsp=RJ-XXX` without signature/token as verified launch in production.

---

## 7. What to give each Rajasthan LSP

1. **Icon asset** + brand guidelines.
2. **Launch URL pattern** (HMAC example):

```
https://safeworkglobal.com/lsp/entry?lsp=RJ-CSC-01&exp=1730000000&sig=<hmac>
```

3. **Signing recipe** (HMAC-SHA256 of `lsp|exp|nonce` with shared secret), or REST:

```http
POST /functions/v1/lsp-issue-token
Authorization: Bearer <lsp_api_key>
{ "emitra_id": "optional", "mobile": "optional" }
→ { "url": "https://safeworkglobal.com/lsp/entry?..." }
```

4. **Pilot checklist:** staging URL, test `lsp_code`, sample operator accounts, success = operator reaches E-Mitra dashboard with `source_lsp` set.

---

## 8. Implementation phases

### Phase A — Foundation (2–3 days)

- [x] Migration: `lsp_partners`, columns on `partner_profiles` / `partner_workers`
- [x] Seed 1–2 inactive LSPs for Rajasthan pilot
- [x] `LspEntryPage` + HMAC (or one-time token) validation
- [x] Session cookie `sw_lsp={lsp_id, exp}`
- [x] Admin list page (create/activate/rotate secret)

### Phase B — Verify + wire E-Mitra (2–3 days)

- [x] `LspVerifyPage` (OTP + E-Mitra ID)
- [x] Redirect chain: entry → login → verify → dashboard
- [x] Prefill register with `source_lsp_id`
- [x] Copy `source_lsp_id` onto new `partner_workers`
- [ ] Replace demo OTP on this path with real SMS (Firebase or MSG91)

### Phase C — Pilot ops (1–2 days)

- [ ] LSP onboarding doc + sample HTML “icon → launch”
- [ ] Admin report: partners / workers by LSP
- [ ] Suspend LSP kills new launches; existing sessions expire naturally
- [x] Continuity: partner login independent of LSP status (documented in runbook §6)

### Out of scope for v1

- Full SSO (SAML/OIDC) with LSP IdP  
- Worker (citizen) self-serve via LSP icon  
- DigiLocker / paid eKYC on LSP entry  
- Mobile native app deep links (web URL first)

---

## 9. Security notes

- Never put `token_secret` in frontend env; verify on Edge Function or verify HMAC with secret only on server.
- One-time or short `exp` (≤15 min) for launch tokens.
- Rate-limit `/lsp/entry` and verify OTP.
- Log launches: `lsp_id`, timestamp, success/fail reason (no raw secrets).
- RLS: partners read only their row; only admin manages `lsp_partners`.

---

## 10. Acceptance criteria (pilot done)

1. Active LSP can open a signed URL and land on SafeWork without a 404.
2. Invalid / expired token shows denied page; no dashboard access.
3. Approved E-Mitra partner completes verify and reaches `/emitra/dashboard`.
4. `partner_profiles.source_lsp_id` and `lsp_verified_at` are set.
5. Worker registered in that session has `source_lsp_id` populated.
6. Suspended LSP cannot create new valid launches.
7. After LSP suspend, an already-approved partner can still reach `/emitra/dashboard` via direct `/emitra/login` (LSP status not required for day-to-day access).

---

## 11. Related existing code (reuse)

| Area | Path |
|------|------|
| E-Mitra login | `src/modules/emitra/pages/EmitraLoginPage.tsx` |
| Partner operational check | `src/modules/emitra/services/emitraService.ts` (`isPartnerOperational`) |
| Partner apply | `src/modules/emitra/pages/EmitraRegisterPage.tsx` |
| Partner approvals | `src/pages/admin/PartnerApprovals.tsx` |
| `emitra_id` / `partner_code` | `supabase/migrations/20260607180000_partner_profiles_emitra_columns.sql` |
| Firebase OTP (workers) | `src/modules/worker-registration/hooks/useFirebasePhoneOtp.ts` — pattern to reuse for partners |

---

## 12. Next action

1. Confirm with Rajasthan LSP: operator-only + signed token vs static code.  
2. Implement **Phase A** migration + `/lsp/entry`.  
3. Then **Phase B** verify screen wired to existing `/emitra/login`.
