import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  FileUp,
  HeartPulse,
  HelpCircle,
  GraduationCap,
  Plane,
  Rocket,
  ScrollText,
  Video,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { type GccNavStepId } from '@/modules/worker-verification/constants';
import heroWorkers from '@/assets/hero-workers.jpg';
import constructionIcon from '@/assets/construction-icon.png';
import electricianIcon from '@/assets/electrician-icon.png';
import welderIcon from '@/assets/welder-icon.png';

const JOURNEY_ICONS: Record<GccNavStepId, LucideIcon> = {
  essentials: ClipboardList,
  test1: HelpCircle,
  skill_proof: FileUp,
  identity: BadgeCheck,
  test2: Video,
  payment: CreditCard,
  test3: Wrench,
  medical: HeartPulse,
  bond: ScrollText,
  pdot: GraduationCap,
  gcc_ready: Plane,
  deployment: Rocket,
};

const PHASES: {
  title: string;
  short: string;
  subtitle: string;
  stepIds: GccNavStepId[];
  labels: string[];
}[] = [
  {
    title: '1 · Build profile',
    short: 'Build',
    subtitle: 'Basics, quiz, proof & ID',
    stepIds: ['essentials', 'test1', 'skill_proof', 'identity'],
    labels: ['Essentials', 'Test 1', 'Skill proof', 'Identity'],
  },
  {
    title: '2 · Prove skill',
    short: 'Prove',
    subtitle: 'Interview, fee & trade test',
    stepIds: ['test2', 'payment', 'test3'],
    labels: ['Interview', 'Payment', 'Trade test'],
  },
  {
    title: '3 · Go GCC ready',
    short: 'GCC',
    subtitle: 'Medical, bond & placement',
    stepIds: ['medical', 'bond', 'gcc_ready'],
    labels: ['Medical', 'Bond', 'GCC ready'],
  },
];

const TRADES = [
  { src: constructionIcon, label: 'Construction' },
  { src: electricianIcon, label: 'Electrical' },
  { src: welderIcon, label: 'Welding' },
] as const;

/** Left / top journey panel — mobile strip, tablet+ side panel. */
export default function SignupJourneyPanel() {
  return (
    <aside className="relative flex shrink-0 flex-col border-b border-border bg-background md:h-full md:w-[42%] md:border-b-0 md:border-r lg:w-[46%]">
      {/* —— Mobile only: compact header + 3 stage chips —— */}
      <div className="md:hidden">
        <div className="relative h-24 overflow-hidden">
          <img
            src={heroWorkers}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
            <Link to="/" className="inline-flex items-center gap-2 rounded-md bg-background/90 px-2 py-1">
              <img src="/safework-global-logo.png" alt="" className="h-6 w-6 rounded object-contain" />
              <span className="font-heading text-sm font-bold text-foreground">SafeWork Global</span>
            </Link>
            <span className="rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              Worker
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-4 pb-2">
            <p className="font-heading text-base font-bold text-foreground">Your path to GCC ready</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-3 py-2.5">
          {PHASES.map((phase, i) => {
            const FirstIcon = JOURNEY_ICONS[phase.stepIds[0]];
            return (
              <div
                key={phase.short}
                className={`rounded-lg border px-2 py-2 text-center ${
                  i === 0 ? 'border-primary/40 bg-primary/[0.07]' : 'border-border bg-muted/25'
                }`}
              >
                <FirstIcon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold leading-tight text-foreground">{phase.short}</p>
                <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                  {i === 0 ? 'Start' : `Stage ${i + 1}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* —— Tablet & desktop: full side panel —— */}
      <div className="hidden h-full min-h-0 flex-col md:flex">
        <div className="relative h-[28%] min-h-[7.5rem] shrink-0 overflow-hidden lg:h-[32%]">
          <img
            src={heroWorkers}
            alt="Skilled workers preparing for overseas jobs"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-5 py-3 lg:px-8 lg:py-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-background/90 px-2 py-1 backdrop-blur-sm"
            >
              <img src="/safework-global-logo.png" alt="" className="h-7 w-7 rounded object-contain" />
              <span className="font-heading text-sm font-bold tracking-tight text-foreground lg:text-base">
                SafeWork Global
              </span>
            </Link>
            <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
              Worker
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-5 pb-3 lg:px-8 lg:pb-4">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              Your path to GCC ready
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
              Verified Gulf jobs · No agent fees
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-y border-border bg-muted/25 px-5 py-2 lg:gap-4 lg:px-8">
          {TRADES.map((t) => (
            <div key={t.label} className="inline-flex items-center gap-1.5">
              <img src={t.src} alt="" className="h-6 w-6 rounded object-contain" />
              <span className="text-[11px] font-medium text-foreground">{t.label}</span>
            </div>
          ))}
          <span className="ml-auto hidden text-[11px] font-medium text-muted-foreground xl:inline">
            UAE · Saudi · Qatar · Kuwait · Oman
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-5 py-3 lg:gap-2.5 lg:px-8 lg:py-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              After you sign up
            </p>
            <p className="text-[11px] text-muted-foreground">3 stages</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
            {PHASES.map((phase, phaseIdx) => (
              <div
                key={phase.title}
                className={`flex min-h-0 flex-col justify-center rounded-xl border px-3 py-2.5 ${
                  phaseIdx === 0
                    ? 'border-primary/35 bg-primary/[0.06]'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{phase.title}</p>
                    <p className="text-[11px] text-muted-foreground">{phase.subtitle}</p>
                  </div>
                  {phaseIdx === 0 && (
                    <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                      Start
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {phase.stepIds.map((id, i) => {
                    const Icon = JOURNEY_ICONS[id];
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-1.5 py-1 text-[11px] font-medium text-foreground"
                      >
                        <Icon className="h-3 w-3 text-primary" />
                        {phase.labels[i]}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
