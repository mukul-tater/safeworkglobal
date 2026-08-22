import { useAuth } from "@/contexts/AuthContext";
import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { useWorkerJobAccess } from "@/modules/worker-registration/hooks/useWorkerJobAccess";
import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";
import WorkerGccJourneyProgress from "@/components/worker/WorkerGccJourneyProgress";
import { GCC_JOURNEY_NAV_STEPS } from "@/modules/worker-verification/constants";

/**
 * Worker home: one clear next step, the four-phase progress tracker, then jobs.
 */
export default function WorkerDashboard() {
  const { profile } = useAuth();
  const { canApplyToJobs, onboardingPath } = useWorkerJobAccess();
  const { statuses, loading: progressLoading, journeyIncomplete } = useWorkerGccJourneyProgress();
  const firstName = profile?.full_name?.split(" ")[0];
  const currentStep = GCC_JOURNEY_NAV_STEPS.find((s) => statuses[s.id] === "current");

  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Hi{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your profile so employers can select you on priority.
          </p>
        </div>
        <Button asChild variant={canApplyToJobs ? "default" : "outline"} className="h-11 shrink-0 rounded-xl">
          <Link to="/jobs">
            <Briefcase className="mr-1.5 h-4 w-4" />
            Browse jobs
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {journeyIncomplete && (
        <Card className="mb-6 overflow-hidden border-l-4 border-l-primary">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Your next step
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold leading-tight">
                {currentStep?.label ?? "Continue your GCC journey"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {canApplyToJobs
                  ? "Pick up where you left off."
                  : "Find a job, apply, then finish Test 1 and the rest of your GCC journey."}
              </p>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl">
              <Link to={onboardingPath}>
                Continue
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {progressLoading ? (
        <div className="mb-6 h-48 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
      ) : (
        <WorkerGccJourneyProgress statuses={statuses} className="mb-6" />
      )}

      {canApplyToJobs ? (
        <Card className="border-border/60">
          <CardContent className="p-6 text-center sm:p-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10">
              <Briefcase className="h-6 w-6 text-success" />
            </div>
            <h2 className="mb-1 font-heading text-lg font-semibold">Apply to a job</h2>
            <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
              Apply now so Test 1 matches that job. You can also save favourites and come back.
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/jobs">Go to job search</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Finish Essentials to apply. Applying unlocks Test 1 for that job.
            </p>
          </CardContent>
        </Card>
      )}
    </WorkerPortalLayout>
  );
}
