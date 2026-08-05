import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GCC_JOURNEY_NAV_STEPS,
  type GccNavStepId,
} from "@/modules/worker-verification/constants";
import { JOURNEY_PHASES } from "@/modules/worker-verification/journey/phases";
import type { GccStepStatus } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";

interface Props {
  statuses: Record<GccNavStepId, GccStepStatus>;
  className?: string;
}

function stepMeta(id: GccNavStepId) {
  return GCC_JOURNEY_NAV_STEPS.find((s) => s.id === id);
}

/**
 * Home progress tracker, grouped into the four journey phases
 * (Profile, Verify, Assess, Deploy) so 12 steps read as four short chapters.
 */
export default function WorkerGccJourneyProgress({ statuses, className }: Props) {
  const total = GCC_JOURNEY_NAV_STEPS.length;
  const completed = GCC_JOURNEY_NAV_STEPS.filter((s) => statuses[s.id] === "completed").length;
  const current = GCC_JOURNEY_NAV_STEPS.find((s) => statuses[s.id] === "current");
  const percent = Math.round((completed / total) * 100);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card px-4 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold text-foreground sm:text-lg">
            Your progress
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {current ? `Next: ${current.label}` : "All set — verification complete."}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
          <span className="text-primary">{completed}</span>
          <span className="text-muted-foreground"> of {total} complete</span>
        </p>
      </div>

      <div
        className="mb-5 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNEY_PHASES.map((phase, phaseIdx) => {
          const doneCount = phase.steps.filter((id) => statuses[id] === "completed").length;
          const allDone = doneCount === phase.steps.length;
          const isCurrent = phase.steps.some((id) => statuses[id] === "current");

          return (
            <li
              key={phase.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                allDone && "border-success/30 bg-success/5",
                !allDone && isCurrent && "border-primary/40 bg-primary/5",
                !allDone && !isCurrent && "border-border bg-muted/20",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide",
                    allDone && "text-success",
                    !allDone && isCurrent && "text-primary",
                    !allDone && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {phaseIdx + 1}. {phase.label}
                </p>
                {allDone ? (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {doneCount}/{phase.steps.length}
                  </span>
                )}
              </div>

              <ul className="mt-2.5 space-y-1.5">
                {phase.steps.map((id) => {
                  const meta = stepMeta(id);
                  const status = statuses[id];
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full",
                          status === "completed" && "bg-success text-success-foreground",
                          status === "current" && "bg-primary ring-2 ring-primary/25",
                          status === "waiting" && "border border-border bg-background",
                        )}
                      >
                        {status === "completed" ? (
                          <Check className="h-2 w-2" strokeWidth={3.5} />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 truncate text-xs",
                          status === "completed" && "text-foreground",
                          status === "current" && "font-medium text-foreground",
                          status === "waiting" && "text-muted-foreground",
                        )}
                        title={meta?.label}
                      >
                        {meta?.shortLabel ?? id}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
