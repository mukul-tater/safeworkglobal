import { useMemo } from "react";
import type { NavGroup, NavItem } from "@/components/layout/DashboardSidebar";
import { workerNavGroups } from "@/config/workerNav";
import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";
import { GCC_JOURNEY_NAV_STEPS } from "@/modules/worker-verification/constants";

/**
 * Worker nav: GCC Journey = verification Tests 1–3 + payment / medical / bond / ready.
 * Old 13-step placement accordion (resume path) is not shown.
 */
export function useWorkerNavGroups(): { navGroups: NavGroup[]; loading: boolean } {
  const { navItems, completed, loading } = useWorkerGccJourneyProgress();

  const navGroups = useMemo(() => {
    const journeyGroup: NavGroup = {
      label: "GCC Journey",
      badge: `${completed}/${GCC_JOURNEY_NAV_STEPS.length}`,
      defaultOpen: true,
      items: navItems,
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
  }, [navItems, completed]);

  return { navGroups, loading };
}

export function usePhase1WorkerNavItems(
  baseItems: NavItem[],
  _profileLabel: string,
): NavItem[] {
  return useMemo(() => baseItems, [baseItems]);
}
