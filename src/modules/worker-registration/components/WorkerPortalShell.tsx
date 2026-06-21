import type { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";
import type { WorkerPortalPage } from "../hooks/usePhase1WorkerNav";

export function useWorkerPortalShell(page: WorkerPortalPage = "dashboard") {
  const { role } = useAuth();
  const isLegacyWorker = role === "worker";

  if (isLegacyWorker) {
    const legacyPortalName =
      page === "jobs" ? "Find Jobs" : page === "onboarding" ? "Complete Profile" : "Worker Portal";

    return {
      usePortalLayout: true as const,
      layoutProps: {
        navGroups: workerNavGroups,
        portalLabel: "Worker Portal",
        portalName: legacyPortalName,
        profileMenuItems: workerProfileMenu,
        portalHomePath: "/worker/dashboard",
        showLanguageSwitcher: false,
      },
    };
  }

  return { usePortalLayout: false as const, layoutProps: null };
}

interface WorkerPortalShellProps {
  page?: WorkerPortalPage;
  children: ReactNode;
}

/** Wraps content in the worker dashboard shell when a worker is signed in. */
export function WorkerPortalShell({ page = "dashboard", children }: WorkerPortalShellProps) {
  const shell = useWorkerPortalShell(page);

  if (!shell.usePortalLayout) {
    return <>{children}</>;
  }

  return <DashboardLayout {...shell.layoutProps}>{children}</DashboardLayout>;
}

interface PublicOrWorkerPortalLayoutProps {
  page?: WorkerPortalPage;
  children: ReactNode;
  /** Rendered above the public header only (e.g. SEO). */
  publicHead?: ReactNode;
}

/**
 * Uses the worker dashboard shell when a Supabase worker is signed in;
 * otherwise falls back to the marketing site chrome.
 */
export function PublicOrWorkerPortalLayout({
  page = "dashboard",
  children,
  publicHead,
}: PublicOrWorkerPortalLayoutProps) {
  const shell = useWorkerPortalShell(page);

  if (shell.usePortalLayout) {
    return <DashboardLayout {...shell.layoutProps}>{children}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      {publicHead}
      <Header />
      <MobileBottomNav />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 md:py-10">{children}</main>
      <Footer />
    </div>
  );
}
