import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { UsersRound } from "lucide-react";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

export default function ConsultantDashboard() {
  const { partner } = useCurrentPartner();

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Consultant Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome{partner?.company_name ? `, ${partner.company_name}` : ""}. Mobilise and place
            candidates through SafeWork.
          </p>
        </div>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <UsersRound className="h-5 w-5 text-rose-700 dark:text-rose-400" />
            </div>
            <div>
              <div className="font-semibold">Your consultant profile is connected</div>
              <p className="text-sm text-muted-foreground mt-1">
                Candidate mobilisation workflows for placement consultants, recruitment partners,
                freelancers, NGOs and mobilisers will appear here as they go live.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PartnerLayout>
  );
}
