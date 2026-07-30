import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CreditCard,
  FileSignature,
  Flag,
  ImagePlus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  GCC_JOURNEY_NAV_STEPS,
  navStepForStage,
  navStepIndex,
  normalizeVerificationStage,
  type GccNavStepId,
  type VerificationStage,
} from "@/modules/worker-verification/constants";

export type GccStepStatus = "completed" | "current" | "waiting";

const STEP_ICONS: Record<GccNavStepId, LucideIcon> = {
  essentials: UserRound,
  test1: ClipboardList,
  skill_proof: ImagePlus,
  identity: ShieldCheck,
  test2: Video,
  payment: CreditCard,
  test3: Wrench,
  medical: Stethoscope,
  bond: FileSignature,
  gcc_ready: Flag,
};

function deriveNavStatuses(
  stage: VerificationStage | null,
  tradeRequired: boolean,
): Record<GccNavStepId, GccStepStatus> {
  const currentNav = navStepForStage(stage ?? "essentials");
  const curIdx = navStepIndex(currentNav);
  const out = {} as Record<GccNavStepId, GccStepStatus>;

  for (const step of GCC_JOURNEY_NAV_STEPS) {
    const i = navStepIndex(step.id);
    if (stage === "gcc_ready" || currentNav === "gcc_ready") {
      out[step.id] = "completed";
    } else if (step.id === "test3" && !tradeRequired && curIdx > navStepIndex("payment")) {
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

/**
 * GCC Journey: Test 1 = quiz, Test 2 = interview, Test 3 = physical trade (skill-based), then Medical.
 */
export function useWorkerGccJourneyProgress() {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState<VerificationStage | null>(null);
  const [tradeRequired, setTradeRequired] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.id || profile?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [{ data }, { data: wp }] = await Promise.all([
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
        ]);
        if (cancelled) return;

        const trade =
          data?.trade_test_required !== null && data?.trade_test_required !== undefined
            ? Boolean(data.trade_test_required)
            : true;
        setTradeRequired(trade);

        let nextStage = normalizeVerificationStage(
          (data?.stage as string) || "essentials",
          trade,
        );
        const kycStatus = String((wp as any)?.kyc_status || "not_started");
        const kycOk = kycStatus === "submitted" || kycStatus === "verified";
        const pastMedia =
          nextStage !== "essentials" &&
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
    window.addEventListener("focus", onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("swg-verification-updated", onUpdated);
      window.removeEventListener("focus", onUpdated);
    };
  }, [user?.id, profile?.id]);

  const statuses = useMemo(
    () => deriveNavStatuses(stage, tradeRequired),
    [stage, tradeRequired],
  );
  const completed = GCC_JOURNEY_NAV_STEPS.filter((s) => statuses[s.id] === "completed").length;
  const journeyIncomplete = stage !== "gcc_ready";

  const navItems = useMemo(
    () =>
      GCC_JOURNEY_NAV_STEPS.map((step) => {
        const tone =
          statuses[step.id] === "current"
            ? ("in_progress" as const)
            : statuses[step.id];
        return {
          id: step.id,
          path: "/worker/journey",
          icon: STEP_ICONS[step.id],
          label: step.label,
          statusLabel: statusLabel(statuses[step.id]),
          statusTone: tone,
          // Locked stepper: cannot jump ahead. Done steps stay viewable.
          disabled: statuses[step.id] === "waiting",
        };
      }),
    [statuses],
  );

  return {
    loading,
    stage,
    statuses,
    completed,
    total: GCC_JOURNEY_NAV_STEPS.length,
    journeyIncomplete,
    navItems,
    tradeRequired,
  };
}
