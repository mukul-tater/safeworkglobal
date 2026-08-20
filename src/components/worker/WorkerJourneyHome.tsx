import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  FileText,
  ClipboardList,
  Video,
  Wrench,
  Handshake,
  CheckCircle2,
  XCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PassportRequirementInfo from "@/components/worker/PassportRequirementInfo";
import { cn } from "@/lib/utils";

export type JourneyStatus = "completed" | "in_progress" | "waiting";

export type WorkerJourneyStepId =
  | "profile"
  | "documents"
  | "screening"
  | "interview"
  | "trade_test"
  | "verified";

type StepDef = {
  id: WorkerJourneyStepId;
  number: number;
  title: string;
  icon: LucideIcon;
  description: string;
  bullets: { label: string; icon: LucideIcon }[];
  cta?: { label: string; to: string };
  showScore?: boolean;
  showTradeBranch?: boolean;
};

const STEPS: StepDef[] = [
  {
    id: "profile",
    number: 1,
    title: "Profile",
    icon: User,
    description: "Add your name, phone, and basic details.",
    bullets: [
      { label: "Your name", icon: User },
      { label: "Mobile number", icon: User },
      { label: "Work skill", icon: Wrench },
    ],
    cta: { label: "Complete profile", to: "/worker/profile" },
  },
  {
    id: "documents",
    number: 2,
    title: "Documents",
    icon: FileText,
    description: "Upload your ID and photo documents.",
    bullets: [
      { label: "PAN (front)", icon: FileText },
      { label: "Aadhaar (front & back)", icon: FileText },
      { label: "Passport first & last page (if you have)", icon: FileText },
      { label: "Photograph", icon: FileText },
    ],
    cta: { label: "Upload documents", to: "/worker/documents" },
  },
  {
    id: "screening",
    number: 3,
    title: "Shortlisting",
    icon: ClipboardList,
    description: "Simple questions at an E-Mitra centre about your trade.",
    bullets: [
      { label: "Trade questions", icon: ClipboardList },
      { label: "At E-Mitra centre", icon: ClipboardList },
      { label: "Pass to continue", icon: CheckCircle2 },
    ],
  },
  {
    id: "interview",
    number: 4,
    title: "Online Interview",
    icon: Video,
    description: "Online video interview with the SafeWork team.",
    bullets: [
      { label: "Experience", icon: User },
      { label: "Trade knowledge", icon: Wrench },
      { label: "Practical talk", icon: ClipboardList },
      { label: "Gulf ready", icon: Handshake },
    ],
    showScore: true,
    showTradeBranch: true,
    cta: { label: "Start interview", to: "/worker/interviews" },
  },
  {
    id: "trade_test",
    number: 5,
    title: "Payment",
    icon: Wrench,
    description: "Pay the fee if needed, then take the practical skill test.",
    bullets: [
      { label: "Payment", icon: FileText },
      { label: "Book nearest centre", icon: Wrench },
      { label: "Practical skill test", icon: Wrench },
    ],
  },
  {
    id: "verified",
    number: 6,
    title: "Final Selection",
    icon: Handshake,
    description: "Get your skill level and verified profile for employers.",
    bullets: [
      { label: "Skill Level 1 / 2 / 3", icon: CheckCircle2 },
      { label: "Verified candidate profile", icon: Handshake },
    ],
    cta: { label: "View profile", to: "/worker/profile" },
  },
];

function statusLabel(status: JourneyStatus): string {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Waiting";
}

export function deriveSimpleJourneyStatuses(input: {
  hasProfile: boolean;
  hasDocuments: boolean;
}): Record<WorkerJourneyStepId, JourneyStatus> {
  const { hasProfile, hasDocuments } = input;
  if (!hasProfile) {
    return {
      profile: "in_progress",
      documents: "waiting",
      screening: "waiting",
      interview: "waiting",
      trade_test: "waiting",
      verified: "waiting",
    };
  }
  if (!hasDocuments) {
    return {
      profile: "completed",
      documents: "in_progress",
      screening: "waiting",
      interview: "waiting",
      trade_test: "waiting",
      verified: "waiting",
    };
  }
  return {
    profile: "completed",
    documents: "completed",
    screening: "in_progress",
    interview: "waiting",
    trade_test: "waiting",
    verified: "waiting",
  };
}

interface Props {
  workerName?: string | null;
  hasProfile: boolean;
  hasDocuments: boolean;
  technicalScore?: number | null;
}

export default function WorkerJourneyHome({
  workerName,
  hasProfile,
  hasDocuments,
  technicalScore = null,
}: Props) {
  const statuses = useMemo(
    () => deriveSimpleJourneyStatuses({ hasProfile, hasDocuments }),
    [hasProfile, hasDocuments],
  );

  const defaultActive =
    STEPS.find((s) => statuses[s.id] === "in_progress")?.id ??
    STEPS.find((s) => statuses[s.id] === "waiting")?.id ??
    STEPS[0].id;

  const [activeId, setActiveId] = useState<WorkerJourneyStepId>(defaultActive);

  useEffect(() => {
    setActiveId(defaultActive);
  }, [defaultActive]);

  const active = STEPS.find((s) => s.id === activeId) ?? STEPS[0];
  const ActiveIcon = active.icon;

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold font-heading text-foreground truncate">
              Worker Journey
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {workerName ? `Hi ${workerName.split(" ")[0]}` : "Your next steps"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,15rem)_1fr]">
        {/* Step list */}
        <ol className="border-b lg:border-b-0 lg:border-r border-border/50 p-3 sm:p-4 space-y-1">
          {STEPS.map((step, index) => {
            const status = statuses[step.id];
            const isActive = step.id === activeId;
            const Icon = step.icon;
            const done = status === "completed";

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary/5 ring-1 ring-primary/25"
                      : "hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      done || isActive || status === "in_progress"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {done && (
                      <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-success bg-card rounded-full" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-semibold font-heading leading-snug",
                        isActive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {step.number}. {step.title}
                    </span>
                    <span
                      className={cn(
                        "block text-[11px] mt-0.5",
                        status === "completed" && "text-success",
                        status === "in_progress" && "text-primary",
                        status === "waiting" && "text-muted-foreground",
                      )}
                    >
                      {statusLabel(status)}
                    </span>
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "ml-[1.35rem] h-3 w-px",
                      done ? "bg-primary/40" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Detail */}
        <div className="p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            Step {active.number}
          </p>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground mb-1">
            {active.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            {active.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {active.bullets.map((b) => {
              const BIcon = b.icon;
              return (
                <div
                  key={b.label}
                  className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-center"
                >
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 relative">
                    <BIcon className="h-3.5 w-3.5 text-primary" />
                    <CheckCircle2 className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-success bg-card rounded-full" />
                  </div>
                  <p className="text-xs font-medium text-foreground leading-snug inline-flex items-center justify-center gap-1">
                    {b.label}
                    {b.label.startsWith("Passport") && <PassportRequirementInfo />}
                  </p>
                </div>
              );
            })}
          </div>

          {active.showScore && (
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm text-muted-foreground">Technical score</p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
                <span className="text-lg font-bold font-heading text-primary tabular-nums">
                  {technicalScore != null ? `${technicalScore} / 100` : "— / 100"}
                </span>
              </div>
            </div>
          )}

          {active.showTradeBranch && (
            <div className="mb-5">
              <p className="text-sm font-medium text-foreground mb-2">Trade test needed?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-success">Yes</p>
                    <p className="text-sm text-foreground">Pay fee then book test</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">No</p>
                    <p className="text-sm text-foreground">Meet employer</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active.cta && (
            <Button asChild className="w-full sm:w-auto h-11 rounded-xl">
              <Link to={active.cta.to}>
                <ActiveIcon className="h-4 w-4 mr-1.5" />
                {active.cta.label}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          )}

          {!active.cta && statuses[active.id] === "waiting" && (
            <p className="text-sm text-muted-foreground">
              Finish earlier steps first. We will unlock this when you are ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
