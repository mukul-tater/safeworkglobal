import { LayoutDashboard, Search, User } from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

export type WorkerPortalPage = "dashboard" | "jobs" | "onboarding";

export function usePhase1WorkerNav(page: WorkerPortalPage = "dashboard") {
  const { t } = useWorkerLanguage();

  const portalNameByPage: Record<WorkerPortalPage, string> = {
    dashboard: t("nav.dashboard"),
    jobs: t("nav.jobs"),
    onboarding: t("nav.completeProfile"),
  };

  const navGroups: NavGroup[] = [
    {
      label: t("nav.overview"),
      defaultOpen: true,
      items: [
        { path: "/home", icon: LayoutDashboard, label: t("nav.dashboard") },
        { path: "/jobs", icon: Search, label: t("nav.jobs") },
        { path: "/onboarding", icon: User, label: t("nav.completeProfile") },
      ],
    },
  ];

  const profileMenuItems = [
    { label: t("nav.completeProfile"), icon: User, path: "/onboarding" },
  ];

  return {
    navGroups,
    profileMenuItems,
    portalLabel: t("nav.portalLabel"),
    portalName: portalNameByPage[page],
  };
}
