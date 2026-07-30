import { useAuth } from "@/contexts/AuthContext";
import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { useWorkerJobAccess } from "@/modules/worker-registration/hooks/useWorkerJobAccess";
import { useWorkerGccJourneyProgress } from "@/modules/worker-registration/hooks/useWorkerGccJourneyProgress";
import WorkerGccJourneyProgress from "@/components/worker/WorkerGccJourneyProgress";

/**
 * Worker home: GCC verification progress (Test 1 / 2 / 3) + jobs.
 */
export default function WorkerDashboard() {
  const { profile } = useAuth();
  const { canApplyToJobs, onboardingPath } = useWorkerJobAccess();
  const { statuses, loading: progressLoading, journeyIncomplete } = useWorkerGccJourneyProgress();
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">
            Hi{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete Tests 1–3 and verification to become GCC ready. Browse jobs anytime.
          </p>
        </div>
        <Button asChild className="rounded-xl h-11 shrink-0">
          <Link to="/jobs">
            <Briefcase className="h-4 w-4 mr-1.5" />
            Find Jobs
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>

      {journeyIncomplete && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-foreground">
              Continue your GCC journey — essentials, Test 1–3, interview results, and more.
            </p>
            <Button asChild variant="default" size="sm" className="rounded-lg shrink-0">
              <Link to="/worker/journey">Continue journey</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {progressLoading ? (
        <div className="mb-6 h-40 rounded-2xl border border-border/60 bg-muted/30 animate-pulse" />
      ) : (
        <WorkerGccJourneyProgress statuses={statuses} className="mb-6" />
      )}

      {!canApplyToJobs && (
        <Card className="mb-6 border-border/60">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-foreground">
              You can view jobs now. Finish GCC verification to unlock applying.
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-lg shrink-0">
              <Link to={onboardingPath}>Continue verification</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold font-heading mb-1">Ready to explore jobs?</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Search verified overseas openings while you complete your GCC tests.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/jobs">Go to Job Search</Link>
          </Button>
        </CardContent>
      </Card>
    </WorkerPortalLayout>
  );
}
