import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, Building2, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";
import { adminCreateEmployer } from "@/services/AdminService";
import { passwordSignupIssue, PASSWORD_HINT, sanitizePasswordInput } from "@/lib/validations/password";

interface EmployerRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  joined: string;
  company_name: string | null;
  industry: string | null;
  country: string | null;
  onboarding_completed: boolean;
  job_count: number;
  active_jobs: number;
  profile: Record<string, unknown> | null;
}

export default function AdminEmployers() {
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewEmployer, setViewEmployer] = useState<EmployerRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
  });

  useEffect(() => { fetchEmployers(); }, []);

  const fetchEmployers = async () => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "employer");
      const employerIds = (roles || []).map((r) => r.user_id);
      if (employerIds.length === 0) {
        setEmployers([]);
        return;
      }

      const [{ data: profiles }, { data: employerProfiles }, { data: jobs }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, phone, created_at").in("id", employerIds),
        supabase.from("employer_profiles").select("*").in("user_id", employerIds),
        supabase.from("jobs").select("employer_id, status").in("employer_id", employerIds),
      ]);

      const jobCounts: Record<string, number> = {};
      const activeCounts: Record<string, number> = {};
      (jobs || []).forEach((j) => {
        jobCounts[j.employer_id] = (jobCounts[j.employer_id] || 0) + 1;
        if (j.status === "ACTIVE") activeCounts[j.employer_id] = (activeCounts[j.employer_id] || 0) + 1;
      });

      const rows: EmployerRow[] = (profiles || []).map((p) => {
        const ep = employerProfiles?.find((e) => e.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          joined: new Date(p.created_at).toLocaleDateString(),
          company_name: ep?.company_name ?? null,
          industry: ep?.industry ?? null,
          country: ep?.country ?? null,
          onboarding_completed: ep?.onboarding_completed ?? false,
          job_count: jobCounts[p.id] || 0,
          active_jobs: activeCounts[p.id] || 0,
          profile: ep,
        };
      });

      setEmployers(rows.sort((a, b) => b.job_count - a.job_count));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employers");
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setForm({ fullName: "", email: "", password: "", companyName: "", phone: "" });
  };

  const handleCreateEmployer = async (e: FormEvent) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!fullName) {
      toast.error("Contact name is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    const passwordIssue = passwordSignupIssue(password);
    if (passwordIssue) {
      toast.error(passwordIssue);
      return;
    }

    setCreating(true);
    const result = await adminCreateEmployer({
      fullName,
      email,
      password,
      companyName: form.companyName.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
    setCreating(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Employer created. They can sign in at /employer/login with ${result.data?.email}.`);
    resetCreateForm();
    setCreateOpen(false);
    fetchEmployers();
  };

  const filtered = employers.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.full_name?.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.company_name?.toLowerCase().includes(q) ||
      e.industry?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Employers</h1>
          <p className="text-muted-foreground text-sm">
            All employer accounts, companies, and job postings — {employers.length} total
          </p>
        </div>
        <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create employer
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: employers.length },
          { label: "Onboarded", value: employers.filter((e) => e.onboarding_completed).length },
          { label: "With Jobs", value: employers.filter((e) => e.job_count > 0).length },
          { label: "Active Jobs", value: employers.reduce((s, e) => s + e.active_jobs, 0) },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search company, contact, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading employers...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No employers found</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <Card key={e.id} className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{e.company_name || e.full_name || "Unnamed Employer"}</h3>
                    <Badge variant={e.onboarding_completed ? "default" : "secondary"}>
                      {e.onboarding_completed ? "Onboarded" : "Pending"}
                    </Badge>
                    {e.job_count > 0 && (
                      <Badge variant="outline">{e.active_jobs}/{e.job_count} active jobs</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{e.email}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {e.industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{e.industry}</span>}
                    {e.country && <span>{e.country}</span>}
                    <span>Joined {e.joined}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setViewEmployer(e)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <AdminDeleteUserButton
                    userId={e.id}
                    userRole="employer"
                    userLabel={e.company_name || e.full_name || e.email || "this employer"}
                    onDeleted={() => {
                      if (viewEmployer?.id === e.id) setViewEmployer(null);
                      fetchEmployers();
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create employer</DialogTitle>
            <DialogDescription>
              Creates a login they can use at /employer/login. They still complete company onboarding after sign-in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmployer} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="employer-name">Contact name *</Label>
              <Input
                id="employer-name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Person who will log in"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer-email">Email *</Label>
              <Input
                id="employer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer-password">Temporary password *</Label>
              <Input
                id="employer-password"
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: sanitizePasswordInput(e.target.value) }))}
                placeholder={PASSWORD_HINT}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">{PASSWORD_HINT}. Share this with the employer.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer-company">Company name</Label>
              <Input
                id="employer-company"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer-phone">Phone</Label>
              <Input
                id="employer-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Create employer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewEmployer} onOpenChange={() => setViewEmployer(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewEmployer?.company_name || "Employer Profile"}</DialogTitle>
          </DialogHeader>
          {viewEmployer && (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Contact:</span> {viewEmployer.full_name || "—"}</p>
              <p><span className="font-medium">Email:</span> {viewEmployer.email}</p>
              <p><span className="font-medium">Phone:</span> {viewEmployer.phone || "—"}</p>
              <p><span className="font-medium">Industry:</span> {viewEmployer.industry || "—"}</p>
              <p><span className="font-medium">Country:</span> {viewEmployer.country || "—"}</p>
              <p><span className="font-medium">Jobs Posted:</span> {viewEmployer.job_count} ({viewEmployer.active_jobs} active)</p>
              {viewEmployer.profile && (
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(viewEmployer.profile, null, 2)}
                </pre>
              )}
              <div className="flex justify-end pt-2">
                <AdminDeleteUserButton
                  userId={viewEmployer.id}
                  userRole="employer"
                  userLabel={viewEmployer.company_name || viewEmployer.full_name || viewEmployer.email || "this employer"}
                  variant="destructive"
                  label="Delete User"
                  onDeleted={() => {
                    setViewEmployer(null);
                    fetchEmployers();
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
