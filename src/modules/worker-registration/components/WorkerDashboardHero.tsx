import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Briefcase, User } from "lucide-react";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";
import type { TranslationKey } from "../i18n/translations";
import heroImage from "@/assets/hero-workers.jpg";

interface Props {
  readonly firstName: string;
  readonly primarySkillName?: string | null;
  readonly profileCompletion: number;
  readonly onboardingCompleted: boolean;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly stepsRemaining: number;
  readonly jobsLink: string;
  readonly canBrowseJobs: boolean;
}

const STEP_KEYS: TranslationKey[] = [
  "onboarding.step1",
  "onboarding.step2",
  "onboarding.step3",
  "onboarding.step4",
];

export default function WorkerDashboardHero({
  firstName,
  primarySkillName,
  profileCompletion,
  onboardingCompleted,
  currentStep,
  totalSteps,
  stepsRemaining,
  jobsLink,
  canBrowseJobs,
}: Props) {
  const { t } = useWorkerLanguage();
  const skillPrefix = primarySkillName ? `${primarySkillName} ` : "";
  const stepTitle = t(STEP_KEYS[currentStep - 1] ?? "onboarding.step1");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 mb-5">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/50" />
      </div>

      <div className="relative p-5 sm:p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
          {t("hero.brand")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-1">
          {t("hero.greeting", { name: firstName })}
        </h1>

        <p className="text-sm text-white/85 max-w-lg mb-4">
          {onboardingCompleted
            ? t("hero.jobReady")
            : stepsRemaining > 0
              ? t("hero.stepsRemaining", { count: stepsRemaining, skill: skillPrefix })
              : t("hero.almostThere")}
        </p>

        {!onboardingCompleted && (
          <div className="mb-4 max-w-md">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>
                {t("hero.stepProgress", {
                  current: currentStep,
                  total: totalSteps,
                  title: stepTitle,
                })}
              </span>
              <span>{Math.round(profileCompletion)}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2 bg-white/20" />
          </div>
        )}

        {canBrowseJobs ? (
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl gap-2 shadow-lg" asChild>
              <Link to={jobsLink}>
                <Briefcase className="h-5 w-5" />
                {t("hero.browseJobs")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!onboardingCompleted && (
              <Button size="lg" variant="secondary" className="rounded-xl gap-2 shadow-lg" asChild>
                <Link to="/onboarding">
                  <User className="h-5 w-5" />
                  {t("hero.completeProfile")}
                </Link>
              </Button>
            )}
            {onboardingCompleted && (
              <Button size="lg" variant="secondary" className="rounded-xl gap-2 shadow-lg" asChild>
                <Link to="/onboarding">
                  <User className="h-5 w-5" />
                  {t("hero.editProfile")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Button size="lg" className="rounded-xl gap-2 shadow-lg" asChild>
            <Link to="/onboarding">
              <User className="h-5 w-5" />
              {t("hero.completeProfile")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
