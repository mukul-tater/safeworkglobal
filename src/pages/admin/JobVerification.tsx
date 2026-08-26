import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteJob, adminUpdateJob } from "@/services/AdminService";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Job {
  id: string;
  slug: string | null;
  title: string;
  company_name: string;
  status: string;
  posted_at: string;
  location: string;
  employer_id: string;
}

export default function JobVerification() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, slug, title, status, posted_at, location, employer_id")
        .order("posted_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch employer profiles to get company names
      const employerIds = [...new Set(jobsData.map((job) => job.employer_id))];
      const { data: employers, error: employersError } = await supabase
        .from("employer_profiles")
        .select("user_id, company_name")
        .in("user_id", employerIds);

      if (employersError) throw employersError;

      const jobsWithCompany: Job[] = jobsData.map((job) => {
        const employer = employers.find((e) => e.user_id === job.employer_id);
        return {
          ...job,
          company_name: employer?.company_name || "Unknown Company",
        };
      });

      setJobs(jobsWithCompany);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId: string) => {
    try {
      const { error } = await adminUpdateJob(jobId, {
        status: "ACTIVE",
        posted_at: new Date().toISOString(),
      });
      if (error) throw new Error(error);
      toast.success("Job approved successfully");
      fetchJobs();
    } catch (error: any) {
      console.error("Error approving job:", error);
      toast.error(error.message || "Failed to approve job");
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      const { error } = await adminUpdateJob(jobId, { status: "REJECTED" });
      if (error) throw new Error(error);
      toast.success("Job rejected");
      fetchJobs();
    } catch (error: any) {
      console.error("Error rejecting job:", error);
      toast.error(error.message || "Failed to reject job");
    }
  };

  const handleDelete = async () => {
    if (!deleteJobId) return;

    try {
      const { error } = await adminDeleteJob(deleteJobId);
      if (error) throw new Error(error);
      toast.success("Job deleted successfully");
      setDeleteJobId(null);
      fetchJobs();
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PENDING":
      case "DRAFT":
        return "secondary";
      case "REJECTED":
      case "CLOSED":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">All Jobs</h1>
        <p className="text-muted-foreground">Loading jobs...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">All Jobs</h1>
          <p className="text-muted-foreground text-sm mb-6 md:mb-8">
            Complete job listings — review, approve, edit, and manage all employer postings
          </p>

          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg md:text-xl font-bold truncate">{job.title}</h3>
                      <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-1 text-sm truncate">{job.company_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">{job.location}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Posted {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/jobs/${job.slug || job.id}`)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/admin/edit-job/${job.id}`)}
                    title="Edit job"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteJobId(job.id)}
                    title="Delete job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {["PENDING", "DRAFT", "PAUSED"].includes(job.status) ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleApprove(job.id)}
                        title="Approve job"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleReject(job.id)}
                        title="Reject job"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
