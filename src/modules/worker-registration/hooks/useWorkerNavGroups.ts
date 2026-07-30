import { useMemo } from "react";
import { Flag } from "lucide-react";
import type { NavGroup, NavItem } from "@/components/layout/DashboardSidebar";
import { workerNavGroups } from "@/config/workerNav";
import {
  PLACEMENT_STEPS,
  placementStatusLabel,
  placementStatusTone,
} from "@/components/worker/placementJourney";
import { useWorkerPlacementProgress } from "@/modules/worker-registration/hooks/useWorkerPlacementProgress";

/**
 * Worker nav: one GCC Journey group (verification wizard + placement steps).
 * Do not show a separate "GCC Journey" under Menu — that duplicated My Journey.
 */
export function useWorkerNavGroups(): { navGroups: NavGroup[]; loading: boolean } {
  const { statuses, loading } = useWorkerPlacementProgress();

  const navGroups = useMemo(() => {
    const completed = PLACEMENT_STEPS.filter((s) => statuses[s.id] === "completed").length;

    const journeyItems: NavItem[] = [
      {
        path: "/worker/journey",
        icon: Flag,
        label: "Verification",
      },
      ...PLACEMENT_STEPS.map((step) => ({
        id: step.id,
        path: step.path,
        icon: step.icon,
        label: step.shortLabel,
        statusLabel: placementStatusLabel(statuses[step.id]),
        statusTone: placementStatusTone(statuses[step.id]),
      })),
    ];

    const journeyGroup: NavGroup = {
      label: "GCC Journey",
      badge: `${completed}/${PLACEMENT_STEPS.length}`,
      defaultOpen: true,
      items: journeyItems,
    };

    const overview = workerNavGroups.find((g) => g.label === "Overview");
    const jobs = workerNavGroups.find((g) => g.label === "Jobs");
    const rest = workerNavGroups.filter((g) => g.label !== "Overview" && g.label !== "Jobs");

    const overviewSlim: NavGroup | null = overview
      ? {
          ...overview,
          label: "Menu",
          defaultOpen: true,
          items: overview.items
            .filter((i) => i.path === "/worker/dashboard")
            .map((i) => ({ ...i, label: "Home" })),
        }
      : null;

    return [
      ...(overviewSlim ? [overviewSlim] : []),
      journeyGroup,
      ...(jobs ? [{ ...jobs, defaultOpen: true }] : []),
      ...rest,
    ];
  }, [statuses]);

  return { navGroups, loading };
}

export function usePhase1WorkerNavItems(
  baseItems: NavItem[],
  _profileLabel: string,
): NavItem[] {
  return useMemo(() => baseItems, [baseItems]);
}
