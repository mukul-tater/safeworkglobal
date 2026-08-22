import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerProfileMenu } from "@/config/workerNav";
import QuickWorkerSignup from "@/pages/worker/QuickWorkerSignup";
import WorkerPreJourneyScreeningModal from "@/modules/worker-verification/components/journey/WorkerPreJourneyScreeningModal";
import { useWorkerNavGroups } from "@/modules/worker-registration/hooks/useWorkerNavGroups";
import { WorkerKioskProvider } from "@/modules/partner/context/WorkerKioskContext";
import {
  CREATED_BY_PARTNER_LABEL,
  PARTNER_ADD_WORKER_PATH,
  PARTNER_MY_WORKERS_PATH,
  resolvePartnerAddWorkerContext,
} from "@/modules/partner/lib/partnerAssistedWorker";
import {
  PARTNER_DRAFT_DECL_ID,
  hasPartnerDraftDeclarations,
} from "@/modules/worker-verification/services/declarationService";
import { useAuth } from "@/contexts/AuthContext";

function PartnerAddWorkerShell({
  declarationsDone,
  onDeclarationsDone,
  myWorkersPath,
}: {
  declarationsDone: boolean;
  onDeclarationsDone: () => void;
  myWorkersPath: string;
}) {
  const { navGroups } = useWorkerNavGroups();

  return (
    <DashboardLayout
      navGroups={navGroups}
      portalLabel="Worker Portal"
      portalName="Add Worker"
      profileMenuItems={workerProfileMenu}
      portalHomePath={myWorkersPath}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Partner service
            </p>
            <Badge variant="secondary">{CREATED_BY_PARTNER_LABEL}</Badge>
          </div>
          <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight">
            {declarationsDone ? "Create their worker login" : "Pre-declaration"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {declarationsDone
              ? "Name, email, mobile OTP and password. You stay signed in as the partner."
              : "Complete declarations first, then create the worker login."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={myWorkersPath}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            My Workers
          </Link>
        </Button>
      </div>

      {!declarationsDone ? (
        <WorkerPreJourneyScreeningModal
          userId={PARTNER_DRAFT_DECL_ID}
          isOpen
          variant="inline"
          onCompleted={onDeclarationsDone}
        />
      ) : (
        <QuickWorkerSignup assistedByPartner embedded />
      )}
    </DashboardLayout>
  );
}

/**
 * Partner add-worker uses the same worker-portal sidebar as the GCC journey.
 * Pre-declaration → worker login details → then the rest of the journey.
 */
export default function PartnerAddWorkerPage() {
  const { user } = useAuth();
  const [declarationsDone, setDeclarationsDone] = useState(hasPartnerDraftDeclarations);
  const [myWorkersPath, setMyWorkersPath] = useState(PARTNER_MY_WORKERS_PATH);

  useEffect(() => {
    if (!user?.id) return;
    void resolvePartnerAddWorkerContext(user.id).then((ctx) => {
      setMyWorkersPath(ctx.myWorkersPath);
    });
  }, [user?.id]);

  const draft = useMemo(
    () => ({ declarationsDone, accountCreated: false as const }),
    [declarationsDone],
  );

  return (
    <WorkerKioskProvider
      workerUserId={null}
      journeyPath={PARTNER_ADD_WORKER_PATH}
      includeAccountDetails
      myWorkersPath={myWorkersPath}
      draft={draft}
    >
      <PartnerAddWorkerShell
        declarationsDone={declarationsDone}
        onDeclarationsDone={() => setDeclarationsDone(true)}
        myWorkersPath={myWorkersPath}
      />
    </WorkerKioskProvider>
  );
}
