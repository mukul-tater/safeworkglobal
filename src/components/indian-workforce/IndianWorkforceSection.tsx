import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import { tradeCategories } from "./data";
import HindiText from "./HindiText";
import WorkerPhotoCollage from "./WorkerPhotoCollage";
import TradeCategoryCard from "./TradeCategoryCard";
import ManyMoreTradeCard from "./ManyMoreTradeCard";

const HOME_TRADE_PREVIEW_COUNT = 7;

export default function IndianWorkforceSection() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const { t } = useI18n();
  const isEmployer = role === "employer";

  const handleFindJobs = () => {
    if (role === "employer") {
      toast.error(t("hero.employerToast"));
      return;
    }
    navigate("/jobs");
  };

  const handleRegisterWorker = () => {
    if (role === "employer") {
      toast.error(t("hero.employerToast"));
      return;
    }
    if (isAuthenticated && role === "worker") {
      navigate("/worker/dashboard");
      return;
    }
    navigate("/worker/quick-signup");
  };

  const employerHref = isEmployer ? "/employer/dashboard" : "/employer/quick-signup";

  return (
    <section
      className="overflow-x-hidden border-b border-border/60 bg-background py-14 sm:py-16 lg:py-20"
      aria-labelledby="indian-workforce-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Layer 1 — India-first introduction */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">
              Indian skilled workforce
            </p>
            <HindiText className="mb-1 text-[0.7rem] font-medium tracking-wide text-primary/80 sm:text-xs">
              भारतीय कुशल कार्यबल
            </HindiText>

            <h2
              id="indian-workforce-heading"
              lang="hi"
              className="mt-3 font-heading text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-[1.75rem] lg:text-3xl"
              style={{
                fontFamily:
                  "Kohinoor Devanagari, Devanagari Sangam MN, Nirmala UI, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              भारत का हुनर, दुनिया के अवसर।
            </h2>

            <p className="mt-3 text-base font-medium text-foreground sm:text-lg">
              India's skills, verified for global opportunities.
            </p>
            <HindiText className="mt-1 text-sm text-muted-foreground">
              भारत के कौशल को वैश्विक अवसरों के लिए सत्यापित किया जाता है।
            </HindiText>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              We build structured worker profiles through identity verification, technical screening
              and skill/trade assessment — helping global employers discover skilled talent from
              India.
            </p>
          </motion.div>

          <WorkerPhotoCollage />
        </div>

        {/* Layer 2 — Trade categories */}
        <div className="mt-14 sm:mt-16 lg:mt-20">
          <div className="mb-6 max-w-xl sm:mb-8">
            <h3 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Indian trade categories
            </h3>
            <HindiText className="mt-0.5 text-sm text-muted-foreground">
              भारतीय ट्रेड श्रेणियाँ
            </HindiText>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {tradeCategories.slice(0, HOME_TRADE_PREVIEW_COUNT).map((trade, index) => (
              <TradeCategoryCard key={trade.id} trade={trade} index={index} />
            ))}
            <ManyMoreTradeCard index={HOME_TRADE_PREVIEW_COUNT} />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-5 sm:mt-12">
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl px-7 text-base font-semibold sm:w-auto"
                onClick={handleFindJobs}
              >
                Find Jobs
                <ArrowRight className="h-4 w-4" />
              </Button>
              <HindiText className="px-1 text-xs text-muted-foreground">नौकरी खोजें</HindiText>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl px-7 text-base font-semibold sm:w-auto"
                onClick={handleRegisterWorker}
                aria-label="Register as worker"
              >
                Register as Worker
              </Button>
              <p className="px-1 text-xs text-muted-foreground">Worker Registration</p>
            </div>
          </div>

          <Link
            to={employerHref}
            className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Looking for skilled workers? Hire from India
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
