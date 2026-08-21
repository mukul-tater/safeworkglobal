import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WorkerVerificationPage from "@/modules/worker-verification/pages/WorkerVerificationPage";
import {
  CREATED_BY_PARTNER_LABEL,
  resolvePartnerAddWorkerContext,
} from "../lib/partnerAssistedWorker";

/**
 * Partner stays signed in and fills the worker GCC journey as a kiosk service.
 * The worker can also sign in later with the mobile/password and continue.
 */
export default function PartnerWorkerJourneyPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [workerName, setWorkerName] = useState("this worker");
  const [backTo, setBackTo] = useState("/partner/my-workers");

  useEffect(() => {
    if (!user?.id || !workerId) {
      setAllowed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: owns }, { data: profile }, ctx] = await Promise.all([
        (supabase as any).rpc("partner_manages_worker", { _worker_user_id: workerId }),
        supabase.from("profiles").select("full_name").eq("id", workerId).maybeSingle(),
        resolvePartnerAddWorkerContext(user.id),
      ]);
      if (cancelled) return;
      setBackTo(ctx.myWorkersPath);
      setWorkerName((profile?.full_name as string | null)?.trim() || "this worker");
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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Partner service
              </p>
              <Badge variant="secondary">{CREATED_BY_PARTNER_LABEL}</Badge>
            </div>
            <h1 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
              Filling GCC journey for {workerName}
            </h1>
            <p className="text-xs text-muted-foreground">
              You stay signed in as the partner. The worker can also sign in later with their
              mobile and password.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={backTo}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              My Workers
            </Link>
          </Button>
        </div>
      </header>
      <main className="px-4 py-5 sm:px-6">
        <WorkerVerificationPage actingForWorkerId={workerId} embedded />
      </main>
    </div>
  );
}
