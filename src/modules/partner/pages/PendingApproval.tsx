import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentPartner } from "../hooks/useCurrentPartner";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const { partner, loading } = useCurrentPartner();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">No partner registration found</h2>
          <Button onClick={() => navigate("/partner/register")}>Register as partner</Button>
        </Card>
      </div>
    );
  }

  if (partner.status === "approved") {
    navigate("/partner/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="p-10 max-w-lg text-center">
        <div className="flex justify-center mb-4">
          {partner.status === "rejected" ? (
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {partner.status === "rejected"
            ? "Application not approved"
            : partner.status === "suspended"
              ? "Account suspended"
              : "Awaiting admin approval"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {partner.status === "rejected"
            ? "Please contact SafeWork Global support for next steps."
            : "Our team is reviewing your submission. You will be notified once approved."}
        </p>
        <div className="text-sm text-muted-foreground mb-4">
          <div><b>Organization:</b> {partner.company_name}</div>
          <div><b>Partner Type:</b> {partner.partner_type_name}</div>
          <div><b>Status:</b> {partner.status}</div>
        </div>
        <Button variant="outline" onClick={() => logout()}>Logout</Button>
      </Card>
    </div>
  );
}
