import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import type { NavGroup, NavItem } from "@/components/layout/DashboardSidebar";
import { workerNavGroups } from "@/config/workerNav";
import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";
import { useWorkerKiosk } from "@/modules/partner/context/WorkerKioskContext";

/**
 * Worker nav: My progress = verification Tests 1–3 + payment / medical / bond / ready.
 * Old 13-step placement accordion (resume path) is not shown.
 */
export function useWorkerNavGroups(): { navGroups: NavGroup[]; loading: boolean } {
  const { navItems, completed, loading, total } = useWorkerGccJourneyProgress();
  const kiosk = useWorkerKiosk();
  const isKiosk = Boolean(kiosk.includeAccountDetails || kiosk.workerUserId);

  const navGroups = useMemo(() => {
    const journeyGroup: NavGroup = {
      label: "My progress",
      badge: `${completed}/${total}`,
      defaultOpen: true,
      items: navItems,
    };

    if (isKiosk) {
      const menu: NavGroup = {
        label: "Menu",
        defaultOpen: true,
        items: [
          {
            path: kiosk.myWorkersPath || "/partner/my-workers",
            icon: ArrowLeft,
            label: "My Workers",
          },
        ],
      };
      return [menu, journeyGroup];
    }

    const overview = workerNavGroups.find((g) => g.label === "Overview");
    const jobs = workerNavGroups.find((g) => g.label === "Jobs");
    const rest = workerNavGroups.filter((g) => g.label !== "Overview" && g.label !== "Jobs");

    const overviewSlim: NavGroup | null = overview
      ? {
          ...overview,
          label: "Menu",
          defaultOpen: true,
          items: overview.items
            .filter((i) => i.path === "/worker/dashboard" || i.path === "/worker/profile")
            .map((i) =>
              i.path === "/worker/dashboard"
                ? { ...i, label: "Home" }
                : i.path === "/worker/profile"
                  ? { ...i, label: "Profile" }
                  : i,
            ),
        }
      : null;

    return [
      ...(overviewSlim ? [overviewSlim] : []),
      journeyGroup,
      ...(jobs ? [{ ...jobs, defaultOpen: true }] : []),
      ...rest,
    ];
  }, [navItems, completed, total, isKiosk, kiosk.myWorkersPath]);

  return { navGroups, loading };
}

export function usePhase1WorkerNavItems(
  baseItems: NavItem[],
  _profileLabel: string,
): NavItem[] {
  return useMemo(() => baseItems, [baseItems]);
}
