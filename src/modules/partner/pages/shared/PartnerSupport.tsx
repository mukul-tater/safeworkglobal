import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";

export default function PartnerSupport() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Support</h1>
        <Card className="p-6 text-sm text-muted-foreground">
          Reach us at <a className="text-primary underline" href="mailto:support@safeworkglobal.com">support@safeworkglobal.com</a>. Ticketing and live chat coming soon.
        </Card>
      </div>
    </PartnerLayout>
  );
}
