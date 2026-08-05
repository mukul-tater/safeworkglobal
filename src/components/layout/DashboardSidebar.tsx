import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  /** Full name shown on hover when `label` is abbreviated. */
  title?: string;
  /** Unique id so shared paths don't all highlight as active. */
  id?: string;
  /** Optional status line under label (e.g. journey steps). */
  statusLabel?: string;
  statusTone?: "completed" | "in_progress" | "waiting";
  /** Locked stepper step — not clickable (future / not unlocked). */
  disabled?: boolean;
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

function itemIsActive(item: NavItem, pathname: string, search: string): boolean {
  const pathMatches =
    pathname === item.path || pathname.startsWith(`${item.path}/`);
  if (!pathMatches) return false;

  const journey = new URLSearchParams(search).get("journey");

  // Journey steps use ?journey=<id> so shared paths stay unique.
  if (item.id) {
    if (journey) return journey === item.id;
    // On /worker/journey with no query: highlight the current unlocked step only.
    return item.statusTone === "in_progress";
  }

  // Plain nav (Home, Jobs, …): inactive while a journey deep-link owns the URL.
  if (journey) return false;

  return true;
}

function NavLinkRow({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const to = item.id
    ? `${item.path}${item.path.includes("?") ? "&" : "?"}journey=${encodeURIComponent(item.id)}`
    : item.path;

  const content = (
    <>
      <Icon className={cn("h-4 w-4 shrink-0", !isActive && "opacity-70")} />
      <span className="min-w-0 flex-1 overflow-hidden">
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
    </>
  );

  if (item.disabled) {
    return (
      <div
        aria-disabled="true"
        title={item.title ? `${item.title} — complete the previous step first` : "Complete the previous step first"}
        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed select-none"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={item.title ?? item.label}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {content}
    </Link>
  );
}

function NavGroupSection({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const location = useLocation();
  const hasActive = group.items.some((item) =>
    itemIsActive(item, location.pathname, location.search),
  );
  const [open, setOpen] = useState(() => group.defaultOpen ?? hasActive);

  // Keep section open when an item inside becomes active (e.g. after navigation).
  // Do not auto-close — only the header toggle closes it.
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const isJourney = Boolean(group.badge);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          {group.items.map((item) => (
            <NavLinkRow
              key={item.id ?? `${item.path}:${item.label}`}
              item={item}
              isActive={itemIsActive(item, location.pathname, location.search)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

function SidebarBody({
  navItems,
  navGroups,
  portalLabel,
  portalHomePath,
  onNavigate,
}: {
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  portalLabel: string;
  portalHomePath: string;
  onNavigate: () => void;
}) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <Link
        to={portalHomePath}
        className="flex items-center gap-2.5 mb-5 hover:opacity-80 transition-opacity shrink-0"
      >
        <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-7 w-7" />
        <span className="text-lg font-bold text-foreground font-heading">SafeWorkGlobal</span>
      </Link>
      <div className="px-3 mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold">
          {portalLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {navGroups ? (
          <div className="pb-4">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} onNavigate={onNavigate} />
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
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", !isActive && "opacity-70")} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardSidebar({
  navItems,
  navGroups,
  portalLabel,
  portalHomePath = "/",
}: DashboardSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleNavigate = () => setSheetOpen(false);

  const body = (
    <SidebarBody
      navItems={navItems}
      navGroups={navGroups}
      portalLabel={portalLabel}
      portalHomePath={portalHomePath}
      onNavigate={handleNavigate}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed top-3 left-3 z-50 p-2.5 bg-card border border-border rounded-xl shadow-lg md:hidden hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4 pt-6">
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-card border-r h-screen sticky top-0 p-4 lg:p-5">
      {body}
    </aside>
  );
}
