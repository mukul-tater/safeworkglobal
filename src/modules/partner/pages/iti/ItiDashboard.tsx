import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import AddWorkerButton from "../../components/AddWorkerButton";

export default function ItiDashboard() {
  const { partner } = useCurrentPartner();

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">ITI Partner Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome{partner?.company_name ? `, ${partner.company_name}` : ""}. Train and onboard
              skilled workers through SafeWork.
            </p>
          </div>
          {partner?.status !== "rejected" && partner?.status !== "suspended" && <AddWorkerButton />}
        </div>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <div className="font-semibold">Your institute is connected</div>
              <p className="text-sm text-muted-foreground mt-1">
                Add a worker to start the same GCC onboarding journey as an independent worker.
                After their account is created, continue verification here — they appear in My
                Workers as created by partner.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PartnerLayout>
  );
}
