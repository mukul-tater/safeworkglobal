import { useAuth } from "@/contexts/AuthContext";
import { useWorkerAuth } from "@/modules/worker-registration/context/WorkerAuthContext";
import { useOptionalWorkerLanguage } from "@/modules/worker-registration/context/WorkerLanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, HelpCircle, LucideIcon, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationDrawer from "@/components/NotificationDrawer";
import { displayableEmail, formatIndianMobile } from "@/lib/workerAuthEmail";
import { getGoogleEmailFromUser } from "@/modules/worker-verification/lib/connectGoogleEmail";

interface ProfileMenuItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface DashboardHeaderProps {
  portalLabel: string;
  pageTitle: string;
  profileMenuItems?: ProfileMenuItem[];
  showLanguageSwitcher?: boolean;
  onOpenMenu?: () => void;
}

export default function DashboardHeader({
  portalLabel,
  pageTitle,
  profileMenuItems = [],
  showLanguageSwitcher = false,
  onOpenMenu,
}: DashboardHeaderProps) {
  const { user, profile, logout } = useAuth();
  const { worker, clearWorkerSession, isAuthenticated: isWorkerSession } = useWorkerAuth();
  const workerLang = useOptionalWorkerLanguage();
  const navigate = useNavigate();

  const helpLabel = showLanguageSwitcher && workerLang ? workerLang.t("header.help") : "Help & Support";
  const signOutLabel = showLanguageSwitcher && workerLang ? workerLang.t("header.signOut") : "Sign Out";

  const displayName = worker?.fullName || profile?.full_name || "User";
  const displaySubtext =
    formatIndianMobile(worker?.mobileNumber) ||
    displayableEmail(profile?.email) ||
    getGoogleEmailFromUser(user) ||
    formatIndianMobile(profile?.phone) ||
    "";

  const handleLogout = async () => {
    try {
      toast.success("Logged out successfully");
      if (isWorkerSession) clearWorkerSession();
      await logout();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const fallbackChar = displayName[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 md:h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenMenu && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 md:hidden"
              onClick={onOpenMenu}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        <div className="min-w-0">
          <p className="text-[11px] leading-none text-muted-foreground font-medium truncate">{portalLabel}</p>
          <h1 className="text-base md:text-[17px] font-semibold text-foreground truncate leading-tight mt-0.5">
            {pageTitle}
          </h1>
        </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <NotificationDrawer />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full ring-offset-background hover:ring-2 hover:ring-primary/20 transition-all">
                <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-primary/10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {fallbackChar}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{displaySubtext}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileMenuItems.map((item) => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="cursor-pointer">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => navigate("/contact")} className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{helpLabel}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{signOutLabel}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
