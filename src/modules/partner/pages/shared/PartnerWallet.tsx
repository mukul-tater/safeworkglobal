import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

export default function PartnerWallet() {
  const { partner } = useCurrentPartner();
  if (!partner) return null;
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Available Balance</div>
            <div className="text-3xl font-bold">₹{Number(partner.wallet_available).toLocaleString("en-IN")}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-3xl font-bold">₹{Number(partner.wallet_pending).toLocaleString("en-IN")}</div>
          </Card>
        </div>
        <Card className="p-6 text-sm text-muted-foreground">
          Transaction history will appear here as assignments are completed.
        </Card>
      </div>
    </PartnerLayout>
  );
}
