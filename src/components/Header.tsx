import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Globe, User, Bell, X, LogOut, ChevronRight, HardHat, Briefcase, Handshake } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      ? [{ to: "/employer/search-workers", label: "Find Workers", icon: Search }]
      : [{ to: "/jobs", label: "Find Jobs", icon: Search }]),
    { to: "/about", label: "About Us", icon: Globe },
    { to: "/contact", label: "Contact", icon: Bell },
  ];

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-card/95 backdrop-blur-md shadow-sm border-b border-border' 
            : 'bg-card border-b border-border'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
            >
              <img 
                src="/safework-global-logo.png" 
                alt="SafeWorkGlobal" 
                className="h-9 w-9 transition-transform group-hover:scale-105" 
              />
              <span className="text-xl font-bold font-heading text-foreground tracking-tight">
                SafeWorkGlobal
              </span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.to)
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2.5 pr-3">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline font-medium">
                        {profile?.full_name || 'Dashboard'}
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
                      Get Started
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                      I want to…
                    </p>
                    <button
                      onClick={() => navigate('/worker/quick-signup')}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <HardHat className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Find a job</div>
                        <div className="text-xs text-muted-foreground">Sign up as a Worker</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/employer/quick-signup')}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors mt-1"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Hire workers</div>
                        <div className="text-xs text-muted-foreground">Sign up as an Employer</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/partner/register')}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors mt-1"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Handshake className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Partner</div>
                        <div className="text-xs text-muted-foreground">E-Mitra, SSVN, SRN or SEN Global</div>
                      </div>
                    </button>
                    <div className="border-t border-border my-2" />
                    <button
                      onClick={() => navigate('/worker/login')}
                      className="w-full text-xs text-center text-primary hover:underline py-1"
                    >
                      Already registered as a worker? Sign in
                    </button>
                    <button
                      onClick={() => navigate('/employer/login')}
                      className="w-full text-xs text-center text-muted-foreground hover:text-primary hover:underline py-1"
                    >
                      Employer account? Sign in
                    </button>
                    <button
                      onClick={() => navigate('/emitra/login')}
                      className="w-full text-xs text-center text-muted-foreground hover:text-primary hover:underline py-1"
                    >
                      Partner account? Sign in
                    </button>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 md:hidden">
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
            className="fixed top-16 left-0 right-0 bottom-0 bg-card z-50 md:hidden overflow-y-auto animate-fade-in"
          >
            <nav className="container mx-auto px-4 py-6 space-y-2">
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
              
              {/* Mobile Auth Section */}
              <div className="pt-6 mt-6 border-t border-border">
                {isAuthenticated ? (
                  <div className="space-y-3">
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
                        <p className="font-semibold">{profile?.full_name || 'My Account'}</p>
                        <p className="text-sm text-muted-foreground">Go to Dashboard</p>
                      </div>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground px-1">I want to…</p>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full justify-start gap-3"
                      onClick={() => { navigate('/worker/quick-signup'); closeMobileMenu(); }}
                    >
                      <HardHat className="h-4 w-4" />
                      Find a job (Worker signup)
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full justify-start gap-3"
                      onClick={() => { navigate('/employer/quick-signup'); closeMobileMenu(); }}
                    >
                      <Briefcase className="h-4 w-4" />
                      Hire workers (Employer signup)
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start gap-3"
                      onClick={() => { navigate('/partner/register'); closeMobileMenu(); }}
                    >
                      <Handshake className="h-4 w-4" />
                      Partner
                    </Button>
                    <button
                      onClick={() => { navigate('/worker/login'); closeMobileMenu(); }}
                      className="w-full text-xs text-center text-primary hover:underline py-1"
                    >
                      Already registered as a worker? Sign in
                    </button>
                    <button
                      onClick={() => { navigate('/emitra/login'); closeMobileMenu(); }}
                      className="w-full text-xs text-center text-muted-foreground hover:text-primary hover:underline py-1"
                    >
                      Partner account? Sign in
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;