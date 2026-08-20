import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Workforce" },
  { id: 4, label: "Partnership" },
] as const;

export default function EmployerSignupStepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-5">
      <ol className="hidden items-center md:flex">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
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
              </div>
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
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                s.id <= step ? "bg-primary" : "bg-muted-foreground/25",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
