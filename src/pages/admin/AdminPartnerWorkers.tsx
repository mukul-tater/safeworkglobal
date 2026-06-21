import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Store, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartnerWorkerRow {
  id: string;
  full_name: string;
  mobile: string;
  skill: string;
  experience_level: string;
  status: string;
  preferred_country: string | null;
  state: string | null;
  district: string | null;
  expected_salary: number | null;
  migration_category: string | null;
  created_at: string;
  partner_name: string;
  partner_code: string | null;
  emitra_id: string | null;
}

export default function AdminPartnerWorkers() {
  const [workers, setWorkers] = useState<PartnerWorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewWorker, setViewWorker] = useState<PartnerWorkerRow | null>(null);

  useEffect(() => { fetchPartnerWorkers(); }, []);

  const fetchPartnerWorkers = async () => {
    try {
      const { data: partnerWorkers, error } = await (supabase as any)
        .from("partner_workers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Table may not exist in all environments
        if (/does not exist|relation/i.test(error.message)) {
          setWorkers([]);
          return;
        }
        throw error;
      }

      const partnerIds = [...new Set((partnerWorkers || []).map((w: { partner_profile_id: string }) => w.partner_profile_id))] as string[];
      let partnerMap: Record<string, { company_name?: string; partner_code?: string; emitra_id?: string }> = {};

      if (partnerIds.length > 0) {
        const { data: partners } = await (supabase as any)
          .from("partner_profiles")
          .select("id, company_name, partner_code, emitra_id")
          .in("id", partnerIds);
        partnerMap = Object.fromEntries(((partners || []) as Array<{ id: string; company_name?: string; partner_code?: string; emitra_id?: string }>).map((p) => [p.id, p]));
      }

      const rows: PartnerWorkerRow[] = (partnerWorkers || []).map((w: Record<string, unknown>) => {
        const partner = partnerMap[w.partner_profile_id as string];
        return {
          id: w.id as string,
          full_name: w.full_name as string,
          mobile: w.mobile as string,
          skill: w.skill as string,
          experience_level: w.experience_level as string,
          status: w.status as string,
          preferred_country: (w.preferred_country as string) ?? null,
          state: (w.state as string) ?? null,
          district: (w.district as string) ?? null,
          expected_salary: (w.expected_salary as number) ?? null,
          migration_category: (w.migration_category as string) ?? null,
          created_at: new Date(w.created_at as string).toLocaleDateString(),
          partner_name: partner?.company_name || "Unknown Partner",
          partner_code: partner?.partner_code ?? null,
          emitra_id: partner?.emitra_id ?? null,
        };
      });

      setWorkers(rows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load partner workers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      w.full_name.toLowerCase().includes(q) ||
      w.mobile.includes(q) ||
      w.skill.toLowerCase().includes(q) ||
      w.partner_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">E-Mitra Partner Workers</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Workers registered by E-Mitra partners — {workers.length} total
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: workers.length },
          { label: "Registered", value: workers.filter((w) => w.status === "registered").length },
          { label: "Verified", value: workers.filter((w) => w.status === "verified").length },
          { label: "Placed", value: workers.filter((w) => w.status === "placed").length },
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
          <Input placeholder="Search worker, skill, partner..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="placed">Placed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading partner workers...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No partner workers found. Workers appear here when E-Mitra partners register them.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Card key={w.id} className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{w.full_name}</h3>
                    <Badge variant="outline">{w.status}</Badge>
                    <Badge variant="secondary">{w.skill}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Store className="h-3 w-3" /> {w.partner_name}
                    {w.partner_code && <span className="text-xs">({w.partner_code})</span>}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{w.mobile}</span>
                    {w.preferred_country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.preferred_country}</span>}
                    <span>{w.experience_level}</span>
                    <span>Registered {w.created_at}</span>
                  </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewWorker?.full_name}</DialogTitle>
          </DialogHeader>
          {viewWorker && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Mobile:</span> {viewWorker.mobile}</p>
              <p><span className="font-medium">Skill:</span> {viewWorker.skill} ({viewWorker.experience_level})</p>
              <p><span className="font-medium">Partner:</span> {viewWorker.partner_name}</p>
              <p><span className="font-medium">E-Mitra ID:</span> {viewWorker.emitra_id || "—"}</p>
              <p><span className="font-medium">Location:</span> {[viewWorker.district, viewWorker.state].filter(Boolean).join(", ") || "—"}</p>
              <p><span className="font-medium">Preferred Country:</span> {viewWorker.preferred_country || "—"}</p>
              <p><span className="font-medium">Expected Salary:</span> {viewWorker.expected_salary ? `₹${viewWorker.expected_salary.toLocaleString("en-IN")}` : "—"}</p>
              <p><span className="font-medium">Migration Readiness:</span> {viewWorker.migration_category || "—"}</p>
              <p><span className="font-medium">Status:</span> {viewWorker.status}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
