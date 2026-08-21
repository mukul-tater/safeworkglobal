import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function useMaxReachedStep(step: number) {
  const [maxReached, setMaxReached] = useState(step);
  useEffect(() => {
    setMaxReached((m) => Math.max(m, step));
  }, [step]);
  return maxReached;
}

type Props = {
  current: number;
  total: number;
  onSelect?: (step: number) => void;
  /** Highest step the user may jump to (inclusive). Defaults to current — back only. */
  maxReachable?: number;
  className?: string;
  label?: string;
};

/** Capsule step bar used on signup / onboarding forms. Completed pills are clickable. */
export default function FormStepPills({
  current,
  total,
  onSelect,
  maxReachable,
  className,
  label,
}: Props) {
  const max = maxReachable ?? current;

  return (
    <div className={cn("mb-3 flex items-center gap-2", className)}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const past = n < current;
        const canGo = !!onSelect && n !== current && n >= 1 && n <= max;
        return (
          <button
            key={n}
            type="button"
            disabled={!canGo}
            aria-label={`Step ${n} of ${total}${canGo ? "" : active ? ", current" : ""}`}
            aria-current={active ? "step" : undefined}
            onClick={() => {
              if (canGo) onSelect(n);
            }}
            className={cn(
              "h-1.5 w-6 rounded-full transition-all",
              active && "bg-primary",
              past && "bg-primary/30",
              !active && !past && "bg-muted-foreground/25",
              canGo &&
                "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2",
              !canGo && "cursor-default",
            )}
          />
        );
      })}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        {label ?? `Step ${current} of ${total}`}
      </span>
    </div>
  );
}
