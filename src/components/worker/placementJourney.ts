import {
  GCC_JOURNEY_NAV_STEPS,
  type GccNavStepId,
} from "@/modules/worker-verification/constants";

export type PlacementStepStatus = "completed" | "current" | "waiting";

/** Same steps as the live GCC journey. */
export type PlacementStepId = GccNavStepId;

export type PlacementStepDef = {
  id: PlacementStepId;
  shortLabel: string;
  fullLabel: string;
  path: string;
};

export const PLACEMENT_STEPS: PlacementStepDef[] = GCC_JOURNEY_NAV_STEPS.map((step) => ({
  id: step.id,
  shortLabel: step.shortLabel,
  fullLabel: step.label,
  path: "/worker/journey",
}));

/** Map flags into a linear completed → current → waiting pipeline. */
export function derivePlacementStatuses(
  done: Partial<Record<PlacementStepId, boolean>>,
): Record<PlacementStepId, PlacementStepStatus> {
  const result = {} as Record<PlacementStepId, PlacementStepStatus>;
  let locked = false;

  for (const step of PLACEMENT_STEPS) {
    if (!locked && done[step.id]) {
      result[step.id] = "completed";
      continue;
    }
    if (!locked) {
      result[step.id] = "current";
      locked = true;
    } else {
      result[step.id] = "waiting";
    }
  }

  if (!locked) {
    for (const step of PLACEMENT_STEPS) {
      result[step.id] = "completed";
    }
  }

  return result;
}

export function placementStatusLabel(status: PlacementStepStatus): string {
  if (status === "completed") return "Completed";
  if (status === "current") return "In Progress";
  return "Waiting";
}

export function placementStatusTone(
  status: PlacementStepStatus,
): "completed" | "in_progress" | "waiting" {
  if (status === "completed") return "completed";
  if (status === "current") return "in_progress";
  return "waiting";
}
