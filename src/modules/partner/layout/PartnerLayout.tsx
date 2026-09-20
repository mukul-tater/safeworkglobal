import { ReactNode, useState, type ComponentType } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LogOut, Wallet as WalletIcon, UserPlus, Menu } from "lucide-react";
import { useCurrentPartner } from "../hooks/useCurrentPartner";
import { partnerTypeConfig } from "../config/partnerTypes";
import { useAuth } from "@/contexts/AuthContext";
import AboutLanguageToggle from "@/components/AboutLanguageToggle";
import { PARTNER_ADD_WORKER_PATH, partnerCanAddWorkers } from "../lib/partnerAssistedWorker";

function PartnerNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: { to: string; label: string; icon: ComponentType<{ className?: string }> }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
      {navItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
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
  );
}

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { partner, loading } = useCurrentPartner();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const brand = (
    <div className="shrink-0 border-b p-4">
      <div className="text-sm text-muted-foreground">Partner Portal</div>
      <div className="font-semibold truncate">{partner.company_name ?? "—"}</div>
      <div className="text-xs mt-1">
        <Badge variant="outline">{partner.partner_type_name}</Badge>
      </div>
    </div>
  );

  const footer = (
    <div className="shrink-0 space-y-3 border-t p-3">
      <AboutLanguageToggle labeled />
      <Button variant="ghost" className="w-full justify-start" onClick={() => logout()}>
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </div>
  );

  return (
    <div className="flex h-svh max-h-svh w-full overflow-hidden bg-muted/30">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0 md:hidden">
          {brand}
          <PartnerNav navItems={navItems} pathname={location.pathname} onNavigate={() => setMenuOpen(false)} />
          {footer}
        </SheetContent>
      </Sheet>

      <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r bg-card md:flex">
        {brand}
        <PartnerNav navItems={navItems} pathname={location.pathname} />
        {footer}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-card px-4 py-3 md:gap-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
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
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm truncate">
              {[partner.city, partner.district, partner.state].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {partnerCanAddWorkers(partner.status) && (
              <Button asChild size="sm" className="sm:h-10">
                <Link to={PARTNER_ADD_WORKER_PATH}>
                  <UserPlus className="mr-1 h-4 w-4" /> Add Worker
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 border">
              <WalletIcon className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Wallet</div>
                <div className="font-semibold text-sm">
                  ₹{Number(partner.wallet_available).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </header>

        {partner.status !== "approved" && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 md:px-6">
            Your partner account is <b>{partner.status}</b>. You can still add workers while awaiting
            admin approval.
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
