import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  /** Optional status line under label (e.g. journey steps). */
  statusLabel?: string;
  statusTone?: "completed" | "in_progress" | "waiting";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  /** e.g. "2/6" on My Journey */
  badge?: string;
}

interface DashboardSidebarProps {
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  portalLabel: string;
  portalHomePath?: string;
}

function NavGroupSection({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const location = useLocation();
  const hasActive = group.items.some(
    (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
  );
  const [open, setOpen] = useState(group.defaultOpen ?? hasActive ?? true);
  const isJourney = Boolean(group.badge);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 transition-colors",
          isJourney
            ? "rounded-lg text-sm font-semibold text-foreground hover:bg-muted"
            : "text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <span className="truncate">{group.label}</span>
          {group.badge && (
            <span className="shrink-0 rounded-md bg-primary/10 text-primary text-[11px] font-bold px-1.5 py-0.5 tabular-nums">
              {group.badge}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <nav className={cn("space-y-0.5", isJourney ? "ml-1 mt-0.5 mb-2" : "ml-1")}>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", !isActive && "opacity-70")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.statusLabel && (
                    <span
                      className={cn(
                        "block text-[10px] mt-0.5",
                        isActive
                          ? "text-primary-foreground/80"
                          : item.statusTone === "completed"
                            ? "text-success"
                            : item.statusTone === "in_progress"
                              ? "text-primary"
                              : "text-muted-foreground",
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default function DashboardSidebar({ navItems, navGroups, portalLabel, portalHomePath = "/" }: DashboardSidebarProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleNavigate = () => setOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link to={portalHomePath} className="flex items-center gap-2.5 mb-5 hover:opacity-80 transition-opacity shrink-0">
        <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-7 w-7" />
        <span className="text-lg font-bold text-foreground font-heading">SafeWorkGlobal</span>
      </Link>
      <div className="px-3 mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold">{portalLabel}</span>
      </div>
      <ScrollArea className="flex-1 -mx-1 px-1">
        {navGroups ? (
          <div className="pb-4">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} onNavigate={handleNavigate} />
            ))}
          </div>
        ) : navItems ? (
          <nav className="space-y-0.5 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", !isActive && "opacity-70")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
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
