import { Button } from "@/components/ui/button";
import { Mail, Facebook, Twitter, Linkedin, Instagram, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SAFEWORK_CONTACT } from "@/config/workerSupport";
import { useI18n } from "@/i18n";

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const { t } = useI18n();

  // Worker "Create Profile" — gated by auth + role
  const handleCreateProfile = () => {
    if (!isAuthenticated) return navigate('/worker/quick-signup');
    if (role === 'worker') return navigate('/worker/dashboard');
    if (role === 'employer') {
      toast.error(t("footer.employerToast"));
      return;
    }
    navigate('/worker/quick-signup');
  };

  // Employer destinations — gated by auth + role
  const goEmployer = (workerPath: string) => () => {
    if (!isAuthenticated) return navigate('/employer/quick-signup');
    if (role === 'employer') return navigate(workerPath);
    if (role === 'worker') {
      toast.error(t("footer.workerToast"));
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
                {t("footer.blurb")}
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
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">{t("footer.workers")}</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/jobs" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.findJobs")}</Link>
                </li>
                <li>
                  <button onClick={handleCreateProfile} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    {t("footer.createProfile")}
                  </button>
                </li>
                <li><Link to="/success-stories" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.stories")}</Link></li>
                <li><Link to="/support" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.support")}</Link></li>
              </ul>
            </div>
            )}

            {/* For Employers */}
            {role !== 'worker' && (
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">{t("footer.employers")}</h3>
              <ul className="space-y-2.5">
                <li>
                  <button onClick={goEmployer('/employer/search-workers')} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    {t("footer.browseWorkers")}
                  </button>
                </li>
                <li>
                  <button onClick={goEmployer('/employer/post-job')} className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">
                    {t("footer.postJob")}
                  </button>
                </li>
                <li><Link to="/about" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.how")}</Link></li>
                <li><Link to="/benefits-for-employers" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.benefits")}</Link></li>
                <li><Link to="/contact" className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors">{t("footer.talk")}</Link></li>
              </ul>
            </div>
            )}

            {/* Resources */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">{t("footer.resources")}</h3>
              <ul className="space-y-2.5">
                {[
                  { to: "/faq", label: t("footer.faq") },
                  { to: "/country-insights", label: t("footer.insights") },
                  { to: "/cultural-guides", label: t("footer.culture") },
                  { to: "/legal-advice", label: t("footer.legal") },
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
              <h3 className="text-xs sm:text-sm font-semibold font-heading uppercase tracking-wider text-white/80">{t("footer.stay")}</h3>
              <p className="text-white/50 text-xs sm:text-sm">
                {t("footer.staySub")}
              </p>
              <div className="p-1 rounded-xl bg-white/5 border border-white/10">
                <div className="h-10 sm:h-11 flex items-center justify-center px-4">
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider text-white/50">
                    {t("footer.comingSoon")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RA Licensing — footer-only disclosure */}
        <div className="relative z-10 bg-[#f3f4f6]">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-center text-xs sm:text-[13px] leading-relaxed text-[#4b5563]">
              {t("footer.ra")}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
                <a href={`mailto:${SAFEWORK_CONTACT.email}`} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="break-all">{SAFEWORK_CONTACT.email}</span>
                </a>
                <span className="flex items-start gap-1.5 text-white/50 max-w-xs">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{SAFEWORK_CONTACT.officeAddress}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <Link to="/privacy" className="text-white/40 hover:text-white transition-colors">{t("footer.privacy")}</Link>
                <Link to="/terms" className="text-white/40 hover:text-white transition-colors">{t("footer.terms")}</Link>
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
