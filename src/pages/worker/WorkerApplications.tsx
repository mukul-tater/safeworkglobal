import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Calendar, MapPin, Briefcase, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ApplicationListSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import JobSalaryText from "@/components/JobSalaryText";

interface JobData {
  title: string;
  location: string;
  country: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  job: JobData | null;
}

export default function WorkerApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("worker_id", user?.id)
        .order("applied_at", { ascending: false });

      if (appsError) throw appsError;

      // Fetch job details for each application
      const jobIds = appsData?.map(app => app.job_id) || [];
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, location, country, job_type, salary_min, salary_max, currency")
        .in("id", jobIds);

      if (jobsError) throw jobsError;

      // Combine data
      const enrichedApps = appsData?.map(app => ({
        ...app,
        job: jobsData?.find(job => job.id === app.job_id) || null
      })) || [];

      setApplications(enrichedApps);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "default";
      case "REVIEWING": return "secondary";
      case "SHORTLISTED": return "default";
      case "INTERVIEWED": return "secondary";
      case "OFFERED": return "default";
      case "HIRED": return "default";
      case "REJECTED": return "destructive";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">My Applications</h1>
            <ApplicationListSkeleton count={4} />
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
          <PortalBreadcrumb />
          <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">My Applications</h1>

          {applications.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">
                Start applying to jobs to see your applications here.
              </p>
            </Card>
          ) : (
          <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold mb-2 truncate">
                        {app.job?.title || "Job Position"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                        {app.job && (
                          <>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.job.location}, {app.job.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {app.job.job_type}
                            </span>
                            {(app.job.salary_min != null || app.job.salary_max != null) && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                              <JobSalaryText
                                min={app.job.salary_min}
                                max={app.job.salary_max}
                                currency={app.job.currency}
                              />
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {app.cover_letter && (
                        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                          {app.cover_letter}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <Badge variant={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied {format(new Date(app.applied_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" asChild className="w-full md:w-auto shrink-0">
                      <Link to={`/worker/applications/${app.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DashboardLayout>
  );
}
