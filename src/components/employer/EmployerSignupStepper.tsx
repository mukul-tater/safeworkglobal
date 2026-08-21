import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Workforce" },
  { id: 4, label: "Partnership" },
] as const;

type StepId = 1 | 2 | 3 | 4;

export default function EmployerSignupStepper({
  step,
  maxReachable,
  onSelect,
}: {
  step: StepId;
  maxReachable?: StepId;
  onSelect?: (step: StepId) => void;
}) {
  const max = maxReachable ?? step;

  const go = (id: StepId) => {
    if (!onSelect || id === step || id > max) return;
    onSelect(id);
  };

  return (
    <div className="mb-5">
      <ol className="hidden items-center md:flex">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const canGo = !!onSelect && s.id !== step && s.id <= max;
          return (
            <li key={s.id} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!canGo}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${s.id}: ${s.label}`}
                onClick={() => go(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md text-left",
                  canGo && "cursor-pointer hover:opacity-90",
                  !canGo && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    done && "bg-success text-success-foreground",
                    active && "bg-primary text-primary-foreground",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.id}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-3 h-px flex-1", step > s.id ? "bg-success/70" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            {STEPS[step - 1].label}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            Step {step} of 4
          </p>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s) => {
            const canGo = !!onSelect && s.id !== step && s.id <= max;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!canGo}
                aria-label={`Step ${s.id} of 4`}
                aria-current={s.id === step ? "step" : undefined}
                onClick={() => go(s.id)}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  s.id <= step ? "bg-primary" : "bg-muted-foreground/25",
                  canGo && "cursor-pointer hover:ring-2 hover:ring-primary/30",
                  !canGo && "cursor-default",
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
