import { useEffect, useMemo, useState } from "react";
import {
  User,
  FileText,
  ClipboardList,
  Video,
  Wrench,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { NavGroup, NavItem } from "@/components/layout/DashboardSidebar";
import { workerNavGroups } from "@/config/workerNav";
import {
  deriveSimpleJourneyStatuses,
  type JourneyStatus,
  type WorkerJourneyStepId,
} from "@/components/worker/WorkerJourneyHome";

type JourneyNavItem = NavItem & {
  status?: JourneyStatus;
};

const JOURNEY_META: {
  id: WorkerJourneyStepId;
  path: string;
  icon: LucideIcon;
  label: string;
}[] = [
  { id: "profile", path: "/worker/profile", icon: User, label: "Profile" },
  { id: "documents", path: "/worker/documents", icon: FileText, label: "Documents" },
  { id: "screening", path: "/worker/dashboard", icon: ClipboardList, label: "Shortlisting" },
  { id: "interview", path: "/worker/interviews", icon: Video, label: "Online Interview" },
  { id: "trade_test", path: "/worker/dashboard", icon: Wrench, label: "Trade Test" },
  { id: "verified", path: "/worker/profile", icon: Handshake, label: "Final Selection" },
];

function statusLabel(status: JourneyStatus): string {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Waiting";
}

/**
 * Worker nav with a collapsible "My Journey" accordion (sample 01).
 * Jobs stay always visible in the main Jobs group.
 */
export function useWorkerNavGroups(): { navGroups: NavGroup[]; loading: boolean } {
  const { profile, user } = useAuth();
  const [hasProfile, setHasProfile] = useState(!!profile?.full_name);
  const [hasDocuments, setHasDocuments] = useState(false);
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
        const [profileRes, docsRes] = await Promise.all([
          supabase
            .from("worker_profiles")
            .select("onboarding_completed")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase
            .from("worker_documents")
            .select("id", { count: "exact", head: true })
            .eq("worker_id", uid),
        ]);
        if (cancelled) return;
        setHasProfile(
          Boolean(profileRes.data?.onboarding_completed) || Boolean(profile?.full_name?.trim()),
        );
        setHasDocuments((docsRes.count ?? 0) > 0);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id, profile?.full_name]);

  const navGroups = useMemo(() => {
    const statuses = deriveSimpleJourneyStatuses({ hasProfile, hasDocuments });
    const completed = JOURNEY_META.filter((s) => statuses[s.id] === "completed").length;

    const journeyItems: JourneyNavItem[] = JOURNEY_META.map((step) => ({
      path: step.path,
      icon: step.icon,
      label: step.label,
      statusLabel: statusLabel(statuses[step.id]),
      statusTone: statuses[step.id],
    }));

    const journeyGroup: NavGroup = {
      label: "My Journey",
      badge: `${completed}/${JOURNEY_META.length}`,
      defaultOpen: false,
      items: journeyItems,
    };

    // Sample 01 order: Overview (Home) → My Journey → Jobs → rest
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
  }, [hasProfile, hasDocuments, profile?.full_name]);

  return { navGroups, loading };
}

export function usePhase1WorkerNavItems(
  baseItems: NavItem[],
  _profileLabel: string,
): NavItem[] {
  return useMemo(() => baseItems, [baseItems]);
}
