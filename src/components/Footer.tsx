import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Globe, Facebook, Twitter, Linkedin, Instagram, ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  // Worker "Create Profile" — gated by auth + role
  const handleCreateProfile = () => {
    if (!isAuthenticated) return navigate('/worker/quick-signup');
    if (role === 'worker') return navigate('/worker/dashboard');
    if (role === 'employer') {
      toast.error("You're logged in as an Employer. Sign out to create a Worker profile.");
      return;
    }
    navigate('/worker/quick-signup');
  };

  // Employer destinations — gated by auth + role
  const goEmployer = (workerPath: string) => () => {
    if (!isAuthenticated) return navigate('/employer/quick-signup');
    if (role === 'employer') return navigate(workerPath);
    if (role === 'worker') {
      toast.error("You're logged in as a Worker. Sign out to access employer features.");
      return;
    }
    navigate('/employer/quick-signup');
  };

  return (
    <footer className="relative overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="bg-foreground text-background relative">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-3 space-y-5">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                  <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-5 w-5" />
                </div>
                <span className="text-lg sm:text-xl font-bold font-heading">SafeWorkGlobal</span>
              </Link>
              <p className="text-background/60 leading-relaxed max-w-sm text-sm">
                Connecting skilled workers with verified global opportunities. Your trusted gateway to international careers since 2024.
              </p>

              <div className="flex gap-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Instagram, label: "Instagram" },
                ].map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-background/50 hover:text-background hover:bg-background/10 rounded-lg transition-all"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* For Workers */}
            {role !== 'employer' && (
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-background/80">For Workers</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/jobs" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Find Jobs</Link>
                </li>
                <li>
                  <button onClick={handleCreateProfile} className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">
                    Create Profile
                  </button>
                </li>
                <li><Link to="/visa-guide" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Visa Guide</Link></li>
                <li><Link to="/success-stories" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Success Stories</Link></li>
                <li><Link to="/support" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Support Center</Link></li>
              </ul>
            </div>
            )}

            {/* For Employers */}
            {role !== 'worker' && (
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-background/80">For Employers</h3>
              <ul className="space-y-2.5">
                <li>
                  <button onClick={goEmployer('/employer/search-workers')} className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">
                    Browse Workers
                  </button>
                </li>
                <li>
                  <button onClick={goEmployer('/employer/post-job')} className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">
                    Post a Job
                  </button>
                </li>
                <li><Link to="/about" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">How It Works</Link></li>
                <li><Link to="/benefits-for-employers" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Benefits for Employers</Link></li>
                <li><Link to="/contact" className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">Talk to our team</Link></li>
              </ul>
              <div className="rounded-lg border border-background/10 bg-background/5 p-3">
                <p className="text-[11px] sm:text-xs text-background/70 leading-relaxed">
                  <span className="font-semibold text-background">Pay only after you hire.</span>
                  Funds held securely in escrow and released once the worker joins.
                </p>
              </div>
            </div>
            )}

            {/* Resources */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-background/80">Resources</h3>
              <ul className="space-y-2.5">
                {[
                  { to: "/country-insights", label: "Country Insights" },
                  { to: "/salary-guide", label: "Salary Guide" },
                  { to: "/language-resources", label: "Language Resources" },
                  { to: "/cultural-guides", label: "Cultural Guides" },
                  { to: "/legal-advice", label: "Legal Advice" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-xs sm:text-sm text-background/50 hover:text-background transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-background/80">Stay Updated</h3>
              <p className="text-background/50 text-xs sm:text-sm">
                Get weekly updates on new opportunities and career insights.
              </p>
              <div className="p-1 rounded-xl bg-background/5 border border-background/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-10 sm:h-11 bg-transparent border-0 text-background placeholder:text-background/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  />
                  <Button className="h-10 sm:h-11 px-4 rounded-lg bg-gradient-to-r from-primary to-info hover:opacity-90 gap-1.5 shrink-0 text-sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-background/40">
                <Sparkles className="h-3 w-3" />
                <span>Join 1,000+ subscribers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
                <a href="mailto:mukultater@gmail.com" className="flex items-center gap-1.5 text-background/50 hover:text-background transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  <span>mukultater@gmail.com</span>
                </a>
                <a href="tel:+919950085843" className="flex items-center gap-1.5 text-background/50 hover:text-background transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  <span>+91-9950085843</span>
                </a>
                <span className="flex items-center gap-1.5 text-background/50">
                  <Globe className="h-3.5 w-3.5" />
                  <span>15+ languages</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <Link to="/admin/login" className="text-background/40 hover:text-background transition-colors">Admin Portal</Link>
                <Link to="/privacy" className="text-background/40 hover:text-background transition-colors">Privacy</Link>
                <Link to="/terms" className="text-background/40 hover:text-background transition-colors">Terms</Link>
                <span className="text-background/30 hidden sm:inline">|</span>
                <span className="text-background/40">© {new Date().getFullYear()} SafeWorkGlobal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
