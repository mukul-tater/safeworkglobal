import { LayoutDashboard, Search, User } from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";
import { useWorkerAuth } from "../context/WorkerAuthContext";
import { usePhase1WorkerNavItems } from "./useWorkerNavGroups";

export type WorkerPortalPage = "dashboard" | "jobs" | "onboarding";

export function usePhase1WorkerNav(page: WorkerPortalPage = "dashboard") {
  const { t } = useWorkerLanguage();
  const { worker } = useWorkerAuth();
  const profileLabel = worker?.onboardingCompleted ? t("nav.editProfile") : t("nav.completeProfile");

  const portalNameByPage: Record<WorkerPortalPage, string> = {
    dashboard: t("nav.dashboard"),
    jobs: t("nav.jobs"),
    onboarding: profileLabel,
  };

  const baseNavItems = [
    { path: "/home", icon: LayoutDashboard, label: t("nav.dashboard") },
    { path: "/jobs", icon: Search, label: t("nav.jobs") },
    { path: "/onboarding", icon: User, label: profileLabel },
  ];
  const navItems = usePhase1WorkerNavItems(baseNavItems, profileLabel);

  const navGroups: NavGroup[] = [
    {
      label: t("nav.overview"),
      defaultOpen: true,
      items: navItems,
    },
  ];

  const profileMenuItems = [
    { label: profileLabel, icon: User, path: "/onboarding" },
  ];

  return {
    navGroups,
    profileMenuItems,
    portalLabel: t("nav.portalLabel"),
    portalName: portalNameByPage[page],
  };
}
