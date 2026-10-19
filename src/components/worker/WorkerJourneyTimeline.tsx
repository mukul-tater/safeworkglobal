import { Check, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { GCC_JOURNEY_NAV_STEPS, type VerificationStage } from "@/modules/worker-verification/constants";
import { deriveNavStatuses } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";

export type JourneyStageStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "skipped";

export interface JourneyStage {
  /** 1-based step number for the badge. */
  step: number;
  /** Short title shown under the node. */
  title: string;
  /** One-line sub-label (e.g. "Vendor selection"). */
  subtitle?: string;
  /** Status badge shown above the node. */
  status: JourneyStageStatus;
  /** ISO timestamp when this stage moved to current status. */
  timestamp?: string | null;
}

const STATUS_LABEL: Record<JourneyStageStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
  skipped: "Skipped",
};

const STATUS_BADGE_CLASS: Record<JourneyStageStatus, string> = {
  completed: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  in_progress: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  pending: "border-muted-foreground/30 text-muted-foreground bg-muted/40",
  skipped: "border-muted-foreground/30 text-muted-foreground bg-muted/40",
};

/**
 * Horizontal step timeline used on the Worker Dashboard.
 * Visual reference: WhatsApp screenshot — green chevron nodes with status pill
 * above, step label below, and date underneath.
 */
export default function WorkerJourneyTimeline({
  stages,
  className,
}: {
  stages: JourneyStage[];
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex min-w-max items-stretch gap-0 px-2 py-4">
        {stages.map((stage, i) => {
          const isCompleted = stage.status === "completed";
          const isCurrent = stage.status === "in_progress";
          const nextDone = stages[i + 1] && stages[i + 1].status === "completed";
          return (
            <div key={stage.step} className="flex items-stretch">
              <div className="flex w-28 flex-col items-center text-center">
                {/* Status badge */}
                <div
                  className={cn(
                    "mb-1 inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-medium uppercase tracking-wide",
                    STATUS_BADGE_CLASS[stage.status],
                  )}
                >
                  {STATUS_LABEL[stage.status]}
                </div>
                {/* Time stamp */}
                <div className="mb-2 h-4 text-[10px] tabular-nums text-muted-foreground">
                  {stage.timestamp ? format(new Date(stage.timestamp), "HH:mm") : ""}
                </div>
                {/* Node */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all",
                    isCompleted &&
                      "bg-emerald-500 text-white ring-2 ring-emerald-500/30",
                    isCurrent &&
                      "bg-amber-500 text-white ring-2 ring-amber-500/30 animate-pulse",
                    !isCompleted && !isCurrent &&
                      "bg-muted text-muted-foreground border border-border",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : isCurrent ? (
                    <ChevronRight className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                {/* Step label */}
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {stage.step}
                </div>
                <div className="text-xs font-semibold leading-tight">{stage.title}</div>
                {stage.subtitle && (
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    ({stage.subtitle})
                  </div>
                )}
                {/* Date */}
                <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                  {stage.timestamp
                    ? format(new Date(stage.timestamp), "dd/MM/yy")
                    : "—"}
                </div>
              </div>
              {/* Connector */}
              {i < stages.length - 1 && (
                <div className="flex items-center" aria-hidden>
                  <div
                    className={cn(
                      "h-[3px] w-10 rounded-full",
                      isCompleted && nextDone
                        ? "bg-emerald-500"
                        : isCompleted
                          ? "bg-gradient-to-r from-emerald-500 to-muted"
                          : "bg-muted",
                    )}
                    style={{ marginTop: 36 /* align with node row */ }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Live GCC journey steps for the dashboard timeline. */
export function deriveWorkerJourney(input: {
  stage?: VerificationStage | null;
  tradeRequired?: boolean;
  declarationsDone?: boolean;
}): JourneyStage[] {
  const statuses = deriveNavStatuses(input.stage ?? "essentials", input.tradeRequired !== false, {
    declarationsDone: input.declarationsDone !== false,
    includeAccountDetails: false,
    accountCreated: true,
  });
  return GCC_JOURNEY_NAV_STEPS.map((step, index) => {
    const status = statuses[step.id];
    const mapped: JourneyStageStatus =
      status === "completed" ? "completed" : status === "current" ? "in_progress" : "pending";
    return {
      step: index + 1,
      title: step.shortLabel,
      subtitle: step.navLabel,
      status: mapped,
    };
  });
}