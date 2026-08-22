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

const pillClass = "h-1.5 w-6 shrink-0 rounded-full";

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
    <div
      className={cn("mb-3 flex items-center gap-2", className)}
      role="group"
      aria-label={label ?? `Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const past = n < current;
        const canGo = !!onSelect && n !== current && n >= 1 && n <= max;
        const tone = cn(
          pillClass,
          active && "bg-primary",
          past && "bg-primary/30",
          !active && !past && "bg-muted-foreground/25",
        );

        if (canGo) {
          return (
            <button
              key={n}
              type="button"
              data-inline
              aria-label={`Step ${n} of ${total}`}
              onClick={() => onSelect(n)}
              className={cn(
                tone,
                "!min-h-0 p-0 cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2",
              )}
            />
          );
        }

        return (
          <span
            key={n}
            aria-hidden
            aria-current={active ? "step" : undefined}
            className={cn(tone, "inline-block")}
          />
        );
      })}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        {label ?? `Step ${current} of ${total}`}
      </span>
    </div>
  );
}
