import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GCC_JOURNEY_NAV_STEPS } from "@/modules/worker-verification/constants";
import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";

interface Props {
  workerName?: string | null;
}

/**
 * Same steps as the live GCC journey on Home and in My progress.
 */
export default function WorkerJourneyHome({ workerName }: Props) {
  const { statuses, loading } = useWorkerGccJourneyProgress();
  const current = GCC_JOURNEY_NAV_STEPS.find((step) => statuses[step.id] === "current");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold text-foreground">Your progress</p>
            <p className="truncate text-xs text-muted-foreground">
              {workerName ? `Hi ${workerName.split(" ")[0]}` : current ? `Next: ${current.label}` : "Your next steps"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse bg-muted/30" />
      ) : (
        <ol className="space-y-1 p-3 sm:p-4">
          {GCC_JOURNEY_NAV_STEPS.map((step, index) => {
            const status = statuses[step.id];
            const done = status === "completed";
            return (
              <li key={step.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-success/15 text-success",
                    status === "current" && "bg-primary/10 text-primary",
                    status === "waiting" && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug">{step.label}</span>
                  <span
                    className={cn(
                      "block text-[11px]",
                      done && "text-success",
                      status === "current" && "text-primary",
                      status === "waiting" && "text-muted-foreground",
                    )}
                  >
                    {done ? "Done" : status === "current" ? "In progress" : "Waiting"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="border-t border-border/50 p-4">
        <Button asChild className="h-11 w-full rounded-xl sm:w-auto">
          <Link to="/worker/journey">
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
