import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VERIFICATION_STAGE_LABELS, type VerificationStage } from '@/modules/worker-verification/constants';
import {
  JOURNEY_PHASES,
  journeyProgressPercent,
  phaseStatusesForStage,
  stepPositionForStage,
  stepWithinPhase,
} from '@/modules/worker-verification/journey/phases';

interface Props {
  stage: VerificationStage;
  /** Optional override heading; defaults to the stage label. */
  heading?: string;
  subheading?: string;
}

/**
 * Status hero for the worker journey content column.
 * Shows the current phase, position, a 4-phase chip strip, and overall progress.
 */
export default function JourneyHero({ stage, heading, subheading }: Props) {
  const { position, total } = stepPositionForStage(stage);
  const percent = journeyProgressPercent(stage);
  const statuses = phaseStatusesForStage(stage);
  const within = stepWithinPhase(stage);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-info/5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {within.phase.label} · Step {within.position} of {within.total}
          </p>
          <h1 className="mt-1 text-2xl font-bold font-heading leading-tight text-foreground">
            {heading ?? VERIFICATION_STAGE_LABELS[stage]}
          </h1>
          {subheading ? (
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
            {position}
            <span className="text-base font-medium text-muted-foreground">/{total}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">steps</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Journey phases">
        {JOURNEY_PHASES.map((phase) => {
          const status = statuses[phase.id];
          return (
            <div key={phase.id} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  status === 'completed' && 'bg-success text-success-foreground',
                  status === 'current' && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  status === 'upcoming' && 'bg-muted text-muted-foreground',
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  phaseIndexLabel(phase.id)
                )}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium leading-none',
                  status === 'current' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </section>
  );
}

function phaseIndexLabel(id: string): number {
  return JOURNEY_PHASES.findIndex((p) => p.id === id) + 1;
}
