import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, MapPin, Briefcase, Share2, Store } from "lucide-react";
import WorkerShareDialog from "@/components/admin/WorkerShareDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatSalaryINR } from "@/lib/utils";
import { displayableEmail } from "@/lib/workerAuthEmail";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";

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
  createdBy: WorkerCreator | null;
}

interface WorkerCreator {
  label: string;
  name: string | null;
  code: string | null;
  emitraId: string | null;
}

interface WorkerApplicationDetail {
  id: string;
  status: string;
  applied_at: string | null;
  title: string;
}

interface WorkerChangeDetail {
  id: string;
  actor_kind: string;
  area: string;
  action: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_name: string | null;
}

function applicationStatusLabel(status: string): string {
  if (status === "SUPERSEDED") return "Changed job";
  if (status === "PENDING") return "Pending";
  const words = status.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function jobTitleFromEmbed(jobs: { title: string } | { title: string }[] | null): string {
  if (!jobs) return "Untitled job";
  const row = Array.isArray(jobs) ? jobs[0] : jobs;
  return row?.title || "Untitled job";
}

function changeSentence(row: WorkerChangeDetail): string {
  const by = row.actor_name
    ? `by ${row.actor_name}`
    : row.actor_kind === "partner"
      ? "by a partner"
      : "by the worker";
  const when = formatWhen(row.created_at);

  let what: string;
  if (row.action === "created" && row.field === "Profile") {
    what = "Profile created";
  } else if (row.field === "Application" && row.action === "created") {
    what = `Applied to ${row.new_value || "a job"}`;
  } else if (row.field === "Job") {
    what = row.old_value
      ? `Changed job from ${row.old_value} to ${row.new_value || "another job"}`
      : `Chose ${row.new_value || "a job"}`;
  } else if (row.area === "document" && row.action === "created") {
    what = `Uploaded ${row.field}${row.new_value ? ` (${row.new_value})` : ""}`;
  } else if (row.area === "document" && row.action === "removed") {
    what = `Removed ${row.field}${row.old_value ? ` (${row.old_value})` : ""}`;
  } else if (row.area === "document" && row.action === "updated") {
    what = `Replaced ${row.field}${row.new_value ? ` (${row.new_value})` : ""}`;
  } else if (row.field === "Test 1" && row.new_value) {
    what = `Test 1 completed, score ${row.new_value}`;
  } else if (!row.old_value && row.new_value) {
    what = `${row.field} set to ${row.new_value}`;
  } else if (row.old_value && !row.new_value) {
    what = `${row.field} cleared (was ${row.old_value})`;
  } else {
    what = `${row.field} changed from ${row.old_value || "—"} to ${row.new_value || "—"}`;
  }

  return `${what} · ${by} · ${when}`;
}

function firstText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function creatorDetails(creator: WorkerCreator): string | null {
  const parts = [creator.name, creator.code, creator.emitraId ? `ID ${creator.emitraId}` : null].filter(
    (part): part is string => !!part,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

function creatorSummary(creator: WorkerCreator): string {
  const details = creatorDetails(creator);
  return details ? `${creator.label} · ${details}` : creator.label;
}

interface PartnerCentreRow {
  id: string;
  center_name: string | null;
  agency_name: string | null;
  owner_name: string | null;
  partner_code: string | null;
  emitra_id: string | null;
}

interface PartnerOrgRow {
  id: string;
  code: string | null;
  typeCode: string | null;
  typeName: string | null;
  companyName: string | null;
}

function creatorForWorker(
  wp: { source_type?: string | null; source_partner_id?: string | null; added_by_org_id?: string | null } | undefined,
  centres: Map<string, PartnerCentreRow>,
  orgs: Map<string, PartnerOrgRow>,
): WorkerCreator | null {
  if (!wp) return null;
  const sourceType = wp.source_type || "organic";
  const centre = wp.source_partner_id ? centres.get(wp.source_partner_id) : undefined;
  const org = wp.added_by_org_id ? orgs.get(wp.added_by_org_id) : undefined;
  const partnerSourced = sourceType === "emitra" || sourceType === "partner" || !!centre || !!org;
  if (!partnerSourced) return null;

  const emitraId = firstText(centre?.emitra_id);
  const isEmitra = sourceType === "emitra" || org?.typeCode === "SEN" || !!emitraId;
  return {
    label: isEmitra ? "E-Mitra" : firstText(org?.typeName) || "Partner",
    name: firstText(centre?.center_name, org?.companyName, centre?.agency_name, centre?.owner_name),
    code: firstText(org?.code, centre?.partner_code),
    emitraId,
  };
}

async function loadPartnerCentres(profileIds: string[]): Promise<Map<string, PartnerCentreRow>> {
  const map = new Map<string, PartnerCentreRow>();
  if (profileIds.length === 0) return map;
  const { data } = await supabase
    .from("partner_profiles")
    .select("id, center_name, agency_name, owner_name, partner_code, emitra_id")
    .in("id", profileIds);
  for (const row of data || []) map.set(row.id, row);
  return map;
}

async function loadPartnerOrgs(orgIds: string[]): Promise<Map<string, PartnerOrgRow>> {
  const map = new Map<string, PartnerOrgRow>();
  if (orgIds.length === 0) return map;
  const { data: orgs } = await supabase
    .from("partners")
    .select("id, partner_code, partner_type_id")
    .in("id", orgIds);
  const rows = orgs || [];
  const typeIds = Array.from(new Set(rows.map((row) => row.partner_type_id)));
  const [{ data: types }, { data: extras }] = await Promise.all([
    typeIds.length
      ? supabase.from("partner_types").select("id, code, name").in("id", typeIds)
      : Promise.resolve({ data: [] as { id: string; code: string; name: string }[] }),
    supabase.from("partner_profiles_ext").select("partner_id, company_name").in("partner_id", orgIds),
  ]);
  const typeById = new Map((types || []).map((type) => [type.id, type]));
  const nameByOrg = new Map((extras || []).map((extra) => [extra.partner_id, extra.company_name]));
  for (const row of rows) {
    const type = typeById.get(row.partner_type_id);
    map.set(row.id, {
      id: row.id,
      code: row.partner_code,
      typeCode: type?.code ?? null,
      typeName: type?.name ?? null,
      companyName: nameByOrg.get(row.id) ?? null,
    });
  }
  return map;
}

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewWorker, setViewWorker] = useState<WorkerRow | null>(null);
  const [shareWorker, setShareWorker] = useState<WorkerRow | null>(null);
  const [applications, setApplications] = useState<WorkerApplicationDetail[]>([]);
  const [changes, setChanges] = useState<WorkerChangeDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [changesError, setChangesError] = useState<string | null>(null);

  useEffect(() => { fetchWorkers(); }, []);

  useEffect(() => {
    if (!viewWorker) {
      setApplications([]);
      setChanges([]);
      setApplicationsError(null);
      setChangesError(null);
      return;
    }

    let cancelled = false;
    const workerId = viewWorker.id;

    const loadDetail = async () => {
      setDetailLoading(true);
      setApplicationsError(null);
      setChangesError(null);

      const [appsRes, logRes] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id, status, applied_at, jobs(title)")
          .eq("worker_id", workerId)
          .order("applied_at", { ascending: false }),
        (supabase as any)
          .from("worker_change_log")
          .select("id, actor_id, actor_kind, area, action, field, old_value, new_value, created_at")
          .eq("worker_id", workerId)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (cancelled) return;

      if (appsRes.error) {
        setApplications([]);
        setApplicationsError("Could not load applications");
      } else {
        const appRows = (appsRes.data || []).map((row) => ({
          id: row.id,
          status: row.status,
          applied_at: row.applied_at,
          title: jobTitleFromEmbed(row.jobs as { title: string } | { title: string }[] | null),
        }));
        setApplications(appRows);
      }

      if (logRes.error) {
        setChanges([]);
        setChangesError("Could not load changes");
        setDetailLoading(false);
        return;
      }

      const logRows = (logRes.data || []) as Array<{
        id: string;
        actor_id: string | null;
        actor_kind: string;
        area: string;
        action: string;
        field: string;
        old_value: string | null;
        new_value: string | null;
        created_at: string;
      }>;

      const actorIds = Array.from(new Set(logRows.map((row) => row.actor_id).filter((id): id is string => !!id)));
      const names: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        if (cancelled) return;
        for (const person of people || []) {
          if (person.full_name) names[person.id] = person.full_name;
        }
      }

      setChanges(logRows.map((row) => ({
        id: row.id,
        actor_kind: row.actor_kind,
        area: row.area,
        action: row.action,
        field: row.field,
        old_value: row.old_value,
        new_value: row.new_value,
        created_at: row.created_at,
        actor_name: row.actor_id ? names[row.actor_id] || null : null,
      })));
      setDetailLoading(false);
    };

    void loadDetail();
    return () => { cancelled = true; };
  }, [viewWorker]);

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

      const profileIds = Array.from(
        new Set((workerProfiles || []).map((w) => w.source_partner_id).filter((id): id is string => !!id)),
      );
      const orgIds = Array.from(
        new Set((workerProfiles || []).map((w) => w.added_by_org_id).filter((id): id is string => !!id)),
      );
      const [centres, orgs] = await Promise.all([
        loadPartnerCentres(profileIds),
        loadPartnerOrgs(orgIds),
      ]);

      const rows: WorkerRow[] = (profiles || []).map((p) => {
        const wp = workerProfiles?.find((w) => w.user_id === p.id);
        const skills = [
          ...(wp?.primary_work_type ? [wp.primary_work_type] : []),
          ...(wp?.secondary_skills || []),
        ];
        return {
          id: p.id,
          email: displayableEmail(p.email) || "",
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
          createdBy: creatorForWorker(wp, centres, orgs),
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
      w.email?.toLowerCase().includes(q) ||
      w.phone?.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q)) ||
      w.createdBy?.label.toLowerCase().includes(q) ||
      w.createdBy?.name?.toLowerCase().includes(q) ||
      w.createdBy?.code?.toLowerCase().includes(q) ||
      w.createdBy?.emitraId?.toLowerCase().includes(q);
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
          <Input placeholder="Search name, email, phone, skills, centre..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    {w.createdBy && (
                      <Badge variant="outline">{w.createdBy.label}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.email || w.phone || "No contact email yet"}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {w.country && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.country}</span>
                    )}
                    {w.experience_years != null && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{w.experience_years} yrs exp</span>
                    )}
                    <span>Joined {w.joined}</span>
                    {w.createdBy && creatorDetails(w.createdBy) && (
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {creatorDetails(w.createdBy)}
                      </span>
                    )}
                  </div>
                  {w.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.from(new Set(w.skills)).slice(0, 4).map((s, idx) => (
                        <Badge key={`${s}-${idx}`} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setShareWorker(w)}>
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setViewWorker(w)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <AdminDeleteUserButton
                    userId={w.id}
                    userRole="worker"
                    userLabel={w.full_name || w.email || w.phone || "this worker"}
                    onDeleted={() => {
                      if (viewWorker?.id === w.id) setViewWorker(null);
                      fetchWorkers();
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <WorkerShareDialog
        open={!!shareWorker}
        onOpenChange={(next) => { if (!next) setShareWorker(null); }}
        workerId={shareWorker?.id || ''}
        workerName={shareWorker?.full_name || shareWorker?.phone || 'this worker'}
      />

      <Dialog open={!!viewWorker} onOpenChange={() => setViewWorker(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewWorker?.full_name || "Worker Profile"}</DialogTitle>
          </DialogHeader>
          {viewWorker && (
            <div className="space-y-5 text-sm">
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {viewWorker.email || "Not provided yet"}</p>
                <p><span className="font-medium">Phone:</span> {viewWorker.phone || "—"}</p>
                <p><span className="font-medium">Location:</span> {viewWorker.country || "—"}</p>
                <p><span className="font-medium">Experience:</span> {viewWorker.experience_years ?? "—"} years</p>
                <p><span className="font-medium">Applications:</span> {viewWorker.application_count}</p>
                <p>
                  <span className="font-medium">Expected Salary:</span>{" "}
                  {formatSalaryINR(viewWorker.expected_salary_min, viewWorker.expected_salary_max, viewWorker.currency || "INR")}
                </p>
                <p><span className="font-medium">Onboarding:</span> {viewWorker.onboarding_completed ? "Complete" : "Incomplete"}</p>
                {viewWorker.createdBy && (
                  <p><span className="font-medium">Created by:</span> {creatorSummary(viewWorker.createdBy)}</p>
                )}
              </div>

              <div>
                <p className="font-medium mb-2">Applications</p>
                {detailLoading ? (
                  <p className="text-muted-foreground">Loading history...</p>
                ) : applicationsError ? (
                  <p className="text-muted-foreground">{applicationsError}</p>
                ) : applications.length === 0 ? (
                  <p className="text-muted-foreground">No applications yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {applications.map((app) => (
                      <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                        <span className="font-medium">{app.title}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{applicationStatusLabel(app.status)}</Badge>
                          <span>{formatDate(app.applied_at)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-medium mb-2">Changes</p>
                {detailLoading ? null : changesError ? (
                  <p className="text-muted-foreground">{changesError}</p>
                ) : changes.length === 0 ? (
                  <p className="text-muted-foreground">No changes recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {changes.map((row) => (
                      <li key={row.id} className="rounded-lg bg-muted px-3 py-2">
                        {changeSentence(row)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShareWorker(viewWorker);
                    setViewWorker(null);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                <AdminDeleteUserButton
                  userId={viewWorker.id}
                  userRole="worker"
                  userLabel={viewWorker.full_name || viewWorker.email || viewWorker.phone || "this worker"}
                  variant="destructive"
                  label="Delete User"
                  onDeleted={() => {
                    setViewWorker(null);
                    fetchWorkers();
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
