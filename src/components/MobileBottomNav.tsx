import { Home, Briefcase, User, LogOut, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // Hide on dashboard pages (they have their own nav)
  const isDashboard = ["/worker/", "/employer/", "/admin/", "/partner/"].some(p => location.pathname.startsWith(p));
  if (isDashboard) return null;

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/jobs", icon: Search, label: "Jobs" },
    { path: isAuthenticated ? "/dashboard" : "/auth", icon: User, label: isAuthenticated ? "Account" : "Login" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground hover:text-destructive active:scale-95 transition-all duration-200"
          >
            <div className="p-1.5 rounded-xl">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
