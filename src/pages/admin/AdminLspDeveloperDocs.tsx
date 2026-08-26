import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BookOpen, Copy, CheckCircle2, ExternalLink, Shield, Network, Code2,
  Building2, UserCog, Workflow,
} from 'lucide-react';

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://safeworkglobal.com';

function CopyBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
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
      <h2 className="text-xl font-semibold tracking-tight border-b pb-2">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pt-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

const TOC = [
  { id: 'intro', label: 'Introduction' },
  { id: 'audiences', label: 'Who should read this' },
  { id: 'concepts', label: 'Core concepts' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'admin-needs', label: 'What we need from an LSP' },
  { id: 'credentials', label: 'Credentials & console' },
  { id: 'integration', label: 'Integration guide' },
  { id: 'launch-api', label: 'Launch URL contract' },
  { id: 'samples', label: 'Code samples' },
  { id: 'bridge', label: 'Building the bridge (devs)' },
  { id: 'test', label: 'Test & go-live' },
  { id: 'errors', label: 'Error reference' },
];

export default function AdminLspDeveloperDocs() {
  const [active, setActive] = useState('intro');

  const hmacNode = useMemo(
    () => `const crypto = require('crypto');

const LSP_CODE = process.env.SAFEWORK_LSP_CODE;       // e.g. RJ-CSC-01
const TOKEN_SECRET = process.env.SAFEWORK_LSP_SECRET; // from SafeWork admin
const ORIGIN = '${ORIGIN}';

/**
 * Call this on every SafeWork icon click (operator already authenticated on LSP portal).
 */
function buildSafeWorkLaunchUrl({ emitraId = '', mobile = '' } = {}) {
  const exp = Math.floor(Date.now() / 1000) + 900; // max 15 minutes
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = [LSP_CODE, String(exp), nonce, emitraId || '', mobile || ''].join('|');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  const q = new URLSearchParams({ lsp: LSP_CODE, exp: String(exp), nonce, sig });
  if (emitraId) q.set('emitra_id', emitraId);
  if (mobile) q.set('mobile', mobile);
  return \`\${ORIGIN}/lsp/entry?\${q.toString()}\`;
}

// Express example:
// app.get('/api/safework/launch', requireOperatorAuth, (req, res) => {
//   res.redirect(302, buildSafeWorkLaunchUrl({
//     emitraId: req.operator.emitraId,
//     mobile: req.operator.mobile,
//   }));
// });
`,
    [],
  );

  const hmacPython = useMemo(
    () => `import hmac, hashlib, os, secrets, time
from urllib.parse import urlencode

LSP_CODE = os.environ["SAFEWORK_LSP_CODE"]
TOKEN_SECRET = os.environ["SAFEWORK_LSP_SECRET"]
ORIGIN = "${ORIGIN}"

def build_safework_launch_url(emitra_id: str = "", mobile: str = "") -> str:
    exp = int(time.time()) + 900
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
    () => `<!-- LSP portal UI: tile always hits YOUR backend, never a static signed SafeWork URL -->
<a href="/api/safework/launch" target="_blank" rel="noopener noreferrer">
  <img src="${ORIGIN}/favicon.ico" width="64" height="64" alt="SafeWork Global" />
  <span>SafeWork Global</span>
</a>
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
      <div className="max-w-5xl space-y-8 pb-16">
        {/* Hero — Razorpay-style product docs feel */}
        <header className="space-y-4 border-b pb-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Private docs</Badge>
            <Badge variant="outline">Admin · LSP · Developer</Badge>
            <Badge variant="secondary">v1</Badge>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">SafeWork LSP Developer Guide</h1>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">
                Platform documentation for integrating Rajasthan LSP portals with SafeWork Global —
                the same role a Razorpay / Stripe developer guide plays for payments. Use it to
                onboard an LSP, understand what we need from them, and build the technical bridge.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button asChild>
                <a href="#integration">
                  <Code2 className="h-4 w-4 mr-1" /> Start integrating
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/lsps">
                  <Network className="h-4 w-4 mr-1" /> LSP console
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <Card>
          <CardContent className="p-4 md:p-5 grid sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <UserCog className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">SafeWork admin</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Know what to collect from an LSP and how to issue credentials.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">LSP provider</p>
                <p className="text-xs text-muted-foreground mt-1">
                  See our structure and implement the signed launch from your portal.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Workflow className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">New developer</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Build / maintain the bridge between SafeWork and each new LSP.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              On this page
            </p>
            <nav className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
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

        <Section id="intro" title="Introduction">
          <p className="text-foreground">
            An <strong>LSP (Local Service Provider)</strong> is a Rajasthan company whose software portal
            already reaches e-Mitra / CSC operators. SafeWork appears on that portal as an app icon.
            When an operator clicks it, they enter SafeWork through a <strong>trusted launch</strong>,
            then complete SafeWork partner login and verification before using E-Mitra features
            (register workers, dashboard, and so on).
          </p>
          <p>
            This guide is <strong className="text-foreground">private</strong> (admin-authenticated). It is
            not a public marketing page. When sharing with an LSP, send only the integration sections below —
            not internal admin checklists or ops runbooks.
          </p>
        </Section>

        <Section id="audiences" title="Who should read this">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="p-3 font-medium">Reader</th>
                  <th className="p-3 font-medium">Goal</th>
                  <th className="p-3 font-medium">Focus sections</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 text-foreground font-medium">SafeWork admin</td>
                  <td className="p-3">Partner with an LSP; know requirements; issue codes/secrets</td>
                  <td className="p-3">Concepts · What we need · Credentials · Test</td>
                </tr>
                <tr>
                  <td className="p-3 text-foreground font-medium">LSP provider</td>
                  <td className="p-3">Ship icon + signed launch into SafeWork</td>
                  <td className="p-3">
                    Concepts · Architecture · Integration · Launch URL · Samples · Errors
                    (safe to share)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-foreground font-medium">SafeWork developer</td>
                  <td className="p-3">Wire a new LSP into our platform end-to-end</td>
                  <td className="p-3">Architecture · Bridge · Credentials · Errors</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="concepts" title="Core concepts">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">LSP</strong> — portal that surfaces the SafeWork icon and
              issues a trusted launch. Operator and worker records live in SafeWork.
            </li>
            <li>
              <strong className="text-foreground">E-Mitra partner</strong> — operator with a SafeWork partner
              account who registers workers after launch + login + verify.
            </li>
            <li>
              <strong className="text-foreground">Trusted launch</strong> — short-lived HMAC (or one-time token)
              proving the click came from an approved LSP.
            </li>
            <li>
              <strong className="text-foreground">Attribution</strong> — <code>source_lsp_id</code> on partner /
              worker records so activity can be linked to the launching LSP for reporting.
            </li>
          </ul>
        </Section>

        <Section id="architecture" title="Architecture">
          <p className="text-foreground font-medium">High-level flow</p>
          <div className="rounded-lg border bg-muted/40 p-4 font-mono text-[11px] md:text-xs text-foreground whitespace-pre overflow-x-auto leading-relaxed">
{`┌─────────────────────┐         signed URL          ┌──────────────────────────┐
│  LSP portal         │  ─────────────────────────► │  SafeWork Global         │
│  (Rajasthan)        │     /lsp/entry?lsp&sig…     │                          │
│  • SafeWork icon    │                             │  1. Validate launch      │
│  • Operator session │                             │  2. Partner login        │
│  • Launch API       │                             │  3. /lsp/verify          │
└─────────────────────┘                             │  4. E-Mitra dashboard    │
                                                    │  5. Attribute to LSP     │
                                                    └──────────────────────────┘`}
          </div>
          <Sub title="SafeWork surfaces involved">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code className="text-foreground">/lsp/entry</code> — public entry; validates launch
              </li>
              <li>
                <code className="text-foreground">/emitra/login</code> — existing partner auth (
                <code>?next=/lsp/verify</code>)
              </li>
              <li>
                <code className="text-foreground">/lsp/verify</code> — E-Mitra ID + OTP; binds LSP
              </li>
              <li>
                <code className="text-foreground">/emitra/*</code> — partner product (workers, rewards, …)
              </li>
              <li>
                <code className="text-foreground">/admin/lsps</code> — issue / suspend LSPs (SafeWork only)
              </li>
            </ul>
          </Sub>
        </Section>

        <Section id="admin-needs" title="What we need from an LSP (SafeWork admin checklist)">
          <p>
            <strong className="text-foreground">Internal only</strong> — do not paste this section into LSP
            handouts. Confirm the partnership can deliver a real integration — not only a logo on a slide.
            Collect company and launch details; operators create and verify their own SafeWork accounts.
          </p>
          <Sub title="Commercial / ops">
            <ul className="list-disc pl-5 space-y-1">
              <li>Legal company name, authorized signatory, state (Rajasthan)</li>
              <li>Primary technical + ops contacts (name, mobile, email)</li>
              <li>Districts / coverage for reporting</li>
              <li>MoU terms: fee model, data roles, exclusivity if any</li>
            </ul>
          </Sub>
          <Sub title="Technical capability">
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS portal with a place for a SafeWork app icon</li>
              <li>
                Ability to run a <strong className="text-foreground">server-side</strong> launch endpoint
                (HMAC signing or consume one-time tokens)
              </li>
              <li>Secret storage (env / vault) — not client JS</li>
              <li>
                Audience = <strong className="text-foreground">e-Mitra operators only</strong> (v1)
              </li>
              <li>
                Prefills on launch: operator <code>emitra_id</code> + <code>mobile</code> (not a
                bulk operator database)
              </li>
            </ul>
          </Sub>
          <Sub title="Go-live deliverables from LSP">
            <ul className="list-disc pl-5 space-y-1">
              <li>Staging + production portal URLs</li>
              <li>Screenshot of icon placement</li>
              <li>2–3 pilot operators (mobile + E-Mitra ID) for UAT only</li>
              <li>Escalation contact for launch failures during pilot</li>
            </ul>
          </Sub>
        </Section>

        <Section id="credentials" title="Credentials & console">
          <p>
            SafeWork admin creates the LSP in{' '}
            <Link className="text-primary underline" to="/admin/lsps">
              Rajasthan LSPs
            </Link>
            . Share over a secure channel only:
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Example</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-mono text-foreground">LSP_CODE</td>
                  <td className="p-3 font-mono">RJ-CSC-01</td>
                  <td className="p-3">Public in URLs; identifies the LSP</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">TOKEN_SECRET</td>
                  <td className="p-3">hex string</td>
                  <td className="p-3">Shown once; rotate if leaked</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">Entry base</td>
                  <td className="p-3 font-mono text-xs">{ORIGIN}/lsp/entry</td>
                  <td className="p-3">All launches hit this path</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Console also generates test <strong className="text-foreground">HMAC</strong> and{' '}
            <strong className="text-foreground">one-time</strong> URLs for UAT without LSP code yet.
          </p>
        </Section>

        <Section id="integration" title="Integration guide (LSP provider)">
          <p className="text-foreground font-medium">Minimum viable integration</p>
          <ol className="list-decimal pl-5 space-y-2 text-foreground">
            <li>Add a “SafeWork Global” icon on the operator home / apps grid.</li>
            <li>
              Icon → <code>GET /api/safework/launch</code> (or equivalent) on <em>your</em> backend, behind
              operator auth.
            </li>
            <li>Backend builds a fresh HMAC launch URL (see Launch URL contract).</li>
            <li>
              Respond <code>302</code> to that URL (prefer <code>target="_blank"</code> from the UI).
            </li>
            <li>
              Operator signs in on SafeWork and completes verify; then uses E-Mitra features in SafeWork.
            </li>
          </ol>
          <p>
            Do not embed a pre-signed SafeWork URL in static HTML — signatures expire within 15 minutes.
            <code>emitra_id</code> / <code>mobile</code> on the launch URL are prefills only;
            the operator still authenticates on SafeWork.
          </p>
        </Section>

        <Section id="launch-api" title="Launch URL contract">
          <Sub title="Option A — HMAC (production)">
            <p>
              Target: <code className="text-foreground">{ORIGIN}/lsp/entry</code>
            </p>
            <p className="text-foreground">
              Signing payload (UTF-8), five fields joined by <code>|</code>:
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto">
{`LSP_CODE|exp|nonce|emitra_id|mobile`}
            </pre>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>exp</code> — Unix seconds; must be in the future and ≤ now + 900
              </li>
              <li>
                <code>nonce</code> — unique per click
              </li>
              <li>
                <code>emitra_id</code> / <code>mobile</code> — empty string in payload if unused;
                if set, also pass as query params
              </li>
              <li>
                <code>sig</code> — hex <code>HMAC-SHA256(payload, TOKEN_SECRET)</code>
              </li>
            </ul>
            <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto break-all">
{`${ORIGIN}/lsp/entry?lsp=RJ-CSC-01&exp=…&nonce=…&sig=…&emitra_id=…&mobile=…`}
            </pre>
          </Sub>
          <Sub title="Option B — One-time token (pilot)">
            <pre className="text-xs bg-muted p-3 rounded-md text-foreground overflow-x-auto">
{`${ORIGIN}/lsp/entry?lsp=LSP_CODE&token=<single_use_token>`}
            </pre>
            <p>Single use · ~15 min TTL. Prefer HMAC before scale.</p>
          </Sub>
        </Section>

        <Section id="samples" title="Code samples">
          <CopyBlock title="Node.js — launch URL builder" code={hmacNode} />
          <CopyBlock title="Python — launch URL builder" code={hmacPython} />
          <CopyBlock title="HTML — icon tile" code={htmlIcon} />
        </Section>

        <Section id="bridge" title="Building the bridge (SafeWork developers)">
          <p>
            When onboarding a <strong className="text-foreground">new</strong> LSP, your job is to connect their
            portal to our entry path — not to rewrite E-Mitra.
          </p>
          <Sub title="Standard bridge checklist">
            <ol className="list-decimal pl-5 space-y-1 text-foreground">
              <li>Confirm admin checklist (What we need from an LSP).</li>
              <li>
                Create LSP in <Link className="text-primary underline" to="/admin/lsps">/admin/lsps</Link> →
                copy secret once → deliver credentials + this guide.
              </li>
              <li>Help LSP implement launch API using samples above.</li>
              <li>UAT with one-time or HMAC URL → login → verify → dashboard.</li>
              <li>
                Confirm <code>source_lsp_id</code> on partner after verify and on new{' '}
                <code>partner_workers</code>.
              </li>
              <li>Mark LSP active; monitor denied reasons during pilot.</li>
            </ol>
          </Sub>
          <Sub title="Code map in this repo">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>src/modules/lsp/</code> — entry, session, verify, deny
              </li>
              <li>
                <code>src/pages/admin/AdminLsps.tsx</code> — credentials console
              </li>
              <li>
                <code>EmitraLoginPage</code> — <code>?next=/lsp/verify</code>
              </li>
              <li>
                RPCs: <code>verify_lsp_launch</code>, <code>consume_lsp_launch_token</code>,{' '}
                <code>bind_partner_to_lsp</code>, …
              </li>
              <li>
                Schema: migration <code>20260729100000_lsp_partners.sql</code>
              </li>
            </ul>
          </Sub>
          <p className="text-xs">
            Platform deploy / SQL apply steps are internal ops only — see repo{' '}
            <code>docs/lsp-setup-runbook.md</code>. Do not put that in LSP-facing emails.
          </p>
        </Section>

        <Section id="test" title="Test & go-live">
          <div className="space-y-2">
            {[
              'Icon visible; opens new tab to launch endpoint',
              'Each click produces a new signature (no cached URL)',
              'Valid launch → partner login → /lsp/verify → dashboard',
              'Bad / expired signature → /lsp/denied with reason',
              'Suspended LSP cannot launch',
              'Attribution: partner_profiles.source_lsp_id set after verify',
              'New workers registered in that session carry source_lsp_id',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="errors" title="Error reference">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Meaning</th>
                  <th className="p-3">What to do</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-mono text-foreground">expired</td>
                  <td className="p-3">Launch past exp</td>
                  <td className="p-3">Mint a new URL on click</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">bad_signature</td>
                  <td className="p-3">Wrong secret or payload</td>
                  <td className="p-3">Check CODE|exp|nonce|emitra|mobile order</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">token_used</td>
                  <td className="p-3">One-time token reused</td>
                  <td className="p-3">Request a new token</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">lsp_not_active</td>
                  <td className="p-3">LSP suspended / pending</td>
                  <td className="p-3">Contact SafeWork admin</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">no_session</td>
                  <td className="p-3">Verify without launch</td>
                  <td className="p-3">Start again from LSP icon</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <a href={`${ORIGIN}/lsp/denied?reason=expired`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> Preview denied page
            </a>
          </Button>
        </Section>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p>
              <Shield className="h-3.5 w-3.5 inline mr-1" />
              Access: authenticated SafeWork <strong>admins</strong> only (
              <code>/admin/lsp-docs</code>). Not linked from the public site.
            </p>
            <p>
              Share this guide’s content with LSP engineers as needed; never share admin login or live{' '}
              <code>TOKEN_SECRET</code> inside chat screenshots.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
