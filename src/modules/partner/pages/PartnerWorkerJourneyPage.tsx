import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import WorkerVerificationPage from "@/modules/worker-verification/pages/WorkerVerificationPage";
import { WorkerKioskProvider } from "../context/WorkerKioskContext";
import {
  partnerWorkerJourneyPath,
  resolvePartnerAddWorkerContext,
} from "../lib/partnerAssistedWorker";

/**
 * Partner stays signed in and fills the worker GCC journey as a kiosk
 * service, using the same worker-portal sidebar as the worker.
 */
export default function PartnerWorkerJourneyPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [myWorkersPath, setMyWorkersPath] = useState("/partner/my-workers");

  useEffect(() => {
    if (!user?.id || !workerId) {
      setAllowed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: owns }, ctx] = await Promise.all([
        (supabase as any).rpc("partner_manages_worker", { _worker_user_id: workerId }),
        resolvePartnerAddWorkerContext(user.id),
      ]);
      if (cancelled) return;
      setMyWorkersPath(ctx.myWorkersPath);
      if (!owns) {
        setAllowed(false);
        navigate(ctx.myWorkersPath, { replace: true });
        return;
      }
      setAllowed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, workerId, navigate]);

  if (allowed !== true || !workerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <WorkerKioskProvider
      workerUserId={workerId}
      journeyPath={partnerWorkerJourneyPath(workerId)}
      includeAccountDetails
      myWorkersPath={myWorkersPath}
    >
      <WorkerPortalLayout>
        <WorkerVerificationPage actingForWorkerId={workerId} embedded />
      </WorkerPortalLayout>
    </WorkerKioskProvider>
  );
}
