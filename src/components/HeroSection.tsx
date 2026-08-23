import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-indian-workers.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

function FitSingleLine({
  children,
  className,
  lang,
}: {
  children: string;
  className?: string;
  lang?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const fit = () => {
      const available = parent.clientWidth;
      if (available <= 0) return;
      const maxPx = parseFloat(getComputedStyle(parent).fontSize);
      el.style.fontSize = `${maxPx}px`;
      const width = el.scrollWidth;
      el.style.fontSize = `${width > available ? Math.max(12, (maxPx * available) / width) : maxPx}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [children]);

  return (
    <span ref={ref} lang={lang} className={className}>
      {children}
    </span>
  );
}

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();
  const { t } = useI18n();
  const isEmployer = role === "employer";
  const authResolving = loading || (isAuthenticated && profileLoading);

  const handleFindJobs = () => {
    if (!isAuthenticated) {
      navigate("/worker/login");
      return;
    }
    if (role === "employer") {
      toast.error(t("hero.employerToast"));
      return;
    }
    navigate("/jobs");
  };

  const handleHireWorkers = () => {
    if (!isAuthenticated) {
      navigate("/employer/login");
      return;
    }
    if (role === "worker") {
      toast.error(t("hero.workerToast"));
      return;
    }
    navigate("/employer/dashboard");
  };

  const handleEmployerCta = () => {
    if (isEmployer) {
      handleHireWorkers();
      return;
    }
    navigate("/employer/login");
  };

  return (
    <section className="relative -mt-16 lg:-mt-[72px] min-h-[88vh] overflow-hidden flex items-end sm:items-center">
      {/* Full-bleed photographic background — Design A */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Indian skilled workers departing for verified overseas employment"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        {/* Theme-aligned readability overlays (primary indigo, not a new palette) */}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/30" />
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28 w-full">
        <div className="max-w-2xl text-left">
          {/* Brand as hero-level signal */}
          <p className="font-heading text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-white/80 mb-3">
            SafeWork Global
          </p>
          <p className="text-sm sm:text-base font-medium tracking-wide text-white/75 mb-5">
            {t("hero.values")}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-heading text-white mb-5 leading-[1.08] tracking-tight">
            {isEmployer ? (
              <>
                {t("hero.employerTitle1")}
                <span className="block mt-1 text-white/90">{t("hero.employerTitle2")}</span>
              </>
            ) : (
              <>
                {t("hero.workerTitle1")}
                <span className="block mt-1 text-white/90">{t("hero.workerTitle2")}</span>
                <FitSingleLine
                  lang="hi"
                  className="mt-2 block w-full whitespace-nowrap leading-none tracking-tight text-white/90"
                >
                  {t("hero.workerTitle3")}
                </FitSingleLine>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
            {isEmployer ? t("hero.employerBody") : t("hero.workerBody")}
          </p>

          {!authResolving && (
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {isEmployer ? (
                <Button
                  size="lg"
                  className="h-12 px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
                  onClick={handleHireWorkers}
                >
                  {t("hero.browseWorkers")} <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
                    onClick={handleFindJobs}
                  >
                    {t("hero.browseJobs")} <ArrowRight className="h-5 w-5" />
                  </Button>
                  
                </>
              )}
            </div>
          )}

          {/* Quiet trust line — plain text, no floating chips on the photo */}
          <p className="text-sm text-white/65 font-medium tracking-wide">
            {isEmployer ? t("hero.employerTrust") : t("hero.workerTrust")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
