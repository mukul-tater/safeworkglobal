import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentPartner } from "../hooks/useCurrentPartner";
import { partnerTypeConfig } from "../config/partnerTypes";

/**
 * /partner/dashboard is the single entry point after login.
 * It routes the partner to the correct landing page for their partner type.
 */
export default function PartnerDashboardRouter() {
  const { partner, loading } = useCurrentPartner();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!partner) {
      navigate("/partner/register", { replace: true });
      return;
    }
    if (partner.status !== "approved") {
      navigate("/partner/pending", { replace: true });
      return;
    }
    const cfg = partnerTypeConfig[partner.partner_type_code];
    navigate(cfg?.landing ?? "/partner/pending", { replace: true });
  }, [partner, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
}
