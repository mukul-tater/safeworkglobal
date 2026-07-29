import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Card } from "@/components/ui/card";
import { Shield, Send, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

export default function Insurance() {
  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Insurance & Remittance</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage your insurance policy and send money home</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
        <Card className="p-8 text-center">
          <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <Badge className="bg-warning/10 text-warning border-warning/20 mb-3">
            <Construction className="h-3 w-3 mr-1" /> Coming Soon
          </Badge>
          <h2 className="text-lg font-semibold mb-2">Health Insurance</h2>
          <p className="text-muted-foreground text-sm">
            Comprehensive health insurance coverage for overseas workers will be available soon. Stay tuned!
          </p>
        </Card>

        <Card className="p-8 text-center">
          <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Send className="h-8 w-8 text-primary" />
          </div>
          <Badge className="bg-warning/10 text-warning border-warning/20 mb-3">
            <Construction className="h-3 w-3 mr-1" /> Coming Soon
          </Badge>
          <h2 className="text-lg font-semibold mb-2">Remittance</h2>
          <p className="text-muted-foreground text-sm">
            Send money home securely with competitive exchange rates. This feature is under development.
          </p>
        </Card>
      </div>
    </WorkerPortalLayout>
  );
}
