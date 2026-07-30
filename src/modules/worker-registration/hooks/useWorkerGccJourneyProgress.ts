import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CreditCard,
  FileSignature,
  Flag,
  ImagePlus,
  Stethoscope,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  GCC_JOURNEY_NAV_STEPS,
  VERIFICATION_STAGE_ORDER,
  type VerificationStage,
} from "@/modules/worker-verification/constants";
import { stageIndex } from "@/modules/worker-verification/services/verificationService";

export type GccStepStatus = "completed" | "current" | "waiting";

const STEP_ICONS: Record<VerificationStage, LucideIcon> = {
  essentials: UserRound,
  quiz: ClipboardList,
  media: ImagePlus,
  awaiting_interview: Video,
  awaiting_payment: CreditCard,
  tests: Stethoscope,
  bond: FileSignature,
  gcc_ready: Flag,
};

function deriveStatuses(stage: VerificationStage | null): Record<VerificationStage, GccStepStatus> {
  const current = stage ?? "essentials";
  const curIdx = stageIndex(current);
  const out = {} as Record<VerificationStage, GccStepStatus>;
  for (const s of VERIFICATION_STAGE_ORDER) {
    const i = stageIndex(s);
    if (current === "gcc_ready") {
      out[s] = "completed";
    } else if (i < curIdx) {
      out[s] = "completed";
    } else if (i === curIdx) {
      out[s] = "current";
    } else {
      out[s] = "waiting";
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
 * GCC Journey progress from worker_verification.stage (Test 1 / 2 / 3 path).
 */
export function useWorkerGccJourneyProgress() {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState<VerificationStage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.id || profile?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("worker_verification")
          .select("stage")
          .eq("user_id", uid)
          .maybeSingle();
        if (!cancelled) {
          setStage((data?.stage as VerificationStage) || "essentials");
        }
      } catch {
        if (!cancelled) setStage("essentials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id]);

  const statuses = useMemo(() => deriveStatuses(stage), [stage]);
  const completed = VERIFICATION_STAGE_ORDER.filter((s) => statuses[s] === "completed").length;
  const journeyIncomplete = stage !== "gcc_ready";

  const navItems = useMemo(
    () =>
      GCC_JOURNEY_NAV_STEPS.map((step) => ({
        id: step.id,
        path: "/worker/journey",
        icon: STEP_ICONS[step.id],
        label: step.label,
        statusLabel: statusLabel(statuses[step.id]),
        statusTone: statuses[step.id] === "current" ? ("in_progress" as const) : statuses[step.id],
      })),
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
  };
}
