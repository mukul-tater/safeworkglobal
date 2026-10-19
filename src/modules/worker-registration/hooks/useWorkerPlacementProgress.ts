import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";
import type { PlacementStepId, PlacementStepStatus } from "@/components/worker/placementJourney";

/**
 * Home and placement progress use the same GCC journey steps as My progress.
 */
export function useWorkerPlacementProgress(): {
  loading: boolean;
  statuses: Record<PlacementStepId, PlacementStepStatus>;
  journeyIncomplete: boolean;
} {
  const { statuses, loading, journeyIncomplete } = useWorkerGccJourneyProgress();
  return { loading, statuses, journeyIncomplete };
}
