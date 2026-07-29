import { useAuth } from "@/contexts/AuthContext";
import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { useWorkerJobAccess } from "@/modules/worker-registration/hooks/useWorkerJobAccess";

/**
 * Sample 01 home: jobs-first. Journey lives in the sidebar accordion.
 */
export default function WorkerDashboard() {
  const { profile } = useAuth();
  const { canApplyToJobs, onboardingPath } = useWorkerJobAccess();
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
            Browse jobs anytime. Open <span className="text-foreground font-medium">My Journey</span> in
            the sidebar to track your steps.
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

      {!canApplyToJobs && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-foreground">
              You can view jobs now. Complete your profile to apply or show interest.
            </p>
            <Button asChild variant="default" size="sm" className="rounded-lg shrink-0">
              <Link to={onboardingPath}>Complete profile</Link>
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
            Search verified overseas openings. Use My Journey in the menu when you want to continue
            documents, screening, or interview steps.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/jobs">Go to Job Search</Link>
          </Button>
        </CardContent>
      </Card>
    </WorkerPortalLayout>
  );
}
