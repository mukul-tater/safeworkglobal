import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLACEMENT_STEPS,
  type PlacementStepId,
  type PlacementStepStatus,
} from "@/components/worker/placementJourney";

export type { PlacementStepId, PlacementStepStatus };
export { PLACEMENT_STEPS, derivePlacementStatuses } from "@/components/worker/placementJourney";

interface Props {
  statuses: Record<PlacementStepId, PlacementStepStatus>;
  className?: string;
}

/**
 * Sample B: two-row numbered dots with “x of 13 complete”.
 * Steps match My Journey in the sidebar (same PLACEMENT_STEPS source).
 */
export default function WorkerPlacementProgress({ statuses, className }: Props) {
  const completed = PLACEMENT_STEPS.filter((s) => statuses[s.id] === "completed").length;
  const current = PLACEMENT_STEPS.find((s) => statuses[s.id] === "current");
  const total = PLACEMENT_STEPS.length;

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
            Your placement journey
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {current
              ? `Next: ${current.fullLabel}`
              : "All steps complete — successfully deployed."}
          </p>
        </div>
        <p className="text-sm font-medium text-foreground tabular-nums shrink-0">
          <span className="text-primary">{completed}</span>
          <span className="text-muted-foreground"> of {total} complete</span>
        </p>
      </div>

      <ol className="grid grid-cols-4 sm:grid-cols-7 gap-x-2 gap-y-6">
        {PLACEMENT_STEPS.map((step, index) => {
          const status = statuses[step.id];
          const done = status === "completed";
          const isCurrent = status === "current";

          return (
            <li key={step.id} className="flex flex-col items-center text-center min-w-0">
              <span
                title={step.fullLabel}
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
