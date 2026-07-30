# LSP setup runbook — migrations & go-live

**Audience:** SafeWork internal (founders / ops).  
**Not for LSPs** — give partners `/admin/lsp-docs` sections 1–12 (Integration Kit).

Companion to product kit at `/admin/lsp-docs`. Use this from the repo when deploying LSP changes.

## 1. Order of operations

1. **Apply SQL migration** on the target Supabase project (required).
2. **Deploy frontend** (push / Lovable publish) so `/lsp/*` and `/admin/lsps` exist.
3. **Smoke test** as admin (one-time launch URL).
4. **Rotate secret** and hand credentials to the Rajasthan LSP.
5. LSP implements HMAC (or uses one-time URLs for pilot).

## 2. Apply migration

**File:** `supabase/migrations/20260729100000_lsp_partners.sql`  
**Project ref:** `etpiadoqryvtlpmiuxia` (from `VITE_SUPABASE_PROJECT_ID` / `supabase/config.toml`)

### Option A — Supabase Dashboard (recommended for Lovable)

1. Open [SQL Editor](https://supabase.com/dashboard/project/etpiadoqryvtlpmiuxia/sql/new).
2. Paste the full migration file contents.
3. Run. Expect success; re-run is mostly idempotent.

### Option B — CLI

```bash
cd /path/to/Safeworkglobal
npx supabase login
npx supabase link --project-ref etpiadoqryvtlpmiuxia
npx supabase db push
```

### Verify

```sql
select code, name, status from public.lsp_partners order by code;

select proname from pg_proc
where proname like '%lsp%'
order by 1;

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and column_name in ('source_lsp_id', 'lsp_verified_at');
```

You should see seed LSPs `RJ-CSC-01` and `RJ-EMITRA-01`, plus RPCs such as `verify_lsp_launch`, `admin_create_lsp`, `bind_partner_to_lsp`.

## 3. Frontend

```bash
npm i
npm run dev
```

No new `VITE_*` variables for LSP. Secrets stay in Postgres (`token_secret`); admin RPCs create/rotate them.

Confirm `.env` / production env points at the **same** project you migrated:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## 4. Admin smoke test

1. `/admin/login` → `/admin/lsps`
2. List shows seeded LSPs (or create one).
3. **One-time URL** → open in private window → `/lsp/entry` → `/emitra/login?next=/lsp/verify`
4. `/admin/lsp-docs` loads (admin only).

## 5. Hand-off to LSP

| Item | Where |
|------|--------|
| `lsp` code | Admin LSPs list |
| `TOKEN_SECRET` | Create LSP or **Rotate secret** (shown once) |
| Entry URL | `{origin}/lsp/entry` |
| Spec + samples | `/admin/lsp-docs` — share only Integration · Launch URL · Samples · Errors (not this runbook) |

Do **not** share this runbook or offboarding rules with LSPs.

## 6. E-Mitra continuity (internal — never share with LSPs)

**Product rule:** SafeWork owns the e-Mitra partner account. LSP is a distribution + attribution channel only.

| Situation | What to do |
|-----------|------------|
| LSP suspended / partnership ends | Set LSP status → `suspended`. New launches fail. |
| Approved e-Mitra partners from that LSP | **Keep access.** They login at `/emitra/login` with their own credentials. Do **not** bulk-suspend partners because the LSP left. |
| Partner access | Driven only by `partner_profiles.status` (`approved` / `active`). LSP status is **not** checked on day-to-day e-Mitra login. |
| Attribution / commission | Stop counting **new** activity toward the offboarded LSP; historical `source_lsp_id` on past workers can remain for audit. |
| Rotate secret | Optional after exit so old launch URLs cannot be forged. |

Collect from an LSP only company, contacts, coverage, and technical launch capability — plus a few pilot operators for UAT. Do **not** make the LSP the source of truth for operator identity or passwords.

## 7. Common failures

| Symptom | Fix |
|---------|-----|
| Empty LSP list / missing table | Run migration on correct project |
| Function not found | Migration incomplete; reload PostgREST schema |
| `bad_signature` | Wrong secret or payload order `code\|exp\|nonce\|emitra_id\|mobile` |
| Works locally, fails prod | Different Supabase URL than migrated DB |

## 8. Related docs

- Product / API spec: `docs/lsp-rajasthan-entry.md` (internal)
- In-app guide: `/admin/lsp-docs` (share selective sections with LSP engineering)
- Manage LSPs: `/admin/lsps`
