import { Link } from 'react-router-dom';
import { BadgeCheck, Building2, LogIn, ShieldCheck, UserPlus, Users, Wallet } from 'lucide-react';

const TRUST = {
  worker: [
    { icon: ShieldCheck, label: 'Verified employers' },
    { icon: BadgeCheck, label: 'Free to start' },
  ],
  employer: [
    { icon: Users, label: 'Verified workers' },
    { icon: BadgeCheck, label: 'Free to start' },
  ],
} as const;

const COPY = {
  worker: {
    signup: {
      badge: 'Worker signup',
      BadgeIcon: UserPlus,
      headline: 'Start your overseas career the safe way',
      body: 'Create a free profile, verify your skills, and get matched with verified Gulf employers — no large upfront agent commission.',
      steps: [
        { n: '1', title: 'Create account', detail: 'Name, email, mobile OTP & password' },
        { n: '2', title: 'Verify skills', detail: 'Profile, proofs & trade checks' },
        { n: '3', title: 'Get matched', detail: 'Verified Gulf employers' },
      ],
    },
    login: {
      badge: 'Worker sign in',
      BadgeIcon: LogIn,
      headline: 'Welcome back — continue the safe way',
      body: 'Sign in to pick up your verification journey and access verified Gulf opportunities — no agent fees.',
      steps: [
        { n: '1', title: 'Sign in', detail: 'Mobile or email + password' },
        { n: '2', title: 'Continue journey', detail: 'Pick up where you left off' },
        { n: '3', title: 'Get matched', detail: 'Verified Gulf employers' },
      ],
    },
  },
  employer: {
    signup: {
      badge: 'Employer signup',
      BadgeIcon: Building2,
      headline: 'Hire verified talent the safe way',
      body: 'Create a free company account, post jobs, and hire skill-verified workers — no large upfront recruiter fees. Pay only after you hire.',
      steps: [
        { n: '1', title: 'Create account', detail: 'Name, work email & password' },
        { n: '2', title: 'Verify company', detail: 'Details, hiring needs & documents' },
        { n: '3', title: 'Hire talent', detail: 'Post jobs, shortlist' },
      ],
    },
    login: {
      badge: 'Employer sign in',
      BadgeIcon: LogIn,
      headline: 'Welcome back — hire with confidence',
      body: 'Sign in to manage jobs, review verified workers, and release escrow-secured payments.',
      steps: [
        { n: '1', title: 'Sign in', detail: 'Work email + password' },
        { n: '2', title: 'Manage hiring', detail: 'Jobs, shortlist & offers' },
        { n: '3', title: 'Pay safely', detail: 'Escrow release after you hire' },
      ],
    },
  },
} as const;

type Audience = keyof typeof COPY;
type Variant = keyof typeof COPY.worker;

/** Left / top trust panel for worker or employer auth — Option A split layout. */
export default function SignupJourneyPanel({
  variant = 'signup',
  audience = 'worker',
}: {
  variant?: Variant;
  audience?: Audience;
}) {
  const copy = COPY[audience][variant];
  const BadgeIcon = copy.BadgeIcon;
  const trust = TRUST[audience];
  const mobileBadge = audience === 'employer' ? 'Employer' : 'Worker';

  return (
    <aside className="relative flex shrink-0 flex-col overflow-hidden bg-[hsl(230_25%_10%)] text-white md:h-full md:w-[44%] lg:w-[46%]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, hsl(230 85% 55% / 0.28), transparent 55%), radial-gradient(ellipse at 90% 85%, hsl(192 95% 48% / 0.14), transparent 50%)',
        }}
      />

      {/* Mobile: compact brand strip */}
      <div className="relative z-10 md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info">
              <img src="/safework-global-logo.png" alt="" className="h-4 w-4" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight">SafeWorkGlobal</span>
          </Link>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            {mobileBadge}
          </span>
        </div>
        <div className="px-4 pb-3 pt-3">
          <p className="font-heading text-base font-bold leading-snug">{copy.headline}</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {copy.steps.map((step, i) => (
              <div
                key={step.n}
                className={`rounded-lg border px-2 py-2 text-center ${
                  i === 0 ? 'border-primary/50 bg-primary/20' : 'border-white/10 bg-white/5'
                }`}
              >
                <p className="text-[10px] font-bold text-white">{step.title}</p>
                <p className="mt-0.5 text-[9px] text-white/50">Step {step.n}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop / tablet: full trust panel */}
      <div className="relative z-10 hidden h-full min-h-0 flex-col px-8 py-8 md:flex lg:px-10 lg:py-10">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info">
            <img src="/safework-global-logo.png" alt="" className="h-5 w-5" />
          </div>
          <span className="font-heading text-base font-bold tracking-tight lg:text-lg">
            SafeWorkGlobal
          </span>
        </Link>

        <div className="mt-10 flex min-h-0 flex-1 flex-col justify-center lg:mt-12">
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
            <BadgeIcon className="h-3.5 w-3.5 text-primary" />
            {copy.badge}
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight lg:text-3xl xl:text-[2.1rem]">
            {copy.headline}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60 lg:text-[15px]">
            {copy.body}
          </p>

          <ol className="mt-8 space-y-4 lg:mt-10 lg:space-y-5">
            {copy.steps.map((step, i) => (
              <li key={step.n} className="flex gap-3.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? 'bg-gradient-to-br from-primary to-info text-white shadow-[0_0_24px_hsl(230_85%_55%/0.35)]'
                      : 'border border-white/15 bg-white/5 text-white/70'
                  }`}
                >
                  {step.n}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white lg:text-[15px]">{step.title}</p>
                  <p className="mt-0.5 text-xs text-white/50 lg:text-sm">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/55 lg:gap-x-5">
          {trust.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
