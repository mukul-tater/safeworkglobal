import { useLayoutEffect, useRef, useState } from "react";
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
  showLanguageSwitcher = false,
}: DashboardLayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const pageTitle = resolvePageTitle(portalName, location.pathname, location.search, navItems, navGroups);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="flex h-svh max-h-svh w-full overflow-hidden bg-background">
      <DashboardSidebar
        navItems={navItems}
        navGroups={navGroups}
        portalLabel={portalLabel}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader
          portalLabel={shortPortalLabel(portalLabel)}
          pageTitle={pageTitle}
          profileMenuItems={profileMenuItems}
          showLanguageSwitcher={showLanguageSwitcher}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 animate-in fade-in duration-300 md:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
