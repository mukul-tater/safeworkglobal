import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ClipboardList,
  CreditCard,
  FileSignature,
  Flag,
  GraduationCap,
  ImagePlus,
  KeyRound,
  Plane,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWorkerKiosk } from "@/modules/partner/context/WorkerKioskContext";
import {
  gccJourneyNavSteps,
  navStepForStage,
  normalizeVerificationStage,
  type GccNavStepId,
  type VerificationStage,
} from "@/modules/worker-verification/constants";
import { getWorkerDeclarations } from "@/modules/worker-verification/services/declarationService";

export type GccStepStatus = "completed" | "current" | "waiting";

const STEP_ICONS: Record<GccNavStepId, LucideIcon> = {
  pre_declaration: FileSignature,
  account_details: KeyRound,
  essentials: UserRound,
  find_jobs: Search,
  apply_job: Briefcase,
  test1: ClipboardList,
  skill_proof: ImagePlus,
  identity: ShieldCheck,
  test2: Video,
  payment: CreditCard,
  test3: Wrench,
  medical: Stethoscope,
  bond: FileSignature,
  pdot: GraduationCap,
  gcc_ready: Flag,
  deployment: Plane,
};

export function deriveNavStatuses(
  stage: VerificationStage | null,
  tradeRequired: boolean,
  opts: {
    declarationsDone: boolean;
    includeAccountDetails: boolean;
    accountCreated: boolean;
  },
): Record<GccNavStepId, GccStepStatus> {
  const steps = gccJourneyNavSteps({ includeAccountDetails: opts.includeAccountDetails });
  let currentNav: GccNavStepId;
  if (!opts.declarationsDone) {
    currentNav = "pre_declaration";
  } else if (opts.includeAccountDetails && !opts.accountCreated) {
    currentNav = "account_details";
  } else {
    currentNav = navStepForStage(stage ?? "essentials");
  }

  const curIdx = steps.findIndex((s) => s.id === currentNav);
  const out = {} as Record<GccNavStepId, GccStepStatus>;

  for (const step of steps) {
    const i = steps.findIndex((s) => s.id === step.id);
    if (currentNav === "gcc_ready" && i <= curIdx) {
      out[step.id] = "completed";
    } else if (step.id === "test3" && !tradeRequired && curIdx > steps.findIndex((s) => s.id === "payment")) {
      out[step.id] = "completed";
    } else if (i < curIdx) {
      out[step.id] = "completed";
    } else if (i === curIdx) {
      out[step.id] = "current";
    } else {
      out[step.id] = "waiting";
    }
  }
  return out;
}

function statusLabel(s: GccStepStatus): string {
  if (s === "completed") return "Done";
  if (s === "current") return "In progress";
  return "Waiting";
}

export type UseWorkerGccJourneyProgressOpts = {
  workerUserId?: string | null;
  includeAccountDetails?: boolean;
  journeyPath?: string;
  /** Partner add-worker before the account exists. */
  draft?: {
    declarationsDone: boolean;
    accountCreated: boolean;
  };
};

/**
 * GCC Journey: Find jobs + apply, then Test 1 = quiz.
 */
export function useWorkerGccJourneyProgress(opts?: UseWorkerGccJourneyProgressOpts) {
  const { user, profile } = useAuth();
  const kiosk = useWorkerKiosk();
  const workerUserId = opts?.workerUserId ?? kiosk.workerUserId ?? user?.id ?? profile?.id ?? null;
  const includeAccountDetails = opts?.includeAccountDetails ?? kiosk.includeAccountDetails;
  const journeyPath = opts?.journeyPath ?? kiosk.journeyPath ?? "/worker/journey";
  const draft = opts?.draft ?? kiosk.draft;

  const [stage, setStage] = useState<VerificationStage | null>(null);
  const [tradeRequired, setTradeRequired] = useState(true);
  const [declarationsDone, setDeclarationsDone] = useState(Boolean(draft?.declarationsDone));
  const [loading, setLoading] = useState(!draft);

  useEffect(() => {
    if (draft) {
      setDeclarationsDone(draft.declarationsDone);
      setStage("essentials");
      setLoading(false);
      return;
    }

    const uid = workerUserId;
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [{ data }, { data: wp }, decl] = await Promise.all([
          (supabase as any)
            .from("worker_verification")
            .select("stage, trade_test_required, primary_skill")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase
            .from("worker_profiles")
            .select("kyc_status")
            .eq("user_id", uid)
            .maybeSingle(),
          getWorkerDeclarations(uid),
        ]);
        if (cancelled) return;

        const trade =
          data?.trade_test_required !== null && data?.trade_test_required !== undefined
            ? Boolean(data.trade_test_required)
            : true;
        setTradeRequired(trade);
        setDeclarationsDone(Boolean(decl?.completed_at));

        let nextStage = normalizeVerificationStage(
          (data?.stage as string) || "essentials",
          trade,
        );
        const kycStatus = String((wp as any)?.kyc_status || "not_started");
        const kycOk = kycStatus === "submitted" || kycStatus === "verified";
        const pastMedia =
          nextStage !== "essentials" &&
          nextStage !== "find_jobs" &&
          nextStage !== "apply_job" &&
          nextStage !== "quiz" &&
          nextStage !== "media";
        if (!kycOk && pastMedia && nextStage !== "identity") {
          nextStage = "identity";
        }
        setStage(nextStage);
      } catch {
        if (!cancelled) setStage("essentials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const onUpdated = () => {
      void load();
    };
    window.addEventListener("swg-verification-updated", onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("swg-verification-updated", onUpdated);
    };
  }, [workerUserId, draft?.declarationsDone, draft?.accountCreated]);

  const steps = useMemo(
    () => gccJourneyNavSteps({ includeAccountDetails }),
    [includeAccountDetails],
  );

  const statuses = useMemo(
    () =>
      deriveNavStatuses(stage, tradeRequired, {
        declarationsDone,
        includeAccountDetails,
        accountCreated: draft ? draft.accountCreated : Boolean(workerUserId),
      }),
    [stage, tradeRequired, declarationsDone, includeAccountDetails, draft, workerUserId],
  );
  const completed = steps.filter((s) => statuses[s.id] === "completed").length;
  const journeyIncomplete = stage !== "gcc_ready" && stage !== "deployment";

  const navItems = useMemo(
    () =>
      steps.map((step) => {
        const status = statuses[step.id];
        const tone: "completed" | "in_progress" | "waiting" =
          status === "current" ? "in_progress" : status === "completed" ? "completed" : "waiting";
        return {
          id: step.id,
          path: journeyPath,
          icon: STEP_ICONS[step.id],
          label: step.navLabel,
          title: step.label,
          statusLabel: statusLabel(statuses[step.id]),
          statusTone: tone,
          disabled: statuses[step.id] === "waiting",
        };
      }),
    [statuses, steps, journeyPath],
  );

  return {
    loading,
    stage,
    statuses,
    completed,
    total: steps.length,
    journeyIncomplete,
    navItems,
    tradeRequired,
    steps,
    declarationsDone,
  };
}
