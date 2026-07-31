import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Construction } from "lucide-react";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";

/**
 * Escrow / salary hold is disabled until a real payment provider is wired.
 * Client-side HELD/RELEASED ledger was removed because it was not real money.
 */
export default function EscrowPayments() {
  return (
    <DashboardLayout
      navGroups={employerNavGroups}
      portalLabel="Employer Portal"
      portalName="Employer Portal"
      profileMenuItems={employerProfileMenu}
    >
      <div className="space-y-4 max-w-2xl">
        <EmployerFlowStepper current="escrow" />
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mb-2">
                  <Construction className="h-3 w-3" />
                  Coming soon
                </div>
                <h1 className="text-xl font-semibold">Escrow payments</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Secure salary escrow will open once payment rails are live. Creating or releasing
                  “held” payments from the browser is disabled so no fake ledger can be treated as money.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
