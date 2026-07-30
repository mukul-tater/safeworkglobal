import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GCC_JOURNEY_NAV_STEPS,
  type GccNavStepId,
} from "@/modules/worker-verification/constants";
import type { GccStepStatus } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";

interface Props {
  statuses: Record<GccNavStepId, GccStepStatus>;
  className?: string;
}

/**
 * Home tracker: Essentials → Test 1 → Skill proof → Identity → Test 2 → Payment → Test 3 → Medical → Bond → Ready.
 */
export default function WorkerGccJourneyProgress({ statuses, className }: Props) {
  const completed = GCC_JOURNEY_NAV_STEPS.filter((s) => statuses[s.id] === "completed").length;
  const current = GCC_JOURNEY_NAV_STEPS.find((s) => statuses[s.id] === "current");
  const total = GCC_JOURNEY_NAV_STEPS.length;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card px-4 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-semibold font-heading text-foreground">
            Your GCC journey
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {current ? `Next: ${current.label}` : "GCC ready — verification complete."}
          </p>
        </div>
        <p className="text-sm font-medium text-foreground tabular-nums shrink-0">
          <span className="text-primary">{completed}</span>
          <span className="text-muted-foreground"> of {total} complete</span>
        </p>
      </div>

      <ol className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-x-2 gap-y-6">
        {GCC_JOURNEY_NAV_STEPS.map((step, index) => {
          const status = statuses[step.id];
          const done = status === "completed";
          const isCurrent = status === "current";

          return (
            <li key={step.id} className="flex flex-col items-center text-center min-w-0">
              <span
                title={step.label}
                className={cn(
                  "relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors",
                  done && "bg-emerald-600 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105",
                  !done && !isCurrent && "bg-muted text-muted-foreground border border-border",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-[10px] sm:text-[11px] leading-tight font-medium px-0.5",
                  done && "text-emerald-700 dark:text-emerald-400",
                  isCurrent && "text-primary",
                  !done && !isCurrent && "text-muted-foreground",
                )}
              >
                {step.shortLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
