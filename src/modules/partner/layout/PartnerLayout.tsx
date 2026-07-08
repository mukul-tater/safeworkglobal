import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet as WalletIcon } from "lucide-react";
import { useCurrentPartner } from "../hooks/useCurrentPartner";
import { partnerTypeConfig } from "../config/partnerTypes";
import { useAuth } from "@/contexts/AuthContext";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { partner, loading } = useCurrentPartner();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Complete your partner registration</h2>
          <p className="text-muted-foreground mb-4">
            You haven't set up your partner organization yet.
          </p>
          <Button onClick={() => navigate("/partner/register")}>Start registration</Button>
        </Card>
      </div>
    );
  }

  const cfg = partnerTypeConfig[partner.partner_type_code];
  const navItems = cfg?.navItems ?? [];

  const statusColor =
    partner.status === "approved"
      ? "bg-green-500/10 text-green-700 border-green-200"
      : partner.status === "pending"
        ? "bg-amber-500/10 text-amber-700 border-amber-200"
        : "bg-red-500/10 text-red-700 border-red-200";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="text-sm text-muted-foreground">Partner Portal</div>
          <div className="font-semibold truncate">{partner.company_name ?? "—"}</div>
          <div className="text-xs mt-1">
            <Badge variant="outline">{partner.partner_type_name}</Badge>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with quick stats */}
        <header className="bg-card border-b px-6 py-3 flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">Partner ID</div>
            <div className="font-mono text-sm">{partner.partner_code ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge className={statusColor} variant="outline">
              {partner.status}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Verification</div>
            <Badge variant="outline">{partner.verification_status}</Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm">
              {[partner.city, partner.district, partner.state].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 border">
            <WalletIcon className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Wallet</div>
              <div className="font-semibold text-sm">
                ₹{Number(partner.wallet_available).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </header>

        {partner.status !== "approved" && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
            Your partner account is <b>{partner.status}</b>. Some features are limited until an admin approves your organization.
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
