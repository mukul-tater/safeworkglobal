import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BookOpen, Copy, CheckCircle2, ExternalLink, Shield, Network, ListOrdered, Code2,
} from 'lucide-react';

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://safeworkglobal.com';

function CopyBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            toast.success('Copied');
          }}
        >
          <Copy className="h-3.5 w-3.5 mr-1" /> Copy
        </Button>
      </div>
      <pre className="text-xs md:text-[13px] leading-relaxed overflow-x-auto rounded-lg bg-zinc-950 text-zinc-100 p-4 border border-border">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'deploy', label: '2. Deploy & migrations' },
  { id: 'roles', label: '3. Roles & flow' },
  { id: 'requirements', label: '4. Requirements from LSP' },
  { id: 'onboarding', label: '5. SafeWork onboarding checklist' },
  { id: 'integration', label: '6. Technical integration' },
  { id: 'hmac', label: '7. HMAC launch URL' },
  { id: 'onetime', label: '8. One-time token URL' },
  { id: 'samples', label: '9. Code samples' },
  { id: 'ux', label: '10. Icon & UX requirements' },
  { id: 'security', label: '11. Security' },
  { id: 'uat', label: '12. UAT / pilot acceptance' },
  { id: 'support', label: '13. Ops & support' },
  { id: 'troubleshoot', label: '14. Troubleshooting' },
];

export default function AdminLspDeveloperDocs() {
  const [active, setActive] = useState('overview');

  const hmacNode = useMemo(
    () => `const crypto = require('crypto');

// Issued once by SafeWork admin (Rotate secret / Create LSP). Never put in frontend JS.
const LSP_CODE = 'RJ-CSC-01';
const TOKEN_SECRET = process.env.SAFEWORK_LSP_SECRET;

function buildLaunchUrl({ emitraId = '', mobile = '', ttlSeconds = 900 } = {}) {
  const exp = Math.floor(Date.now() / 1000) + Math.min(ttlSeconds, 900);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = [LSP_CODE, exp, nonce, emitraId || '', mobile || ''].join('|');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload, 'utf8').digest('hex');

  const q = new URLSearchParams({
    lsp: LSP_CODE,
    exp: String(exp),
    nonce,
    sig,
  });
  if (emitraId) q.set('emitra_id', emitraId);
  if (mobile) q.set('mobile', mobile);

  return \`${ORIGIN}/lsp/entry?\${q.toString()}\`;
}

// Use when operator clicks the SafeWork icon:
// res.redirect(buildLaunchUrl({ emitraId, mobile }));
`,
    [],
  );

  const hmacPython = useMemo(
    () => `import hmac, hashlib, os, secrets, time
from urllib.parse import urlencode

LSP_CODE = "RJ-CSC-01"
TOKEN_SECRET = os.environ["SAFEWORK_LSP_SECRET"]  # server-side only
ORIGIN = "${ORIGIN}"

def build_launch_url(emitra_id: str = "", mobile: str = "", ttl_seconds: int = 900) -> str:
    exp = int(time.time()) + min(ttl_seconds, 900)
    nonce = secrets.token_hex(16)
    payload = f"{LSP_CODE}|{exp}|{nonce}|{emitra_id or ''}|{mobile or ''}"
    sig = hmac.new(TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    q = {"lsp": LSP_CODE, "exp": str(exp), "nonce": nonce, "sig": sig}
    if emitra_id:
        q["emitra_id"] = emitra_id
    if mobile:
        q["mobile"] = mobile
    return f"{ORIGIN}/lsp/entry?{urlencode(q)}"
`,
    [],
  );

  const htmlIcon = useMemo(
    () => `<!-- LSP portal: SafeWork app tile. Always open a *fresh* signed URL from your backend. -->
<a href="/api/safework/launch" target="_blank" rel="noopener noreferrer"
   style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none">
  <img src="${ORIGIN}/favicon.ico" alt="SafeWork Global" width="64" height="64" />
  <span>SafeWork Global</span>
</a>

<!-- Backend /api/safework/launch should 302 to the HMAC or one-time URL (never hardcode sig). -->
`,
    [],
  );

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-5xl space-y-6 pb-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">LSP Integration — Developer Guide</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Internal admin-only documentation for partnering with Rajasthan LSPs. Use this when onboarding
              a new LSP company that will show the SafeWork icon on their platform.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">Admin only</Badge>
              <Badge variant="outline">v1 · HMAC + one-time token</Badge>
              <Badge variant="outline">E-Mitra operators</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/lsps">
                <Network className="h-4 w-4 mr-1" /> Manage LSPs
              </Link>
            </Button>
            <Button asChild size="sm">
              <a href="#deploy">
                <ListOrdered className="h-4 w-4 mr-1" /> Deploy steps
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href="#integration">
                <Code2 className="h-4 w-4 mr-1" /> Integration
              </a>
            </Button>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              On this page
            </p>
            <nav className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActive(item.id)}
                  className={`text-sm px-2 py-1.5 rounded-md hover:bg-muted ${
                    active === item.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Section id="overview" title="1. Overview">
          <p className="text-foreground">
            An <strong>LSP (Local Service Provider / aggregator)</strong> is a Rajasthan company whose portal
            lists apps for e-Mitra / CSC operators. SafeWork appears as an icon on their platform. When an
            operator clicks it, they are sent into SafeWork with a <strong>trusted launch</strong>, then
            complete normal partner login + identity verification.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>LSP does <strong>not</strong> replace E-Mitra registration — they are the distribution channel.</li>
            <li>SafeWork remains the system of record for partners, workers, and placements.</li>
            <li>Every launch is attributed to that LSP (`source_lsp_id`) for reporting and commercials.</li>
          </ul>
        </Section>

        <Section id="deploy" title="2. Deploy & run migrations (do this first)">
          <p className="text-foreground font-medium">
            Frontend routes alone are not enough. Without the SQL migration, admin LSP pages and{' '}
            <code>/lsp/entry</code> RPCs will fail.
          </p>

          <p className="text-foreground font-medium pt-1">A. What changed in the repo</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Migration:{' '}
              <code className="text-foreground">supabase/migrations/20260729100000_lsp_partners.sql</code>
            </li>
            <li>
              App routes: <code className="text-foreground">/lsp/entry</code>,{' '}
              <code className="text-foreground">/lsp/verify</code>,{' '}
              <code className="text-foreground">/lsp/denied</code>,{' '}
              <code className="text-foreground">/admin/lsps</code>,{' '}
              <code className="text-foreground">/admin/lsp-docs</code>
            </li>
            <li>
              Module: <code className="text-foreground">src/modules/lsp/*</code> + E-Mitra login/register attribution
            </li>
            <li>
              Spec: <code className="text-foreground">docs/lsp-rajasthan-entry.md</code>, runbook{' '}
              <code className="text-foreground">docs/lsp-setup-runbook.md</code>
            </li>
          </ul>

          <p className="text-foreground font-medium pt-2">B. Apply the database migration (required)</p>
          <p>
            Project ID: <code className="text-foreground">etpiadoqryvtlpmiuxia</code>. Prefer the Dashboard SQL
            editor if you are on Lovable Cloud / do not have CLI linked.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-foreground">
            <li>
              Open{' '}
              <a
                className="text-primary underline"
                href="https://supabase.com/dashboard/project/etpiadoqryvtlpmiuxia/sql/new"
                target="_blank"
                rel="noreferrer"
              >
                Supabase → SQL Editor
              </a>
              .
            </li>
            <li>
              Paste the full contents of{' '}
              <code>supabase/migrations/20260729100000_lsp_partners.sql</code> and click <strong>Run</strong>.
            </li>
            <li>Confirm success (no errors). Re-running is mostly safe (`IF NOT EXISTS` / `ON CONFLICT`).</li>
          </ol>

          <CopyBlock
            title="Optional — Supabase CLI (if project is linked)"
            code={`# From repo root
npx supabase login
npx supabase link --project-ref etpiadoqryvtlpmiuxia
npx supabase db push

# Or apply one file:
# npx supabase db execute -f supabase/migrations/20260729100000_lsp_partners.sql`}
          />

          <CopyBlock
            title="Verify migration in SQL Editor"
            code={`-- Tables
select code, name, status from public.lsp_partners order by code;

-- RPCs exist
select proname from pg_proc
where proname in (
  'verify_lsp_launch',
  'consume_lsp_launch_token',
  'issue_lsp_launch_params',
  'issue_lsp_one_time_token',
  'admin_create_lsp',
  'admin_rotate_lsp_secret',
  'admin_set_lsp_status',
  'bind_partner_to_lsp',
  'resolve_active_lsp_id'
)
order by 1;

-- New columns
select column_name from information_schema.columns
where table_schema = 'public'
  and table_name in ('partner_profiles', 'partner_workers')
  and column_name in ('source_lsp_id', 'lsp_verified_at');`}
          />

          <p className="text-foreground font-medium pt-2">C. Deploy the frontend</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Local:</strong> <code className="text-foreground">npm i && npm run dev</code> — open{' '}
              <code className="text-foreground">/admin/login</code> then{' '}
              <code className="text-foreground">/admin/lsps</code>.
            </li>
            <li>
              <strong>Production / Lovable:</strong> commit &amp; push this branch (or publish from Lovable). No new{' '}
              <code className="text-foreground">VITE_*</code> env vars are required for LSP — secrets live in Postgres,
              not in <code>.env</code>.
            </li>
            <li>
              Existing <code className="text-foreground">VITE_SUPABASE_URL</code> / publishable key must point at the
              same project where you ran the migration.
            </li>
          </ul>

          <p className="text-foreground font-medium pt-2">D. First smoke test after migrate</p>
          <ol className="list-decimal pl-5 space-y-1 text-foreground">
            <li>Admin login → <Link className="text-primary underline" to="/admin/lsps">Rajasthan LSPs</Link>.</li>
            <li>You should see seed rows <code>RJ-CSC-01</code> and <code>RJ-EMITRA-01</code> (or create a new LSP).</li>
            <li>Click <strong>One-time URL</strong> → open the copied link in a private window.</li>
            <li>Expect redirect to partner login, then <code>/lsp/verify</code> after login.</li>
            <li>If admin page is empty / RPC errors → migration not applied or wrong Supabase project.</li>
          </ol>

          <p className="text-foreground font-medium pt-2">E. What you give the LSP after migrate</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-foreground">lsp</code> code (e.g. <code>RJ-CSC-01</code>)</li>
            <li><code className="text-foreground">TOKEN_SECRET</code> (from Create / Rotate — shown once)</li>
            <li>Entry base URL: <code className="text-foreground">{ORIGIN}/lsp/entry</code></li>
            <li>Sections 7–9 of this guide (HMAC / samples) — or export as PDF for their engineers</li>
          </ul>

          <p className="text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md p-3">
            Seeded LSP secrets are random and <strong>not</strong> printed anywhere. Use{' '}
            <strong>Rotate secret</strong> on <Link className="underline" to="/admin/lsps">/admin/lsps</Link> before
            sharing credentials with a real Rajasthan LSP, then store the new secret securely.
          </p>
        </Section>

        <Section id="roles" title="3. Roles & end-to-end flow">
          <div className="rounded-lg border bg-muted/40 p-4 font-mono text-xs text-foreground whitespace-pre overflow-x-auto">
{`LSP portal (Rajasthan)
   └─ SafeWork icon click
        └─ Backend builds signed URL (HMAC or one-time token)
             └─ GET ${ORIGIN}/lsp/entry?...
                  ├─ Validate signature / token (Supabase RPC)
                  ├─ Store LSP session (cookie + sessionStorage, 24h)
                  └─ Redirect → /emitra/login?next=/lsp/verify
                       └─ Partner login (existing)
                            └─ /lsp/verify (E-Mitra ID + OTP)
                                 ├─ Approved → /emitra/dashboard
                                 ├─ New → /emitra/register?source_lsp=CODE
                                 └─ Pending/rejected → blocked`}
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>LSP company</strong> — hosts the icon; signs launches; commercial partner.</li>
            <li><strong>E-Mitra / CSC operator</strong> — logs into SafeWork; registers workers.</li>
            <li><strong>SafeWork admin</strong> — creates LSP in <Link className="text-primary underline" to="/admin/lsps">Rajasthan LSPs</Link>, issues secrets, suspends if needed.</li>
          </ul>
        </Section>

        <Section id="requirements" title="4. Requirements from the LSP (collect before go-live)">
          <p className="text-foreground font-medium">Commercial & legal</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Registered company name, GST (if any), authorized signatory, state (Rajasthan).</li>
            <li>Primary ops contact: name, mobile, email (for incidents & URL issues).</li>
            <li>Contract / MoU: exclusivity, fee model, data processing roles, SLA.</li>
            <li>Districts / blocks they cover (for reporting).</li>
          </ul>
          <p className="text-foreground font-medium pt-2">Technical capability</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Server-side URL generation</strong> — they must call HMAC signing or request one-time tokens from their backend. Static unsigned `?lsp=CODE` links are not accepted in production.</li>
            <li>Ability to store <code className="text-foreground">TOKEN_SECRET</code> in env / secrets manager (never in mobile app or browser JS).</li>
            <li>HTTPS portal; confirm production + staging hostnames.</li>
            <li>Who clicks the icon: <strong>e-Mitra operator only</strong> (v1). Confirm they will not send citizens/workers to this entry.</li>
            <li>Optional but preferred: can they pass operator <code className="text-foreground">emitra_id</code> and <code className="text-foreground">mobile</code> when launching?</li>
            <li>Icon placement: which screen, desktop vs kiosk, deep-link vs new tab.</li>
          </ul>
          <p className="text-foreground font-medium pt-2">Deliverables LSP must provide to SafeWork</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Staging + production portal URLs.</li>
            <li>Screenshot of SafeWork icon placement.</li>
            <li>2–3 pilot operator accounts (mobile + E-Mitra ID) already approved or ready to apply.</li>
            <li>Escalation contact for failed launches within SLA (e.g. 4 business hours).</li>
          </ul>
        </Section>

        <Section id="onboarding" title="5. SafeWork internal onboarding checklist">
          <ol className="list-decimal pl-5 space-y-2 text-foreground">
            <li>Confirm MoU + contacts (section 3).</li>
            <li>Admin → <Link className="text-primary underline" to="/admin/lsps">Rajasthan LSPs</Link> → Create LSP → copy <strong>token secret once</strong> → send securely to LSP (password manager / encrypted channel).</li>
            <li>Set status <Badge className="mx-1" variant="default">active</Badge>.</li>
            <li>Generate a test <strong>HMAC URL</strong> or <strong>One-time URL</strong> from the same admin page; verify entry → login → verify → dashboard.</li>
            <li>Share this Developer Guide link (admin-only) with SafeWork engineers; share a redacted “LSP Partner Kit” (sections 5–9 + secret) with the LSP tech team.</li>
            <li>Pilot 1–2 weeks; then enable commercial reporting by <code>source_lsp_id</code>.</li>
          </ol>
        </Section>

        <Section id="integration" title="6. Technical integration (what LSP builds)">
          <p>
            Minimum integration is one backend endpoint that redirects the authenticated operator to SafeWork:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-foreground">GET /api/safework/launch</code> (or equivalent) on the LSP portal.</li>
            <li>Endpoint must be authenticated as the operator on the LSP side.</li>
            <li>Response: <code className="text-foreground">302</code> to SafeWork <code className="text-foreground">/lsp/entry</code> with either HMAC params or a one-time <code className="text-foreground">token</code>.</li>
            <li>Icon / tile simply links to that LSP endpoint — not directly to a hardcoded SafeWork URL with a fixed signature.</li>
          </ul>
          <p className="text-foreground pt-1">
            SafeWork entry URL base: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{ORIGIN}/lsp/entry</code>
          </p>
        </Section>

        <Section id="hmac" title="7. Option A — HMAC launch URL (recommended)">
          <p>
            Payload string (UTF-8), five fields joined by <code className="text-foreground">|</code>:
          </p>
          <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto">{`lsp_code|exp|nonce|emitra_id|mobile`}</pre>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-foreground">lsp_code</code> — exact code from admin (e.g. <code>RJ-CSC-01</code>), uppercase.</li>
            <li><code className="text-foreground">exp</code> — Unix seconds; must be in the future and ≤ now + 900 (15 min).</li>
            <li><code className="text-foreground">nonce</code> — random hex string (unique per launch).</li>
            <li><code className="text-foreground">emitra_id</code> / <code className="text-foreground">mobile</code> — optional; use empty string in payload if omitted; if present, also add matching query params.</li>
            <li><code className="text-foreground">sig</code> — hex HMAC-SHA256 of the payload using <code>TOKEN_SECRET</code>.</li>
          </ul>
          <p>Query example:</p>
          <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto break-all">
{`${ORIGIN}/lsp/entry?lsp=RJ-CSC-01&exp=1730000000&nonce=abc…&sig=def…&emitra_id=EM123&mobile=98XXXXXXXX`}
          </pre>
          <p className="flex items-start gap-2 text-foreground">
            <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            Validation runs server-side in Supabase RPC <code>verify_lsp_launch</code>. Secrets never ship to the browser.
          </p>
        </Section>

        <Section id="onetime" title="8. Option B — One-time token URL">
          <p>
            Use when the LSP cannot implement HMAC. SafeWork admin generates a token from{' '}
            <Link className="text-primary underline" to="/admin/lsps">Rajasthan LSPs</Link> → <strong>One-time URL</strong>,
            or LSP can later call a dedicated issue API (roadmap).
          </p>
          <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto">
{`${ORIGIN}/lsp/entry?lsp=RJ-CSC-01&token=<raw_token>`}
          </pre>
          <ul className="list-disc pl-5 space-y-1">
            <li>Token is single-use and expires (default 15 minutes).</li>
            <li>Reuse → denied (`token_used`). Expired → denied (`expired`).</li>
            <li>Prefer HMAC for production volume; one-time is fine for pilots and manual tests.</li>
          </ul>
        </Section>

        <Section id="samples" title="9. Code samples for LSP engineers">
          <CopyBlock title="Node.js — HMAC launch URL" code={hmacNode} />
          <CopyBlock title="Python — HMAC launch URL" code={hmacPython} />
          <CopyBlock title="HTML — icon tile (links to LSP backend)" code={htmlIcon} />
        </Section>

        <Section id="ux" title="10. Icon & UX requirements">
          <ul className="list-disc pl-5 space-y-1">
            <li>Label: <strong>SafeWork Global</strong> (or bilingual HI/EN if their UI supports it).</li>
            <li>Open in a new tab/window when possible so the LSP portal session stays intact.</li>
            <li>Do not cache signed URLs in the browser for more than a few seconds — always mint on click.</li>
            <li>If launch fails, show SafeWork denied page reason; LSP support should tell operators to retry from the icon (new signature).</li>
            <li>Brand assets: use SafeWork favicon / logo from production; do not alter colors for the pilot tile.</li>
          </ul>
        </Section>

        <Section id="security" title="11. Security rules (non-negotiable)">
          <ul className="list-disc pl-5 space-y-1">
            <li>Never embed <code className="text-foreground">TOKEN_SECRET</code> in Android/iOS apps, SPA bundles, or public repos.</li>
            <li>Rotate secret immediately if leaked (Admin → Rotate secret) and re-issue to LSP.</li>
            <li>Suspend LSP in admin to kill new launches without deleting history.</li>
            <li>Launch TTL ≤ 15 minutes; session attribution cookie lasts 24 hours after a successful entry.</li>
            <li>v1 audience is partners only — do not point citizen/worker journeys at <code>/lsp/entry</code>.</li>
            <li>OTP on verify may be demo on staging; production must use real SMS before public pilot scale-up.</li>
          </ul>
        </Section>

        <Section id="uat" title="12. UAT / pilot acceptance">
          <div className="space-y-2">
            {[
              'Active LSP signed URL opens /lsp/entry without 404',
              'Expired or bad signature lands on /lsp/denied',
              'Suspended LSP cannot launch',
              'Approved partner completes /lsp/verify → /emitra/dashboard',
              'partner_profiles.source_lsp_id and lsp_verified_at set',
              'New partner_workers rows carry source_lsp_id while LSP session is active',
              'New operator can start /emitra/register?source_lsp=CODE from verify screen',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="support" title="13. Ops, reporting & support">
          <ul className="list-disc pl-5 space-y-1">
            <li>Launch attempts are logged in <code className="text-foreground">lsp_launch_logs</code> (success/fail reason).</li>
            <li>Commercial reports: filter partners/workers by <code className="text-foreground">source_lsp_id</code>.</li>
            <li>Denied reasons operators may see: <code>expired</code>, <code>bad_signature</code>, <code>token_used</code>, <code>lsp_not_active</code>, <code>no_session</code>.</li>
            <li>SafeWork admin contacts: use internal escalation; do not publish personal numbers in LSP kits without approval.</li>
            <li>Related routes: <code>/admin/lsps</code>, <code>/lsp/entry</code>, <code>/lsp/verify</code>, <code>/lsp/denied</code>, <code>/emitra/login</code>.</li>
          </ul>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/lsps">
                <ListOrdered className="h-4 w-4 mr-1" /> Open LSP admin
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`${ORIGIN}/lsp/denied?reason=expired`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> Preview denied page
              </a>
            </Button>
          </div>
        </Section>

        <Section id="troubleshoot" title="14. Troubleshooting">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Admin LSPs page empty / “relation does not exist”</strong> —
              migration not run on this Supabase project. Apply{' '}
              <code className="text-foreground">20260729100000_lsp_partners.sql</code> (section 2).
            </li>
            <li>
              <strong className="text-foreground">RPC error / function not found</strong> — same cause; also
              click <strong>Reload schema</strong> in Supabase API settings if PostgREST is stale, or wait ~30s
              after <code>NOTIFY pgrst</code>.
            </li>
            <li>
              <strong className="text-foreground">Launch → bad_signature</strong> — payload order wrong, wrong
              secret, or <code>lsp</code> code case mismatch. Payload must be{' '}
              <code className="text-foreground">CODE|exp|nonce|emitra_id|mobile</code> with empty strings when optional
              fields are omitted.
            </li>
            <li>
              <strong className="text-foreground">Launch → expired / exp_too_far</strong> — clock skew or TTL &gt; 15
              minutes. Keep <code>exp</code> ≤ now + 900.
            </li>
            <li>
              <strong className="text-foreground">Works locally, fails in production</strong> — frontend pointed at
              a different <code>VITE_SUPABASE_URL</code> than where you migrated.
            </li>
            <li>
              <strong className="text-foreground">bind_partner_to_lsp fails</strong> — partner not{' '}
              <code>approved</code>/<code>active</code>, or E-Mitra ID mismatch.
            </li>
          </ul>
        </Section>

        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground">
            This page is available only to authenticated admins (<code>/admin/lsp-docs</code>).
            It is not linked from the public site. Last aligned with migration{' '}
            <code>20260729100000_lsp_partners.sql</code>.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
