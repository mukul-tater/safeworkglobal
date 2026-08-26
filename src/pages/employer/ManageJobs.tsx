import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, Plus, Eye, Trash2, MapPin, Users, Calendar, FileText, Pencil } from "lucide-react";
import { JobListSkeleton } from "@/components/ui/page-skeleton";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import PostedByBadge from "@/components/jobs/PostedByBadge";

interface Job {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  country: string;
  job_type: string;
  openings: number;
  status: string;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  posted_by_role?: string | null;
}

export default function ManageJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);

      // Fetch application counts for all jobs
      if (data && data.length > 0) {
        const jobIds = data.map(job => job.id);
        const { data: applications, error: appError } = await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", jobIds);

        if (!appError && applications) {
          const counts: Record<string, number> = {};
          applications.forEach(app => {
            counts[app.job_id] = (counts[app.job_id] || 0) + 1;
          });
          setApplicationCounts(counts);
        }
      }
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

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    // Employers cannot activate jobs — only draft / pause / close / resubmit for review
    if (newStatus === "ACTIVE") {
      toast({
        title: "Admin approval required",
        description: "Submit the job for review instead of activating it directly.",
        variant: "destructive",
      });
      return;
    }
    try {
      const updateData: { status: string } = { status: newStatus };

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job status updated",
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "DRAFT": return "secondary";
      case "PAUSED": return "outline";
      case "CLOSED": return "destructive";
      case "EXPIRED": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    const symbols: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      AED: "د.إ",
      SAR: "﷼",
      QAR: "ر.ق",
    };

    const symbol = symbols[currency] || currency;

    if (!min && !max) return "Salary not specified";
    if (min && max) return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    if (min) return `From ${symbol}${min.toLocaleString()}`;
    return `Up to ${symbol}${max!.toLocaleString()}`;
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold">Manage Jobs</h1>
            </div>
            <JobListSkeleton count={4} />
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <PortalBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Manage Jobs</h1>
          <Button onClick={() => navigate("/employer/post-job")} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Jobs Posted Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by posting your first job to attract skilled workers
            </p>
            <Button onClick={() => navigate("/employer/post-job")}>
              <Plus className="h-4 w-4 mr-2" />
              Post Your First Job
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  {/* Header with title and status */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={getStatusColor(job.status)}>
                          {getStatusLabel(job.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {job.job_type.replace("_", " ")}
                        </Badge>
                        {job.posted_by_role === "admin" ? (
                          <PostedByBadge role={job.posted_by_role} />
                        ) : null}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold truncate">{job.title}</h3>
                    </div>
                  </div>
                  
                  {/* Job details */}
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{job.location}, {job.country}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        {job.openings} {job.openings === 1 ? "opening" : "openings"}
                      </span>
                      <Badge 
                        variant={applicationCounts[job.id] > 0 ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        {applicationCounts[job.id] || 0} {(applicationCounts[job.id] || 0) === 1 ? "application" : "applications"}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="font-medium text-foreground">
                        {formatSalary(job.salary_min, job.salary_max, job.currency)}
                      </span>
                      {job.posted_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Posted {format(new Date(job.posted_at), "MMM d, yyyy")}
                        </span>
                      )}
                      {job.expires_at && (
                        <span className="text-xs">
                          Expires: {format(new Date(job.expires_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Select
                      value={job.status}
                      onValueChange={(value) => updateJobStatus(job.id, value)}
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING">Pending approval</SelectItem>
                        {job.status === "ACTIVE" && (
                          <SelectItem value="ACTIVE" disabled>
                            Active (admin)
                          </SelectItem>
                        )}
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => navigate(`/jobs/${job.slug || job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => navigate(`/employer/edit-job/${job.id}`)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this job? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="w-full sm:w-auto" onClick={() => deleteJob(job.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
  );
}
