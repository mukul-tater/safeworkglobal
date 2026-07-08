import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PartnerRow {
  id: string;
  partner_code: string | null;
  status: string;
  verification_status: string;
  state: string | null;
  district: string | null;
  city: string | null;
  rating: number | null;
  created_at: string;
  partner_types: { code: string; name: string } | null;
  partner_profiles_ext: { company_name: string; owner_name: string | null; mobile: string | null; email: string | null } | null;
}

export default function AdminPartnersV2() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [types, setTypes] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from("partners")
      .select(`id, partner_code, status, verification_status, state, district, city, rating, created_at,
               partner_types:partner_type_id(code, name),
               partner_profiles_ext(company_name, owner_name, mobile, email)`)
      .order("created_at", { ascending: false });
    if (typeFilter !== "all") query = query.eq("partner_type_id", typeFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    (supabase as any).from("partner_types").select("id, code, name").eq("active", true).order("sort_order")
      .then(({ data }: any) => setTypes(data ?? []));
  }, []);

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const setStatus = async (id: string, status: "approved" | "rejected" | "suspended", reason?: string) => {
    const { error } = await (supabase as any).rpc("admin_set_partner_status", {
      p_partner_id: id, p_status: status, p_reason: reason ?? null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Partner ${status}`);
      load();
    }
  };

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay = [
      r.partner_code,
      r.partner_profiles_ext?.company_name,
      r.partner_profiles_ext?.owner_name,
      r.partner_profiles_ext?.email,
      r.partner_profiles_ext?.mobile,
      r.state, r.district, r.city,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Partner Ecosystem</h1>
          <p className="text-muted-foreground">Manage all partner organizations across every network</p>
        </div>

        <Card className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Search</label>
            <Input placeholder="Name, code, mobile, city..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No partners found.</Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-lg">
                        {r.partner_profiles_ext?.company_name ?? "—"}
                      </div>
                      <Badge variant="outline">{r.partner_types?.name}</Badge>
                      <Badge
                        className={
                          r.status === "approved"
                            ? "bg-green-500/10 text-green-700 border-green-200"
                            : r.status === "pending"
                              ? "bg-amber-500/10 text-amber-700 border-amber-200"
                              : "bg-red-500/10 text-red-700 border-red-200"
                        }
                        variant="outline"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {r.partner_profiles_ext?.owner_name && <>{r.partner_profiles_ext.owner_name} · </>}
                      {r.partner_profiles_ext?.mobile && <>{r.partner_profiles_ext.mobile} · </>}
                      {[r.city, r.district, r.state].filter(Boolean).join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {r.partner_code ?? "no code"} · joined {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.status !== "approved" && (
                      <Button size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="outline"
                        onClick={() => {
                          const reason = window.prompt("Reason for rejection?");
                          if (reason !== null) setStatus(r.id, "rejected", reason);
                        }}>Reject</Button>
                    )}
                    {r.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "suspended")}>Suspend</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
