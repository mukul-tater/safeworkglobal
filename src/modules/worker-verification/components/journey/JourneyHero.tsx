import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VERIFICATION_STAGE_LABELS, type VerificationStage } from '@/modules/worker-verification/constants';
import {
  JOURNEY_PHASES,
  journeyProgressPercent,
  phaseIndex,
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
 * Status hero for the worker journey.
 * Current phase, position, a connected 4-phase stepper, and overall progress.
 */
export default function JourneyHero({ stage, heading, subheading }: Props) {
  const { position, total } = stepPositionForStage(stage);
  const percent = journeyProgressPercent(stage);
  const statuses = phaseStatusesForStage(stage);
  const within = stepWithinPhase(stage);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {within.phase.label} · Step {within.position} of {within.total}
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold leading-tight text-foreground">
            {heading ?? VERIFICATION_STAGE_LABELS[stage]}
          </h1>
          {subheading ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
          <p className="font-heading text-xl font-bold tabular-nums leading-none text-foreground">
            {position}
            <span className="text-sm font-medium text-muted-foreground">/{total}</span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">steps</p>
        </div>
      </div>

      <div className="mt-5" aria-label="Journey phases">
        <ol className="flex items-center">
          {JOURNEY_PHASES.map((phase, i) => {
            const status = statuses[phase.id];
            const isLast = i === JOURNEY_PHASES.length - 1;
            return (
              <li key={phase.id} className={cn('flex items-center', !isLast && 'flex-1')}>
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                      status === 'completed' && 'border-success bg-success text-success-foreground',
                      status === 'current' && 'border-primary bg-primary text-primary-foreground',
                      status === 'upcoming' && 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {status === 'completed' ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      phaseIndex(phase.id) + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-medium leading-none',
                      status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {phase.label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      'mx-2 -mt-5 h-0.5 flex-1 rounded-full',
                      status === 'completed' ? 'bg-success' : 'bg-border',
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {percent}%
        </span>
      </div>
    </section>
  );
}
