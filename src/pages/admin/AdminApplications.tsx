import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, ExternalLink } from "lucide-react";
import JobApplicationAnswersDialog from "@/components/admin/JobApplicationAnswersDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  worker_id: string;
  worker_name: string;
  worker_email: string;
  job_id: string;
  job_title: string;
  job_location: string;
  company_name: string;
  resume_url: string | null;
  cover_letter: string | null;
}

export default function AdminApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [answersTarget, setAnswersTarget] = useState<ApplicationRow | null>(null);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("applied_at", { ascending: false });

      if (error) throw error;
      if (!apps?.length) {
        setApplications([]);
        return;
      }

      const workerIds = [...new Set(apps.map((a) => a.worker_id))];
      const jobIds = [...new Set(apps.map((a) => a.job_id))];
      const employerIds = [...new Set(apps.map((a) => a.employer_id))];

      const [{ data: profiles }, { data: jobs }, { data: employers }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").in("id", workerIds),
        supabase.from("jobs").select("id, title, location, slug, employer_id").in("id", jobIds),
        supabase.from("employer_profiles").select("user_id, company_name").in("user_id", employerIds),
      ]);

      const rows: ApplicationRow[] = apps.map((a) => {
        const worker = profiles?.find((p) => p.id === a.worker_id);
        const job = jobs?.find((j) => j.id === a.job_id);
        const employer = employers?.find((e) => e.user_id === a.employer_id);
        return {
          id: a.id,
          status: a.status,
          applied_at: a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—",
          worker_id: a.worker_id,
          worker_name: worker?.full_name || "Unknown Worker",
          worker_email: worker?.email || "—",
          job_id: a.job_id,
          job_title: job?.title || "Unknown Job",
          job_location: job?.location || "—",
          company_name: employer?.company_name || "Unknown Company",
          resume_url: a.resume_url,
          cover_letter: a.cover_letter,
        };
      });

      setApplications(rows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Application marked as ${newStatus}`);
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED": case "ACCEPTED": case "HIRED": return "default";
      case "PENDING": case "SUBMITTED": return "secondary";
      case "REJECTED": case "WITHDRAWN": return "destructive";
      default: return "outline";
    }
  };

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.worker_name.toLowerCase().includes(q) ||
      a.worker_email.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q) ||
      a.company_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Job Applications</h1>
      <p className="text-muted-foreground text-sm mb-6">
        All worker job applications across the platform — {applications.length} total
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{applications.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <Card key={s} className="p-3 text-center">
            <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search worker, job, company..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading applications...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No applications found</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4 md:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{a.worker_name}</h3>
                    <Badge variant={getStatusVariant(a.status)}>{a.status}</Badge>
                  </div>
                  <p className="text-sm">
                    Applied for <span className="font-medium">{a.job_title}</span> at {a.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.job_location} · {a.worker_email} · Applied {a.applied_at}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {a.resume_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={a.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" /> Resume
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setAnswersTarget(a)}>
                    <FileText className="h-4 w-4 mr-1" /> Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${a.job_id}`)}>
                    <ExternalLink className="h-4 w-4 mr-1" /> Job
                  </Button>
                  {a.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => handleStatusChange(a.id, "APPROVED")}>Approve</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleStatusChange(a.id, "REJECTED")}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <JobApplicationAnswersDialog
        open={!!answersTarget}
        onOpenChange={(open) => { if (!open) setAnswersTarget(null); }}
        applicationId={answersTarget?.id ?? null}
        jobId={answersTarget?.job_id ?? null}
        workerName={answersTarget?.worker_name ?? ""}
        jobTitle={answersTarget?.job_title ?? ""}
      />
    </DashboardLayout>
  );
}
