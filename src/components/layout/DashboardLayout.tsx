import { useLocation } from "react-router-dom";
import DashboardSidebar, { NavItem, NavGroup, itemIsActive } from "./DashboardSidebar";
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

function shortPortalLabel(portalLabel: string): string {
  return portalLabel.replace(/\s+(Portal|Panel)$/i, "").trim() || portalLabel;
}

function resolvePageTitle(
  portalName: string,
  pathname: string,
  search: string,
  navItems?: NavItem[],
  navGroups?: NavGroup[],
): string {
  const items = [...(navItems ?? []), ...(navGroups ?? []).flatMap((group) => group.items)];
  let best: NavItem | undefined;
  for (const item of items) {
    if (!itemIsActive(item, pathname, search)) continue;
    if (!best || item.path.length > best.path.length) best = item;
  }
  if (best?.label) return best.label;
  if (/^safework\s*global$/i.test(portalName.trim())) return "Dashboard";
  return portalName.replace(/\s+(Portal|Panel)$/i, "").trim() || portalName;
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
  const location = useLocation();
  const pageTitle = resolvePageTitle(portalName, location.pathname, location.search, navItems, navGroups);

  return (
    <div className="flex min-h-screen bg-background w-full">
      <DashboardSidebar navItems={navItems} navGroups={navGroups} portalLabel={portalLabel} portalHomePath={portalHomePath} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          portalLabel={shortPortalLabel(portalLabel)}
          pageTitle={pageTitle}
          profileMenuItems={profileMenuItems}
          showLanguageSwitcher={showLanguageSwitcher}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
