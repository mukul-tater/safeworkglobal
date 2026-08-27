import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-indian-workers.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();
  const { t } = useI18n();
  const isEmployer = role === "employer";
  const isAdmin = role === "admin";
  const authResolving = loading || (isAuthenticated && profileLoading);

  const handleFindJobs = () => {
    if (role === "admin") {
      navigate("/admin/jobs");
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

  return (
    <section className="relative -mt-16 lg:-mt-[72px] min-h-[min(88vh,44rem)] sm:min-h-[88vh] overflow-hidden flex items-center">
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
        <div className="min-w-0 max-w-2xl text-left">
          {/* Brand as hero-level signal */}
          <p className="font-heading text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-white/80 mb-3">
            SafeWork Global
          </p>
          <p className="text-sm sm:text-base font-medium tracking-wide text-white/75 mb-5">
            {t("hero.values")}
          </p>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold font-heading text-white mb-5 leading-[1.12] tracking-tight">
            {isEmployer ? (
              <>
                {t("hero.employerTitle1")}
                <span className="block mt-1 text-white/90">{t("hero.employerTitle2")}</span>
              </>
            ) : (
              <>
                {t("hero.workerTitle1")}
                <span className="block mt-1 text-white/90">{t("hero.workerTitle2")}</span>
                <span lang="hi" className="mt-2 block leading-tight tracking-tight text-white/90 text-[1.35rem] sm:text-[1.75rem] lg:text-[2.15rem]">
                  {t("hero.workerTitle3")}
                </span>
              </>
            )}
          </h1>

          <p className="mb-8 max-w-xl min-w-0 break-words text-base leading-relaxed text-white/80 sm:text-lg">
            {isEmployer ? t("hero.employerBody") : t("hero.workerBody")}
          </p>

          {!authResolving && (
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {isAdmin ? (
                <Button
                  size="lg"
                  className="h-12 px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
                  onClick={() => navigate("/admin/dashboard")}
                >
                  Admin dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              ) : isEmployer ? (
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
                    className="h-12 w-full sm:w-auto px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
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
