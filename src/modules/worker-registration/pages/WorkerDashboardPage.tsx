import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, FileText, Globe, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import SalaryProtectionPromise from "@/components/SalaryProtectionPromise";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import WorkerOnboardingStageBar from "../components/WorkerOnboardingStageBar";
import { useWorkerAuth } from "../context/WorkerAuthContext";
import { workerApi } from "../services/workerApi";
import { phase1WorkerNavGroups, phase1WorkerProfileMenu } from "@/config/phase1WorkerNav";
import type { OnboardingStage, WorkerOnboardingData } from "../types/onboarding.types";
import { STAGE_LABELS } from "../types/onboarding.types";

export default function WorkerDashboardPage() {
  const navigate = useNavigate();
  const { worker, token } = useWorkerAuth();
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

  if (!worker || loading) {
    return (
      <DashboardLayout
        navGroups={phase1WorkerNavGroups}
        portalLabel="Worker Portal"
        portalName="Worker Portal"
        profileMenuItems={phase1WorkerProfileMenu}
      >
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const firstName = worker.fullName.split(" ")[0];
  const needsOnboarding = !worker.onboardingCompleted;
  const stage = (onboarding?.onboardingStage ?? worker.onboardingStage ?? "REGISTERED") as OnboardingStage;
  const skillsCount = onboarding?.skillsWithMediaCount ?? worker.skillsWithMediaCount ?? 0;

  return (
    <DashboardLayout
      navGroups={phase1WorkerNavGroups}
      portalLabel="Worker Portal"
      portalName="Worker Portal"
      profileMenuItems={phase1WorkerProfileMenu}
    >
      <PortalBreadcrumb />

      {needsOnboarding && onboarding && (
        <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold">Complete your profile to apply for GCC jobs</p>
              <p className="text-sm text-muted-foreground mt-1">
                Current stage: {STAGE_LABELS[stage]}
                {skillsCount === 0 && " — upload skill photos/videos to become job-ready"}
              </p>
              <WorkerOnboardingStageBar
                currentStep={onboarding.currentStep}
                onboardingStage={stage}
                skillsWithMediaCount={skillsCount}
                onboardingCompleted={false}
              />
            </div>
            <Button onClick={() => navigate("/onboarding")}>Continue setup</Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground text-sm">
          {worker.onboardingCompleted
            ? "Your profile is job-ready. Browse GCC overseas jobs below."
            : "Finish your profile to unlock job applications."}
        </p>
        {worker.onboardingCompleted && (
          <Badge className="mt-2 bg-success">{STAGE_LABELS.JOB_READY}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { icon: Briefcase, value: 0, label: "Applications", to: "/home" },
          { icon: FileText, value: skillsCount, label: "Skills with proof", to: "/onboarding" },
          { icon: Globe, value: onboarding?.preferredGccCountry ?? "—", label: "GCC target", to: "/onboarding" },
          { icon: TrendingUp, value: `${worker.profileCompletionPercentage}%`, label: "Profile complete", to: "/onboarding" },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to} aria-label={`Go to ${stat.label}`}>
            <Card className="p-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer h-full">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold truncate max-w-[60%] text-right">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <SalaryProtectionPromise />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Browse GCC Jobs</h2>
          {onboarding?.canBrowseJobs || worker.onboardingCompleted ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Explore verified overseas jobs in the Gulf region.
              </p>
              <Button asChild>
                <Link to="/jobs">Browse jobs</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete steps 1 and 2 of your profile to browse jobs.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Need help?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Contact us via WhatsApp, phone, or visit your nearest E-Mitra center.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Get support</Link>
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
