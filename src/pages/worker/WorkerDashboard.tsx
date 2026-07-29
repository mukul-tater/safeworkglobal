import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { workerProfileMenu } from "@/config/workerNav";
import { useWorkerNavGroups } from "@/modules/worker-registration/hooks/useWorkerNavGroups";
import WorkerJourneyHome from "@/components/worker/WorkerJourneyHome";

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const { navGroups } = useWorkerNavGroups();
  const [documents, setDocuments] = useState<unknown[]>([]);
  const [workerProfile, setWorkerProfile] = useState<{ full_name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([
          supabase.from("worker_documents").select("id").eq("worker_id", profile.id),
          supabase.from("worker_profiles").select("full_name").eq("user_id", profile.id).maybeSingle(),
        ]);
        if (cancelled) return;
        setDocuments(docsRes.data || []);
        setWorkerProfile(profileRes.data);
      } catch (error) {
        console.error("Error fetching worker data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (loading) {
    return (
      <DashboardLayout
        navGroups={navGroups}
        portalLabel="Worker Portal"
        portalName="Worker Portal"
        profileMenuItems={workerProfileMenu}
      >
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const hasProfile = !!(workerProfile?.full_name || profile?.full_name);
  const hasDocuments = documents.length > 0;

  return (
    <DashboardLayout
      navGroups={navGroups}
      portalLabel="Worker Portal"
      portalName="Worker Portal"
      profileMenuItems={workerProfileMenu}
    >
      <PortalBreadcrumb />

      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">
          Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow these simple steps. Tap a step to see what to do next.
        </p>
      </div>

      <WorkerJourneyHome
        workerName={profile?.full_name || workerProfile?.full_name}
        hasProfile={hasProfile}
        hasDocuments={hasDocuments}
      />
    </DashboardLayout>
  );
}
