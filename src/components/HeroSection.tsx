import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-indian-workers.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();
  const isEmployer = role === "employer";
  const authResolving = loading || (isAuthenticated && profileLoading);

  const handleFindJobs = () => {
    if (!isAuthenticated) {
      navigate("/worker/quick-signup");
      return;
    }
    if (role === "employer") {
      toast.error("This is an employer account. Switch to a worker account to browse jobs.");
      return;
    }
    navigate("/jobs");
  };

  const handleHireWorkers = () => {
    if (!isAuthenticated) {
      navigate("/employer/quick-signup");
      return;
    }
    if (role === "worker") {
      toast.error("This is a worker account. Switch to an employer account to hire workers.");
      return;
    }
    navigate("/employer/dashboard");
  };

  const handleEmployerCta = () => {
    if (isEmployer) {
      handleHireWorkers();
      return;
    }
    navigate("/employer/quick-signup");
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
          <p className="font-heading text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-white/80 mb-5">
            SafeWork Global
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-heading text-white mb-5 leading-[1.08] tracking-tight">
            {isEmployer ? (
              <>
                Hire verified workers.
                <span className="block mt-1 text-white/90">Ready to deploy.</span>
              </>
            ) : (
              <>
                Verified jobs abroad.
                <span className="block mt-1 text-white/90">Clear contracts.</span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
            {isEmployer
              ? "Skill-tested, document-verified Indian workers — deployed through licensed recruitment partners."
              : "We verify your documents and skills, then connect you to overseas employers through licensed recruitment partners."}
          </p>

          {!authResolving && (
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {isEmployer ? (
                <Button
                  size="lg"
                  className="h-12 px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
                  onClick={handleHireWorkers}
                >
                  Browse Workers <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 px-7 gap-2 text-base font-semibold rounded-xl shadow-primary"
                    onClick={handleFindJobs}
                  >
                    Browse Jobs <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 rounded-xl border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                    onClick={handleEmployerCta}
                  >
                    I&apos;m an employer
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Quiet trust line — plain text, no floating chips on the photo */}
          <p className="text-sm text-white/65 font-medium tracking-wide">
            {isEmployer
              ? "Verified workers · Skill & trade tested · Licensed partner deployment"
              : "Verified employers · Skill-tested profile · Licensed partner deployment"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
