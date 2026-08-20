import { Link } from "react-router-dom";
import { Check, Search, Briefcase, Rocket, Star, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmployerFlowStep =
  | "signup"
  | "search"
  | "post"
  | "pilot"
  | "shortlist"
  | "hire";

const STEPS: Array<{ key: EmployerFlowStep; label: string; icon: any; to: string }> = [
  { key: "signup", label: "Sign up", icon: Check, to: "/employer/dashboard" },
  { key: "search", label: "Search Workers", icon: Search, to: "/employer/search-workers" },
  { key: "post", label: "Post Job", icon: Briefcase, to: "/employer/quick-post-job" },
  { key: "pilot", label: "Start Pilot", icon: Rocket, to: "/employer/pilot-offer" },
  { key: "shortlist", label: "Shortlist", icon: Star, to: "/employer/shortlist" },
  { key: "hire", label: "Hire", icon: Handshake, to: "/employer/offers" },
];

interface Props {
  current: EmployerFlowStep;
  className?: string;
}

export default function EmployerFlowStepper({ current, className }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className={cn("w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3 mb-4 overflow-x-auto", className)}>
      <div className="flex items-center gap-1 min-w-max sm:min-w-0 sm:justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <Link
                to={step.to}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  active && "bg-primary text-primary-foreground shadow-sm",
                  done && "bg-success/10 text-success hover:bg-success/15",
                  !active && !done && "text-muted-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    active && "bg-primary-foreground/20",
                    done && "bg-success/20",
                    !active && !done && "bg-muted"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </Link>
              {idx < STEPS.length - 1 && (
                <div className={cn("h-px w-4 sm:w-6", done ? "bg-success/40" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
