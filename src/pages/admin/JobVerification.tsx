import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Trash2, Pencil, Plus, IndianRupee, Loader2, Share2, Users } from "lucide-react";
import ShareJobDialog, { type ShareJobTarget } from "@/components/jobs/ShareJobDialog";
import { listAdminJobShares, type JobShareRow } from "@/lib/jobShare";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteJob, adminUpdateJob } from "@/services/AdminService";
import { useNavigate } from "react-router-dom";
import PostedByBadge from "@/components/jobs/PostedByBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatServiceChargePlusGst,
  resolveServiceChargeInr,
  SERVICE_CHARGE_MAX_INR,
  SERVICE_CHARGE_MIN_INR,
} from "@/lib/jobServiceCharge";
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
  posted_by_role: string;
  service_charge: number;
}

export default function JobVerification() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [postedByFilter, setPostedByFilter] = useState<"all" | "employer" | "admin">("all");
  const [feeJob, setFeeJob] = useState<Job | null>(null);
  const [feeValue, setFeeValue] = useState("");
  const [savingFee, setSavingFee] = useState(false);
  const [shareJob, setShareJob] = useState<ShareJobTarget | null>(null);
  const [shares, setShares] = useState<JobShareRow[]>([]);
  const [sharesJob, setSharesJob] = useState<Job | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, slug, title, status, posted_at, location, employer_id, posted_by_role, service_charge")
        .order("posted_at", { ascending: false });

      if (jobsError) throw jobsError;
      if (!jobsData?.length) {
        setJobs([]);
        return;
      }

      // Fetch employer profiles to get company names
      const employerIds = [...new Set(jobsData.map((job) => job.employer_id))];
      const { data: employers, error: employersError } = await supabase
        .from("employer_profiles")
        .select("user_id, company_name")
        .in("user_id", employerIds);

      if (employersError) throw employersError;

      const jobsWithCompany: Job[] = jobsData.map((job) => {
        const employer = employers?.find((e) => e.user_id === job.employer_id);
        return {
          ...job,
          company_name: employer?.company_name || "Unknown Company",
          posted_by_role: job.posted_by_role || "employer",
          service_charge: resolveServiceChargeInr(job.service_charge),
        };
      });

      setJobs(jobsWithCompany);

      try {
        setShares(await listAdminJobShares());
      } catch (shareError) {
        console.error("Error fetching job shares:", shareError);
        setShares([]);
      }
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

  const openFeeDialog = (job: Job) => {
    setFeeJob(job);
    setFeeValue(String(resolveServiceChargeInr(job.service_charge)));
  };

  const handleSaveServiceCharge = async () => {
    if (!feeJob) return;
    const amount = Number(feeValue);
    if (!Number.isInteger(amount) || amount < SERVICE_CHARGE_MIN_INR || amount > SERVICE_CHARGE_MAX_INR) {
      toast.error(`Enter a whole rupee amount between ₹${SERVICE_CHARGE_MIN_INR} and ₹${SERVICE_CHARGE_MAX_INR.toLocaleString("en-IN")}`);
      return;
    }

    setSavingFee(true);
    try {
      const { error } = await adminUpdateJob(feeJob.id, { service_charge: amount });
      if (error) throw new Error(error);
      toast.success(`Service charge updated to ${formatServiceChargePlusGst(amount)}`);
      setFeeJob(null);
      fetchJobs();
    } catch (error: any) {
      console.error("Error updating service charge:", error);
      toast.error(error.message || "Failed to update service charge");
    } finally {
      setSavingFee(false);
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

  const sharesFor = (jobId: string) => shares.filter((row) => row.job_id === jobId);
  const openCount = (jobId: string) => sharesFor(jobId).reduce((sum, row) => sum + row.open_count, 0);
  const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

  const visibleJobs = jobs.filter((job) => {
    if (postedByFilter === "all") return true;
    return (job.posted_by_role || "employer") === postedByFilter;
  });

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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">All Jobs</h1>
            <Button onClick={() => navigate("/admin/post-job")} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Complete job listings — review, approve, edit, change service charge, and manage employer and admin postings
          </p>
          <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
            {([
              { id: "all", label: "All" },
              { id: "employer", label: "Employer posted" },
              { id: "admin", label: "Admin posted" },
            ] as const).map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={postedByFilter === tab.id ? "default" : "outline"}
                onClick={() => setPostedByFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {visibleJobs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {jobs.length === 0 ? "No jobs yet." : "No jobs match this filter."}
            </Card>
          ) : (
          <div className="space-y-4">
            {visibleJobs.map((job) => (
              <Card key={job.id} className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg md:text-xl font-bold truncate">{job.title}</h3>
                      <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                      <PostedByBadge role={job.posted_by_role} />
                    </div>
                    <p className="text-muted-foreground mb-1 text-sm truncate">{job.company_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">{job.location}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Posted {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Draft"}
                    </p>
                    <p className="text-xs md:text-sm text-foreground mt-1">
                      Service charge {formatServiceChargePlusGst(job.service_charge)}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {openCount(job.id)} {openCount(job.id) === 1 ? "open" : "opens"} from shared links
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
                  {job.status === "ACTIVE" ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShareJob({ id: job.id, slug: job.slug, title: job.title })}
                      title="Share job"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSharesJob(job)}
                    title="Who shared this job"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openFeeDialog(job)}
                    title="Change service charge"
                  >
                    <IndianRupee className="h-4 w-4" />
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
          )}

      <Dialog open={!!feeJob} onOpenChange={(open) => { if (!open) setFeeJob(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change service charge</DialogTitle>
            <DialogDescription>
              {feeJob ? `Set the SafeWork Global service fee for ${feeJob.title}.` : "Set the SafeWork Global service fee for this job."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="job-service-charge">Amount (₹)</Label>
            <Input
              id="job-service-charge"
              type="number"
              min={SERVICE_CHARGE_MIN_INR}
              max={SERVICE_CHARGE_MAX_INR}
              step={1}
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Workers see this as the amount plus GST. Enter the total they pay, including GST.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFeeJob(null)} disabled={savingFee}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveServiceCharge()} disabled={savingFee}>
              {savingFee ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareJobDialog
        open={shareJob != null}
        onOpenChange={(open) => {
          if (!open) setShareJob(null);
        }}
        job={shareJob}
      />

      <Dialog open={!!sharesJob} onOpenChange={(open) => { if (!open) setSharesJob(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who shared this job</DialogTitle>
            <DialogDescription>
              {sharesJob
                ? `${sharesJob.title} — ${openCount(sharesJob.id)} ${openCount(sharesJob.id) === 1 ? "open" : "opens"}`
                : "Shared links for this job."}
            </DialogDescription>
          </DialogHeader>
          {sharesJob && sharesFor(sharesJob.id).length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has shared this job yet.</p>
          ) : (
            <ul className="space-y-3">
              {sharesJob ? sharesFor(sharesJob.id).map((row) => (
                <li key={row.share_id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{row.sharer_name}</p>
                    <p className="text-muted-foreground">
                      {roleLabel(row.sharer_role)}
                      {row.partner_code ? ` · ${row.partner_code}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-muted-foreground">
                    {row.open_count} {row.open_count === 1 ? "open" : "opens"}
                  </p>
                </li>
              )) : null}
            </ul>
          )}
        </DialogContent>
      </Dialog>

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
