import DashboardSidebar, { NavItem, NavGroup } from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { LucideIcon } from "lucide-react";

interface ProfileMenuItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  portalLabel: string;
  portalName: string;
  profileMenuItems?: ProfileMenuItem[];
  /** Portal home route — defaults to main marketing site */
  portalHomePath?: string;
  /** Show English/Hindi language switcher (worker portal) */
  showLanguageSwitcher?: boolean;
}

export default function DashboardLayout({
  children,
  navItems,
  navGroups,
  portalLabel,
  portalName,
  profileMenuItems = [],
  portalHomePath = "/",
  showLanguageSwitcher = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <DashboardSidebar navItems={navItems} navGroups={navGroups} portalLabel={portalLabel} portalHomePath={portalHomePath} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          portalName={portalName}
          profileMenuItems={profileMenuItems}
          portalHomePath={portalHomePath}
          showLanguageSwitcher={showLanguageSwitcher}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
