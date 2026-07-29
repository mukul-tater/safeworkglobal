import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus,
  FileUp,
  MessageSquare,
  Video,
  Wrench,
  Info,
  CheckCircle2,
  XCircle,
  MapPin,
  ArrowRight,
  Building2,
  CreditCard,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TRADE_TEST_CENTERS } from "@/data/tradeTestCenters";
import { cn } from "@/lib/utils";

type JourneyStep = {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof UserPlus;
  bullets: string[];
  branch?: { pass: string; fail: string };
};

const STEPS: JourneyStep[] = [
  {
    id: "registration",
    number: 1,
    title: "Candidate Registration",
    shortTitle: "Registration",
    description: "Start your journey through E-Mitra, the website, or the mobile app.",
    icon: UserPlus,
    bullets: ["E-Mitra Centre", "Website", "Mobile App"],
  },
  {
    id: "documents",
    number: 2,
    title: "Document Upload",
    shortTitle: "Documents",
    description: "Upload identity and skill documents so we can build your candidate file.",
    icon: FileUp,
    bullets: ["Aadhaar", "Passport (if available)", "Experience", "Education", "Photograph"],
  },
  {
    id: "verbal",
    number: 3,
    title: "Basic Verbal Screening",
    shortTitle: "Verbal Screening",
    description: "Trade-specific Q&A conducted at an E-Mitra Centre.",
    icon: MessageSquare,
    bullets: ["Conducted at E-Mitra Centre", "Trade-specific questions", "Communication check"],
    branch: { pass: "Online Interview", fail: "Reject / Upskill" },
  },
  {
    id: "interview",
    number: 4,
    title: "Technical Online Interview",
    shortTitle: "Online Interview",
    description: "Conducted by the SafeWork Technical Team — a technical score is generated.",
    icon: Video,
    bullets: [
      "Experience verification",
      "Trade knowledge",
      "Practical discussion",
      "UAE / GCC readiness",
    ],
    branch: {
      pass: "Trade test required → pay fee, then book nearest center",
      fail: "No trade test → direct employer interview",
    },
  },
  {
    id: "payment",
    number: 5,
    title: "Trade Test Payment",
    shortTitle: "Payment",
    description:
      "Pay the trade test fee securely to unlock booking at a SafeWork verified center.",
    icon: CreditCard,
    bullets: [
      "Secure online payment",
      "Trade test fee confirmation",
      "Receipt for your records",
      "Unlocks physical trade test booking",
    ],
  },
  {
    id: "trade-test",
    number: 6,
    title: "Physical Trade Test",
    shortTitle: "Physical Trade Test",
    description: "Practical assessment at your nearest SafeWork verified trade test center.",
    icon: Wrench,
    bullets: [
      "Practical assessment",
      "Safety & tool handling",
      "Quality & productivity",
      "Time-based evaluation",
      "Digital skill scorecard",
    ],
  },
  {
    id: "travel",
    number: 7,
    title: "Travel — Visa & Flight",
    shortTitle: "Travel",
    description:
      "After skill verification, we support your visa process and flight arrangements for deployment.",
    icon: Plane,
    bullets: [
      "Visa documentation & filing support",
      "Medical & compliance checks as required",
      "Flight booking coordination",
      "Pre-departure guidance",
    ],
  },
];

function CentersList() {
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {TRADE_TEST_CENTERS.map((center, index) => (
        <motion.li
          key={center.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * index, duration: 0.25 }}
          className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5"
        >
          <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold font-heading text-foreground leading-snug">
              {center.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {center.city}, {center.state} · {center.partner}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function TradeTestCentersInfo() {
  return (
    <>
      {/* Desktop / hover */}
      <HoverCard openDelay={120} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="hidden sm:inline-flex items-center justify-center rounded-full p-1 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            aria-label="SafeWork Global verified trade test centers"
          >
            <Info className="h-4 w-4" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          side="top"
          className="w-[min(100vw-2rem,22rem)] p-0 overflow-hidden rounded-2xl border-border/70 shadow-xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="p-4"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold font-heading text-foreground">
                  SafeWork Global verified trade test centers
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Book your physical trade test at a nearest partner centre.
                </p>
              </div>
            </div>
            <CentersList />
          </motion.div>
        </HoverCardContent>
      </HoverCard>

      {/* Mobile / tap dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex sm:hidden items-center justify-center rounded-full p-1 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="SafeWork Global verified trade test centers"
          >
            <Info className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Verified trade test centers
            </DialogTitle>
            <DialogDescription>
              SafeWork Global&apos;s verified centres for your physical trade test.
            </DialogDescription>
          </DialogHeader>
          <CentersList />
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepDetail({
  step,
  variant = "card",
}: {
  step: JourneyStep;
  variant?: "card" | "plain";
}) {
  const Icon = step.icon;
  const isTradeTest = step.id === "trade-test";
  const isInterview = step.id === "interview";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className={cn(
          variant === "card" &&
            "rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm",
        )}
      >
        <div className="flex items-start gap-3 mb-4">
          {variant === "card" && (
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            {variant === "card" && (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                Step {step.number}
              </p>
            )}
            <h3
              className={cn(
                "font-bold font-heading text-foreground leading-snug flex flex-wrap items-center gap-1.5",
                variant === "card" ? "text-lg sm:text-xl" : "text-base",
              )}
            >
              {isTradeTest ? (
                <>
                  <span>Physical Trade Test at your nearest trade test center</span>
                  {variant === "card" && <TradeTestCentersInfo />}
                </>
              ) : (
                step.title
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        <ul className="space-y-2 mb-4">
          {step.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {step.branch && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            <div className="rounded-xl border border-success/30 bg-success/5 px-3 py-2.5 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-success">
                  {isInterview ? "Yes" : "Pass"}
                </p>
                <p className="text-sm text-foreground">{step.branch.pass}</p>
              </div>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2.5 flex items-start gap-2">
              <XCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-warning">No</p>
                <p className="text-sm text-foreground">{step.branch.fail}</p>
              </div>
            </div>
          </div>
        )}

        {isTradeTest && (
          <p className="text-xs text-muted-foreground mb-5 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            Hover or tap the info icon to see SafeWork Global&apos;s verified trade test centers.
          </p>
        )}

        <Button asChild className="w-full sm:w-auto rounded-xl h-11">
          <Link to="/worker/quick-signup">
            Start free registration
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

export default function WorkerJourneyDemo() {
  const [activeId, setActiveId] = useState<string | null>(STEPS[0].id);
  const activeStep = activeId ? STEPS.find((s) => s.id === activeId) ?? null : null;
  const activeIndex = activeId ? STEPS.findIndex((s) => s.id === activeId) : -1;

  const toggleStep = (stepId: string) => {
    setActiveId((current) => (current === stepId ? null : stepId));
  };

  return (
    <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden" id="worker-journey">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            Worker journey
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight">
            From registration to{" "}
            <span className="text-gradient">travel-ready deployment</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            A quick demo of how a new worker gets screened, skill-tested, and prepared for visa &amp; flight.
          </p>
        </div>

        {/* Desktop: A — vertical stepper + detail panel */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] gap-8 xl:gap-10 items-start">
          <ol className="space-y-0">
            {STEPS.map((step, index) => {
              const isActive = step.id === activeId;
              const isDone = activeIndex >= 0 && index < activeIndex;
              return (
                <li key={step.id} className="relative flex gap-3">
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-[1.15rem] top-10 bottom-0 w-px",
                        isDone ? "bg-primary/50" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex w-full items-start gap-3 rounded-xl p-2.5 transition-all",
                      isActive
                        ? "bg-primary/5 ring-1 ring-primary/25"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      aria-expanded={isActive}
                      className="flex flex-1 items-start gap-3 text-left min-w-0"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md transition-transform",
                          isActive || isDone
                            ? "bg-primary scale-105"
                            : "bg-muted-foreground/40",
                        )}
                      >
                        {isDone && !isActive ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          step.number
                        )}
                      </span>
                      <span className="min-w-0 pt-1">
                        <span
                          className={cn(
                            "block text-sm font-semibold font-heading leading-snug",
                            isActive ? "text-primary" : "text-foreground",
                          )}
                        >
                          {step.shortTitle}
                        </span>
                        {step.id === "trade-test" && (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            Nearest verified center
                          </span>
                        )}
                        {step.id === "payment" && (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            Unlock trade test booking
                          </span>
                        )}
                        {step.id === "travel" && (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            Visa &amp; flight
                          </span>
                        )}
                      </span>
                    </button>
                    {step.id === "trade-test" && (
                      <div className="pt-1.5 shrink-0">
                        <TradeTestCentersInfo />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-24">
            {activeStep ? (
              <StepDetail step={activeStep} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a step to see details — click again to close.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / tablet: D — accordion stepper */}
        <div className="lg:hidden space-y-3">
          {STEPS.map((step, index) => {
            const isActive = step.id === activeId;
            const isDone = activeIndex >= 0 && index < activeIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isActive
                    ? "border-primary/40 bg-card shadow-sm"
                    : "border-border/60 bg-card/80",
                )}
              >
                <div className="flex items-center gap-2 p-3.5">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    aria-expanded={isActive}
                    className="flex flex-1 items-center gap-3 text-left min-h-11 min-w-0"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                        isActive || isDone ? "bg-primary" : "bg-muted-foreground/35",
                      )}
                    >
                      {isDone && !isActive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold font-heading">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {step.id === "trade-test"
                          ? "Physical Trade Test"
                          : step.shortTitle}
                      </span>
                      {step.id === "trade-test" && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          At your nearest trade test center
                        </span>
                      )}
                      {step.id === "payment" && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Pay fee to unlock booking
                        </span>
                      )}
                      {step.id === "travel" && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Visa &amp; flight arrangements
                        </span>
                      )}
                    </span>
                  </button>
                  {step.id === "trade-test" && (
                    <div className="shrink-0">
                      <TradeTestCentersInfo />
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-4 pt-0 border-t border-border/50">
                        <div className="pt-3">
                          <StepDetail step={step} variant="plain" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
