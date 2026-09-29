import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CheckCircle, Shield, BarChart3, AlertTriangle, Menu, FileCheck, CreditCard, Plane, Mail, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/investor-dashboard", icon: TrendingUp, label: "Investor Dashboard" },
    { path: "/admin/users", icon: Users, label: "User Management" },
    { path: "/admin/job-verification", icon: CheckCircle, label: "Job Verification" },
    { path: "/admin/document-verification", icon: FileCheck, label: "Document Verification" },
    { path: "/admin/id-verification", icon: CreditCard, label: "ID Verification" },
    { path: "/admin/ecr-management", icon: Plane, label: "ECR Management" },
    { path: "/admin/compliance", icon: Shield, label: "Compliance Check" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/admin/disputes", icon: AlertTriangle, label: "Dispute Resolution" },
    { path: "/admin/contact-submissions", icon: Mail, label: "Contact Submissions" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2.5 mb-6 hover:opacity-80 transition-opacity shrink-0">
        <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-7 w-7" />
        <span className="text-lg font-bold text-foreground font-heading">SafeWorkGlobal</span>
      </Link>
      <div className="px-1 mb-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin Panel</span>
      </div>
      <ScrollArea className="flex-1 -mx-2 px-2">
        <nav className="space-y-1 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-70'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button 
            className="fixed top-[calc(0.75rem+var(--offline-banner-offset,0px))] left-3 z-50 p-2.5 bg-card border border-border rounded-xl shadow-lg md:hidden hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4 pt-6">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r min-h-screen p-4 lg:p-5 shrink-0">
      <SidebarContent />
    </aside>
  );
}
