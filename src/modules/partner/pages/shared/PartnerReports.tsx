import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";

export default function PartnerReports() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Card className="p-6 text-sm text-muted-foreground">
          Daily, weekly, monthly and custom-range reports will appear here.
          Export options: PDF and Excel.
        </Card>
      </div>
    </PartnerLayout>
  );
}
