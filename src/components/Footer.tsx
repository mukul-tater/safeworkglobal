import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Facebook, Twitter, Linkedin, Instagram, ArrowRight, FileCheck, ShieldCheck } from "lucide-react";
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

      {/* Always-dark branded surface so light/dark theme tokens don't invert the footer */}
      <div className="relative bg-[hsl(230_25%_10%)] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(230_85%_55%/0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,hsl(192_95%_48%/0.08),transparent_45%)]" />

        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-3 space-y-5">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                  <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-5 w-5" />
                </div>
                <span className="text-lg sm:text-xl font-bold font-heading text-white">SafeWorkGlobal</span>
              </Link>
              <p className="text-white/60 leading-relaxed max-w-sm text-sm">
                SafeWork Global is a technology and workforce mobility platform. Connecting skilled workers with verified overseas opportunities.
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
                    className="h-9 w-9 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
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
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">For Workers</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/jobs" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Find Jobs</Link>
                </li>
                <li>
                  <button onClick={handleCreateProfile} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    Create Profile
                  </button>
                </li>
                <li><Link to="/visa-guide" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Visa Guide</Link></li>
                <li><Link to="/success-stories" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Success Stories</Link></li>
                <li><Link to="/support" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Support Center</Link></li>
              </ul>
            </div>
            )}

            {/* For Employers */}
            {role !== 'worker' && (
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">For Employers</h3>
              <ul className="space-y-2.5">
                <li>
                  <button onClick={goEmployer('/employer/search-workers')} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    Browse Workers
                  </button>
                </li>
                <li>
                  <button onClick={goEmployer('/employer/post-job')} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    Post a Job
                  </button>
                </li>
                <li><Link to="/about" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/benefits-for-employers" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Benefits for Employers</Link></li>
                <li><Link to="/contact" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">Talk to our team</Link></li>
              </ul>
            </div>
            )}

            {/* Resources */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">Resources</h3>
              <ul className="space-y-2.5">
                {[
                  { to: "/country-insights", label: "Country Insights" },
                  { to: "/salary-guide", label: "Salary Guide" },
                  { to: "/language-resources", label: "Language Resources" },
                  { to: "/cultural-guides", label: "Cultural Guides" },
                  { to: "/legal-advice", label: "Legal Advice" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">Stay Updated</h3>
              <p className="text-white/50 text-xs sm:text-sm">
                Get weekly updates on new opportunities and career insights.
              </p>
              <div className="p-1 rounded-xl bg-white/5 border border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-10 sm:h-11 bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  />
                  <Button className="h-10 sm:h-11 px-4 rounded-lg bg-gradient-to-r from-primary to-info hover:opacity-90 gap-1.5 shrink-0 text-sm text-white">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RA Licensing — footer-only disclosure */}
        <div className="relative z-10 bg-[#f3f4f6]">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <FileCheck className="h-3.5 w-3.5" />
                Licensed & Regulated
              </div>

              <p className="text-sm sm:text-base text-[#1f2937] leading-relaxed">
                SafeWork Global is a technology and workforce mobility platform.
              </p>
              <p className="text-sm text-[#6b7280] leading-relaxed mt-3">
                Overseas Recruitment Process Conducted Through:
              </p>
              <p className="text-sm sm:text-base font-semibold font-heading text-[#111827] mt-1">
                Vesta Immigration LLP
              </p>
              <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
                Registered Recruiting Agent (MEA)
              </p>

              <div className="mt-5 inline-flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-left">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">
                    RC No.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold font-heading tracking-tight text-[#111827]">
                    B-2069/UP/PART/1000+/5/10331/2023
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
                <a href="mailto:mukul@safeworkglobal.com" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  <span>mukul@safeworkglobal.com</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <Link to="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="text-white/40 hover:text-white transition-colors">Terms</Link>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span className="text-white/40">© {new Date().getFullYear()} SafeWorkGlobal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
