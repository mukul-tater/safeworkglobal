import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerProfileMenu } from "@/config/workerNav";
import WorkerJobsGate from "@/modules/worker-registration/components/WorkerJobsGate";
import { useWorkerNavGroups } from "@/modules/worker-registration/hooks/useWorkerNavGroups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, MapPin, Briefcase, Trash2, Loader2, ExternalLink } from "lucide-react";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import JobSalaryText from "@/components/JobSalaryText";

interface SavedJob {
  id: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    location: string;
    country: string;
    salary_min: number | null;
    salary_max: number | null;
    currency: string;
    job_type: string;
    status: string;
    slug: string | null;
    openings: number;
    employer_id: string;
  } | null;
}

export default function SavedJobs() {
  const { user } = useAuth();
  const { navGroups } = useWorkerNavGroups();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSavedJobs();
  }, [user]);

  const fetchSavedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, created_at, job:jobs(id, title, location, country, salary_min, salary_max, currency, job_type, status, slug, openings, employer_id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedJobs((data as any) || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load saved jobs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (savedJobId: string) => {
    setRemovingId(savedJobId);
    try {
      const { error } = await supabase.from("saved_jobs").delete().eq("id", savedJobId);
      if (error) throw error;
      setSavedJobs(prev => prev.filter(sj => sj.id !== savedJobId));
      toast({ title: "Removed", description: "Job removed from saved list" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout navGroups={navGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
      <WorkerJobsGate>
      <PortalBreadcrumb />
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-muted-foreground text-sm">Jobs you've bookmarked for later</p>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground text-sm">Loading saved jobs...</p>
        </Card>
      ) : savedJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No saved jobs yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Browse jobs and click the bookmark icon to save them here for later.
          </p>
          <Button onClick={() => navigate("/jobs")}>
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Jobs
          </Button>
        </Card>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {savedJobs.map((sj) => {
            const job = sj.job;
            if (!job) return null;

            return (
              <Card key={sj.id} className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={job.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                        {job.status === "ACTIVE" ? "Active" : job.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {job.job_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <h3
                      className="font-semibold text-base cursor-pointer hover:text-primary transition-colors truncate"
                      onClick={() => navigate(`/jobs/${job.slug || job.id}`)}
                    >
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}, {job.country}
                      </span>
                      <span className="font-medium text-foreground">
                      <JobSalaryText
                        min={job.salary_min}
                        max={job.salary_max}
                        currency={job.currency}
                      />
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/jobs/${job.slug || job.id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSavedJob(sj.id)}
                      disabled={removingId === sj.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {removingId === sj.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </WorkerJobsGate>
    </DashboardLayout>
  );
}
