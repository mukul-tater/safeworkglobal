import { useState } from "react";
import { Home, User, LogOut, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { hideMobileBottomNav, isPublicAuthPath } from "@/lib/getStarted";
import GetStartedChoices from "@/components/GetStartedChoices";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  if (hideMobileBottomNav(location.pathname)) return null;

  const handleLogout = async () => {
    await logout();
  };

  const getStartedActive = getStartedOpen || isPublicAuthPath(location.pathname);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-hidden bg-card/95 backdrop-blur-md border-t border-border shadow-lg safe-area-bottom">
        <div className="flex min-w-0 items-center justify-around h-16 px-1">
          <Link
            to="/"
            className={cn(
              "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden transition-all duration-200",
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground active:scale-95",
            )}
          >
            <div className={cn("p-1.5 rounded-xl transition-colors", location.pathname === "/" && "bg-primary/10")}>
              <Home className={cn("h-5 w-5", location.pathname === "/" && "stroke-[2.5]")} />
            </div>
            <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">{t("nav.home")}</span>
          </Link>

          <Link
            to="/jobs"
            className={cn(
              "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden transition-all duration-200",
              location.pathname === "/jobs"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground active:scale-95",
            )}
          >
            <div className={cn("p-1.5 rounded-xl transition-colors", location.pathname === "/jobs" && "bg-primary/10")}>
              <Search className={cn("h-5 w-5", location.pathname === "/jobs" && "stroke-[2.5]")} />
            </div>
            <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">{t("nav.jobs")}</span>
          </Link>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden transition-all duration-200",
                location.pathname === "/dashboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95",
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-colors", location.pathname === "/dashboard" && "bg-primary/10")}>
                <User className={cn("h-5 w-5", location.pathname === "/dashboard" && "stroke-[2.5]")} />
              </div>
              <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">{t("nav.account")}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setGetStartedOpen(true)}
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden transition-all duration-200",
                getStartedActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95",
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-colors", getStartedActive && "bg-primary/10")}>
                <User className={cn("h-5 w-5", getStartedActive && "stroke-[2.5]")} />
              </div>
            <span className="max-w-full px-0.5 text-center text-[10px] font-medium leading-tight whitespace-normal">
              {t("header.getStarted")}
            </span>
            </button>
          )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden text-muted-foreground transition-all duration-200 hover:text-destructive active:scale-95"
            >
              <div className="p-1.5 rounded-xl">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">{t("nav.logout")}</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={getStartedOpen} onOpenChange={setGetStartedOpen}>
        <SheetContent side="bottom" className="z-[60] rounded-t-2xl pb-8">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>{t("header.getStarted")}</SheetTitle>
          </SheetHeader>
          <GetStartedChoices onChosen={() => setGetStartedOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
