import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { WorkerJourneyProgress } from "../lib/workerProfileProgress";
import { progressFromVerification } from "../lib/workerProfileProgress";

interface Props {
  progress?: WorkerJourneyProgress | null;
  className?: string;
}

export default function WorkerProfileCompletionBar({ progress, className }: Props) {
  const p = progress ?? progressFromVerification(null);

  return (
    <div className={cn("mt-3 min-w-[10rem] max-w-sm", className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Profile</span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            p.complete ? "text-success" : "text-foreground",
          )}
        >
          {p.percent}%
        </span>
      </div>
      <Progress value={p.percent} className="h-1.5" aria-label={`Profile ${p.percent}% complete`} />
      <p className="mt-1 text-[11px] text-muted-foreground">
        {p.complete
          ? `${p.completed} of ${p.total} steps complete`
          : `Next: ${p.currentLabel}`}
      </p>
    </div>
  );
}
