import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

export default function ItiDashboard() {
  const { partner } = useCurrentPartner();

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ITI Partner Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome{partner?.company_name ? `, ${partner.company_name}` : ""}. Train and onboard
            skilled workers through SafeWork.
          </p>
        </div>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <div className="font-semibold">Your institute is connected</div>
              <p className="text-sm text-muted-foreground mt-1">
                Worker intake and training workflows for ITI partners will appear here as they go live.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PartnerLayout>
  );
}
