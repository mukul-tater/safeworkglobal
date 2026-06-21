import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import WorkerDashboardHero from "../components/WorkerDashboardHero";
import WorkerTrustStrip from "../components/WorkerTrustStrip";
import WorkerQuickStats from "../components/WorkerQuickStats";
import WorkerQuickActions from "../components/WorkerQuickActions";
import WorkerOnboardingChecklist from "../components/WorkerOnboardingChecklist";
import WorkerFeaturedJobsStrip from "../components/WorkerFeaturedJobsStrip";
import WorkerWhatsAppButton from "../components/WorkerWhatsAppButton";
import { useWorkerAuth } from "../context/WorkerAuthContext";
import { workerApi } from "../services/workerApi";
import { usePhase1WorkerNav } from "../hooks/usePhase1WorkerNav";
import { ONBOARDING_STEPS } from "../types/onboarding.types";
import type { WorkerOnboardingData } from "../types/onboarding.types";

function countRemainingSteps(onboarding: WorkerOnboardingData): number {
  let remaining = 0;
  if (!onboarding.dateOfBirth || !onboarding.gender || !onboarding.address) remaining++;
  if (!onboarding.stateId || !onboarding.districtId) remaining++;
  if (!onboarding.primarySkillId || !onboarding.preferredGccCountry || !onboarding.experienceLevel) remaining++;
  if (onboarding.skillsWithMediaCount === 0) remaining++;
  return remaining;
}

export default function WorkerDashboardPage() {
  const { worker, token } = useWorkerAuth();
  const { navGroups, profileMenuItems, portalLabel, portalName } = usePhase1WorkerNav();
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<WorkerOnboardingData | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    workerApi
      .getOnboarding(token)
      .then(setOnboarding)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const layoutProps = {
    navGroups,
    portalLabel,
    portalName,
    profileMenuItems,
    portalHomePath: "/home",
    showLanguageSwitcher: true,
  };

  if (!worker || loading) {
    return (
      <DashboardLayout {...layoutProps}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const firstName = worker.fullName.split(" ")[0];
  const needsOnboarding = !worker.onboardingCompleted;
  const skillsCount = onboarding?.skillsWithMediaCount ?? worker.skillsWithMediaCount ?? 0;
  const canApply = onboarding?.canApplyToJobs || worker.onboardingCompleted;
  const gccTarget = onboarding?.preferredGccCountry ?? "—";
  const currentStep = onboarding?.currentStep ?? 1;
  const stepsRemaining = onboarding ? countRemainingSteps(onboarding) : 4;
  const primarySkillName = onboarding?.primarySkillName ?? worker.primarySkillName;

  const canBrowseJobs = onboarding?.canBrowseJobs || worker.onboardingCompleted;

  const jobsLink = onboarding?.preferredGccCountry
    ? `/jobs?location=${encodeURIComponent(onboarding.preferredGccCountry)}`
    : "/jobs";

  const showStats =
    worker.onboardingCompleted || skillsCount > 0 || gccTarget !== "—";

  return (
    <DashboardLayout {...layoutProps}>
      <WorkerTrustStrip />

      <WorkerDashboardHero
        firstName={firstName}
        primarySkillName={primarySkillName}
        profileCompletion={worker.profileCompletionPercentage}
        onboardingCompleted={worker.onboardingCompleted}
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        stepsRemaining={stepsRemaining}
        jobsLink={jobsLink}
        canBrowseJobs={canBrowseJobs}
      />

      <WorkerFeaturedJobsStrip
        preferredCountry={onboarding?.preferredGccCountry}
        canApply={canApply}
        canBrowseJobs={canBrowseJobs}
      />

      {needsOnboarding && onboarding && (
        <WorkerOnboardingChecklist onboarding={onboarding} />
      )}

      {showStats && (
        <WorkerQuickStats
          applications={0}
          skillsWithMediaCount={skillsCount}
          gccTarget={gccTarget}
          showApplications={false}
        />
      )}

      <WorkerQuickActions
        canBrowseJobs={canBrowseJobs}
        onboardingCompleted={worker.onboardingCompleted}
        preferredGccCountry={onboarding?.preferredGccCountry}
      />

      <WorkerWhatsAppButton />
    </DashboardLayout>
  );
}
