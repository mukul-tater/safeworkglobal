import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, PlusCircle, Briefcase, Users, MessageSquare, CreditCard, Calendar, FileSignature, FileCheck, User, Bookmark, Star, UserCheck, Menu, X, History, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EmployerSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const navItems = [
    { path: "/employer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/employer/profile", icon: User, label: "My Profile" },
    { path: "/employer/company", icon: Building2, label: "Company Profile & KYC" },
    { path: "/employer/post-job", icon: PlusCircle, label: "Post a Job" },
    { path: "/employer/manage-jobs", icon: Briefcase, label: "Manage Jobs" },
    { path: "/employer/search-workers", icon: Users, label: "Search Workers" },
    { path: "/employer/saved-searches", icon: Bookmark, label: "Saved Searches" },
    { path: "/employer/applications", icon: UserCheck, label: "Applications" },
    { path: "/employer/shortlist", icon: Star, label: "Shortlist" },
    { path: "/employer/formalities", icon: FileCheck, label: "Post-Approval Formalities" },
    { path: "/employer/contracts", icon: FileSignature, label: "Contract Management" },
    { path: "/employer/contract-history", icon: History, label: "Contract History" },
    { path: "/employer/interviews", icon: Calendar, label: "Interview Scheduling" },
    { path: "/employer/offers", icon: FileSignature, label: "Offer Management" },
    { path: "/employer/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/employer/messaging", icon: MessageSquare, label: "Messages" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2.5 mb-6 hover:opacity-80 transition-opacity shrink-0">
        <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-7 w-7" />
        <span className="text-lg font-bold text-foreground font-heading">SafeWorkGlobal</span>
      </Link>
      <div className="px-1 mb-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Employer Portal</span>
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
            className="fixed top-3 left-3 z-50 p-2.5 bg-card border border-border rounded-xl shadow-lg md:hidden hover:bg-muted transition-colors"
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
