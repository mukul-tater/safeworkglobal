import { supabase } from "@/integrations/supabase/client";
import {
  GCC_JOURNEY_NAV_STEPS,
  navStepForStage,
  navStepIndex,
  normalizeVerificationStage,
  type VerificationStage,
} from "@/modules/worker-verification/constants";

export type WorkerJourneyProgress = {
  stage: VerificationStage;
  percent: number;
  completed: number;
  total: number;
  currentLabel: string;
  complete: boolean;
};

export function progressFromVerification(row: {
  stage?: string | null;
  trade_test_required?: boolean | null;
} | null): WorkerJourneyProgress {
  const total = GCC_JOURNEY_NAV_STEPS.length;
  if (!row?.stage) {
    const first = GCC_JOURNEY_NAV_STEPS[0];
    return {
      stage: "essentials",
      percent: 0,
      completed: 0,
      total,
      currentLabel: first?.label ?? "Essentials",
      complete: false,
    };
  }

  const stage = normalizeVerificationStage(row.stage, row.trade_test_required);
  const complete = stage === "gcc_ready" || stage === "deployment";
  const idx = navStepIndex(navStepForStage(stage));
  const completed = complete ? total : Math.max(0, idx);
  const percent = complete ? 100 : Math.round((completed / total) * 100);
  const current = GCC_JOURNEY_NAV_STEPS[Math.max(0, idx)];

  return {
    stage,
    percent,
    completed,
    total,
    currentLabel: complete ? "Profile complete" : (current?.label ?? "Essentials"),
    complete,
  };
}

export async function loadWorkerJourneyProgress(
  userIds: string[],
): Promise<Map<string, WorkerJourneyProgress>> {
  const map = new Map<string, WorkerJourneyProgress>();
  if (!userIds.length) return map;

  const { data } = await (supabase as any)
    .from("worker_verification")
    .select("user_id, stage, trade_test_required")
    .in("user_id", userIds);

  for (const row of data || []) {
    map.set(row.user_id as string, progressFromVerification(row));
  }
  return map;
}
