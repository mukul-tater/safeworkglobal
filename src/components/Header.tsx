import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Globe, User, Bell, X, LogOut, ChevronRight, CircleHelp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import BrandLockup from "@/components/BrandLockup";
import AboutLanguageToggle from "@/components/AboutLanguageToggle";
import GetStartedChoices from "@/components/GetStartedChoices";
import { useI18n } from "@/i18n";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, profile, role, logout } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
  };

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (path: string) => location.pathname === path;

  const navLinks = [
    ...(role === 'employer'
      ? [{ to: "/employer/search-workers", label: t("nav.findWorkers"), icon: Search }]
      : [{ to: "/jobs", label: t("nav.findJobs"), icon: Search }]),
    { to: "/about", label: t("nav.about"), icon: Globe },
    { to: "/faq", label: t("footer.faq"), icon: CircleHelp },
    { to: "/contact", label: t("nav.contact"), icon: Bell },
  ];
  const overlaysHomeHero = location.pathname === "/" && !isScrolled && !isMobileMenuOpen;

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          overlaysHomeHero
            ? "bg-transparent border-b border-white/10"
            : "bg-card/95 backdrop-blur-md shadow-sm border-b border-border"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link
              to="/"
              aria-label="SafeWork Global home"
              className="flex items-center hover:opacity-90 transition-opacity group shrink-0"
            >
              <BrandLockup variant={overlaysHomeHero ? "onDark" : "default"} />
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.to)
                      ? overlaysHomeHero
                        ? "text-white bg-white/15"
                        : "text-primary bg-primary/5"
                      : overlaysHomeHero
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className={`flex items-center gap-3 ${overlaysHomeHero ? "[&_button]:text-white [&_button:hover]:bg-white/10" : ""}`}>
              <AboutLanguageToggle variant={overlaysHomeHero ? "onDark" : "default"} className="w-[9rem]" />
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button
                      variant="outline"
                      className={`flex items-center gap-2.5 pr-3 ${overlaysHomeHero ? "border-white/30 bg-white/10 hover:text-white" : ""}`}
                    >
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline font-medium">
                        {profile?.full_name || t("header.dashboard")}
                      </span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="default" className="gap-2">
                      <User className="h-4 w-4" />
                      {t("header.getStarted")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3">
                    <GetStartedChoices />
                  </PopoverContent>
                </Popover>
              )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 md:hidden">
              <div className={`flex items-center gap-1 ${overlaysHomeHero ? "[&_button]:text-white [&_button:hover]:bg-white/10" : ""}`}>
              <ThemeToggle />
            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          
          {/* Menu Content */}
          <div 
            id="mobile-menu"
            className="fixed top-16 left-0 right-0 bottom-0 bg-card z-50 md:hidden overflow-y-auto animate-fade-in pb-24"
          >
            <nav className="container mx-auto px-4 py-6 space-y-2">
              <div className="px-1 pb-4 mb-2 border-b border-border">
                <AboutLanguageToggle labeled />
              </div>
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`flex items-center justify-between px-4 py-4 rounded-xl transition-all ${
                    isActiveLink(link.to)
                      ? 'bg-primary/5 text-primary'
                      : 'text-foreground hover:bg-accent'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActiveLink(link.to) ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <link.icon className={`h-5 w-5 ${
                        isActiveLink(link.to) ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-6 mt-6 border-t border-border">
                  <GetStartedChoices onChosen={closeMobileMenu} />
                </div>
              )}
              
              {isAuthenticated && (
                <div className="pt-6 mt-6 border-t border-border space-y-3">
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl bg-primary/5 text-primary"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {profile?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile?.full_name || t("header.myAccount")}</p>
                      <p className="text-sm text-muted-foreground">{t("header.goDashboard")}</p>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("header.signOut")}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;