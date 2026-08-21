import type { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerProfileMenu } from "@/config/workerNav";
import { useWorkerNavGroups } from "@/modules/worker-registration/hooks/useWorkerNavGroups";
import PartnerAssistedJourneyBanner from "@/modules/partner/components/PartnerAssistedJourneyBanner";

interface Props {
  children: ReactNode;
}

/** Worker portal shell with GCC Journey sidebar accordion. */
export default function WorkerPortalLayout({ children }: Props) {
  const { navGroups } = useWorkerNavGroups();

  return (
    <DashboardLayout
      navGroups={navGroups}
      portalLabel="Worker Portal"
      portalName="Worker Portal"
      profileMenuItems={workerProfileMenu}
      portalHomePath="/worker/dashboard"
    >
      <PartnerAssistedJourneyBanner />
      {children}
    </DashboardLayout>
  );
}
