import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlacementStepStatus = "completed" | "current" | "waiting";

export type PlacementStepId =
  | "registration"
  | "documents"
  | "screening"
  | "tech_interview"
  | "trade_test"
  | "skill_verified"
  | "employer_matched"
  | "interview_scheduled"
  | "selected"
  | "offer_letter"
  | "visa"
  | "ready_to_fly"
  | "deployed";

export const PLACEMENT_STEPS: {
  id: PlacementStepId;
  shortLabel: string;
  fullLabel: string;
}[] = [
  { id: "registration", shortLabel: "Registration", fullLabel: "Registration Completed" },
  { id: "documents", shortLabel: "Documents", fullLabel: "Documents Verified" },
  { id: "screening", shortLabel: "Screening", fullLabel: "Basic Screening Passed" },
  { id: "tech_interview", shortLabel: "Tech Interview", fullLabel: "Technical Interview Completed" },
  { id: "trade_test", shortLabel: "Trade Test", fullLabel: "Trade Test Passed" },
  { id: "skill_verified", shortLabel: "Skill Verified", fullLabel: "Skill Verified" },
  { id: "employer_matched", shortLabel: "Employer Match", fullLabel: "Employer Matched" },
  { id: "interview_scheduled", shortLabel: "Interview", fullLabel: "Interview Scheduled" },
  { id: "selected", shortLabel: "Selected", fullLabel: "Selected" },
  { id: "offer_letter", shortLabel: "Offer Letter", fullLabel: "Offer Letter Issued" },
  { id: "visa", shortLabel: "Visa", fullLabel: "Visa Under Process" },
  { id: "ready_to_fly", shortLabel: "Ready to Fly", fullLabel: "Ready to Fly" },
  { id: "deployed", shortLabel: "Deployed", fullLabel: "Successfully Deployed" },
];

/** Map flags into a linear completed → current → waiting pipeline. */
export function derivePlacementStatuses(
  done: Partial<Record<PlacementStepId, boolean>>,
): Record<PlacementStepId, PlacementStepStatus> {
  const result = {} as Record<PlacementStepId, PlacementStepStatus>;
  let locked = false;

  for (const step of PLACEMENT_STEPS) {
    if (!locked && done[step.id]) {
      result[step.id] = "completed";
      continue;
    }
    if (!locked) {
      result[step.id] = "current";
      locked = true;
    } else {
      result[step.id] = "waiting";
    }
  }

  if (!locked) {
    for (const step of PLACEMENT_STEPS) {
      result[step.id] = "completed";
    }
  }

  return result;
}

interface Props {
  statuses: Record<PlacementStepId, PlacementStepStatus>;
  className?: string;
}

/**
 * Sample B: two-row numbered dots with “x of 13 complete”.
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
