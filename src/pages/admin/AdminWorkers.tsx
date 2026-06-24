import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatSalaryINR } from "@/lib/utils";

interface WorkerRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  joined: string;
  skills: string[];
  experience_years: number | null;
  country: string | null;
  onboarding_completed: boolean;
  application_count: number;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  currency: string | null;
  profile: Record<string, unknown> | null;
}

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewWorker, setViewWorker] = useState<WorkerRow | null>(null);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "worker");
      const workerIds = (roles || []).map((r) => r.user_id);
      if (workerIds.length === 0) {
        setWorkers([]);
        return;
      }

      const [{ data: profiles }, { data: workerProfiles }, { data: applications }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, phone, created_at").in("id", workerIds),
        supabase.from("worker_profiles").select("*").in("user_id", workerIds),
        supabase.from("job_applications").select("worker_id").in("worker_id", workerIds),
      ]);

      const appCounts: Record<string, number> = {};
      (applications || []).forEach((a) => {
        appCounts[a.worker_id] = (appCounts[a.worker_id] || 0) + 1;
      });

      const rows: WorkerRow[] = (profiles || []).map((p) => {
        const wp = workerProfiles?.find((w) => w.user_id === p.id);
        const skills = [
          ...(wp?.primary_work_type ? [wp.primary_work_type] : []),
          ...(wp?.secondary_skills || []),
        ];
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          joined: new Date(p.created_at).toLocaleDateString(),
          skills,
          experience_years: wp?.years_of_experience ?? null,
          country: wp?.country ?? wp?.current_location ?? null,
          onboarding_completed: wp?.onboarding_completed ?? false,
          application_count: appCounts[p.id] || 0,
          expected_salary_min: wp?.expected_salary_min ?? null,
          expected_salary_max: wp?.expected_salary_max ?? null,
          currency: wp?.currency ?? "INR",
          profile: wp,
        };
      });

      setWorkers(rows.sort((a, b) => b.application_count - a.application_count));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      w.full_name?.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.phone?.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "onboarded" && w.onboarding_completed) ||
      (statusFilter === "pending" && !w.onboarding_completed);
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Workers</h1>
      <p className="text-muted-foreground text-sm mb-6">
        All registered workers, skills, and application activity — {workers.length} total
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: workers.length },
          { label: "Onboarded", value: workers.filter((w) => w.onboarding_completed).length },
          { label: "With Applications", value: workers.filter((w) => w.application_count > 0).length },
          { label: "Pending Onboarding", value: workers.filter((w) => !w.onboarding_completed).length },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone, skills..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            <SelectItem value="onboarded">Onboarded</SelectItem>
            <SelectItem value="pending">Pending Onboarding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading workers...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No workers found</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Card key={w.id} className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{w.full_name || "Unnamed Worker"}</h3>
                    <Badge variant={w.onboarding_completed ? "default" : "secondary"}>
                      {w.onboarding_completed ? "Onboarded" : "Pending"}
                    </Badge>
                    {w.application_count > 0 && (
                      <Badge variant="outline">{w.application_count} applications</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.email}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {w.country && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.country}</span>
                    )}
                    {w.experience_years != null && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{w.experience_years} yrs exp</span>
                    )}
                    <span>Joined {w.joined}</span>
                  </div>
                  {w.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.from(new Set(w.skills)).slice(0, 4).map((s, idx) => (
                        <Badge key={`${s}-${idx}`} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewWorker(w)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewWorker} onOpenChange={() => setViewWorker(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewWorker?.full_name || "Worker Profile"}</DialogTitle>
          </DialogHeader>
          {viewWorker && (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Email:</span> {viewWorker.email}</p>
              <p><span className="font-medium">Phone:</span> {viewWorker.phone || "—"}</p>
              <p><span className="font-medium">Location:</span> {viewWorker.country || "—"}</p>
              <p><span className="font-medium">Experience:</span> {viewWorker.experience_years ?? "—"} years</p>
              <p><span className="font-medium">Applications:</span> {viewWorker.application_count}</p>
              <p>
                <span className="font-medium">Expected Salary:</span>{" "}
                {formatSalaryINR(viewWorker.expected_salary_min, viewWorker.expected_salary_max, viewWorker.currency || "INR")}
              </p>
              <p><span className="font-medium">Onboarding:</span> {viewWorker.onboarding_completed ? "Complete" : "Incomplete"}</p>
              {viewWorker.profile && (
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(viewWorker.profile, null, 2)}
                </pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
