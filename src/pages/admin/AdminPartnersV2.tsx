import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BankDetails {
  holder?: string | null;
  account?: string | null;
  ifsc?: string | null;
}

interface PartnerExt {
  company_name: string;
  owner_name: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  pincode: string | null;
  pan: string | null;
  gst: string | null;
  bank: BankDetails | null;
  upi: string | null;
}

interface PartnerRow {
  id: string;
  partner_code: string | null;
  status: string;
  verification_status: string;
  can_add_workers: boolean;
  rejection_reason: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  rating: number | null;
  created_at: string;
  partner_types: { code: string; name: string } | null;
  partner_profiles_ext: PartnerExt | null;
}

const EXT_COLUMNS =
  "company_name, owner_name, mobile, email, address, pincode, pan, gst, bank, upi";

function oneExt(value: PartnerExt | PartnerExt[] | null | undefined): PartnerExt | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function maskAccount(account: string | null | undefined): string {
  const digits = (account || "").replace(/\s/g, "");
  if (!digits) return "—";
  if (digits.length <= 4) return digits;
  return `••••${digits.slice(-4)}`;
}

function statusClass(status: string): string {
  if (status === "approved") return "bg-green-500/10 text-green-700 border-green-200";
  if (status === "pending") return "bg-amber-500/10 text-amber-700 border-amber-200";
  return "bg-red-500/10 text-red-700 border-red-200";
}

export default function AdminPartnersV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeCode = searchParams.get("type");
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [types, setTypes] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>(
    typeCode?.toUpperCase() === "SSVN" ? "pending" : "all",
  );
  const [canToggleAddWorker, setCanToggleAddWorker] = useState(true);
  const [selected, setSelected] = useState<PartnerRow | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const columns = `id, partner_code, status, verification_status, can_add_workers, rejection_reason, state, district, city, rating, created_at,
               partner_types:partner_type_id(code, name),
               partner_profiles_ext(${EXT_COLUMNS})`;
    const withoutFlag = `id, partner_code, status, verification_status, rejection_reason, state, district, city, rating, created_at,
               partner_types:partner_type_id(code, name),
               partner_profiles_ext(${EXT_COLUMNS})`;

    const run = (select: string) => {
      let query = (supabase as any).from("partners").select(select).order("created_at", { ascending: false });
      if (typeFilter !== "all") query = query.eq("partner_type_id", typeFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      return query;
    };

    const first = await run(columns);
    const missingFlag = first.error && /can_add_workers/i.test(first.error.message || "");
    const result = missingFlag ? await run(withoutFlag) : first;
    setCanToggleAddWorker(!missingFlag);
    const list = ((result.data ?? []) as PartnerRow[]).map((row) => ({
      ...row,
      can_add_workers: row.can_add_workers === true,
      partner_profiles_ext: oneExt(row.partner_profiles_ext),
    }));
    setRows(list);
    setSelected((current) => {
      if (!current) return current;
      return list.find((row) => row.id === current.id) ?? current;
    });
    setLoading(false);
  };

  useEffect(() => {
    (supabase as any).from("partner_types").select("id, code, name").eq("active", true).order("sort_order")
      .then(({ data }: any) => {
        const list = (data ?? []) as { id: string; code: string; name: string }[];
        setTypes(list);
        if (typeCode) {
          const match = list.find((t) => t.code.toLowerCase() === typeCode.toLowerCase());
          if (match) setTypeFilter(match.id);
        }
      });
  }, [typeCode]);

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const setCanAddWorkers = async (id: string, enabled: boolean) => {
    const { error } = await (supabase as any).rpc("admin_set_partner_can_add_workers", {
      p_partner_id: id,
      p_enabled: enabled,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(enabled ? "Add worker turned on" : "Add worker turned off");
      load();
    }
  };

  const setStatus = async (id: string, status: "approved" | "rejected" | "suspended", note?: string) => {
    setActing(true);
    const { error } = await (supabase as any).rpc("admin_set_partner_status", {
      p_partner_id: id, p_status: status, p_reason: note ?? null,
    });
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      status === "approved"
        ? "Centre approved. They can sign in now."
        : status === "rejected"
          ? "Application rejected."
          : "Centre suspended.",
    );
    setRejecting(false);
    setReason("");
    setSelected(null);
    load();
  };

  const onTypeChange = (id: string) => {
    setTypeFilter(id);
    if (id === "all") {
      setSearchParams({}, { replace: true });
      return;
    }
    const code = types.find((t) => t.id === id)?.code;
    if (code) setSearchParams({ type: code }, { replace: true });
  };

  const closeReview = () => {
    setSelected(null);
    setRejecting(false);
    setReason("");
  };

  const selectedType = types.find((t) => t.id === typeFilter);
  const isTradeTestQueue = selectedType?.code === "SSVN" || typeCode?.toUpperCase() === "SSVN";
  const heading = isTradeTestQueue
    ? "Trade test partners"
    : selectedType
      ? selectedType.name
      : "Partners";

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

  const ext = selected?.partner_profiles_ext;
  const bank = ext?.bank && typeof ext.bank === "object" ? ext.bank : null;

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            {isTradeTestQueue
              ? "Open a pending centre, check the application, then approve it so they can sign in."
              : "Review partner applications. After approval, the centre can sign in."}
          </p>
        </div>

        <Card className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Search</label>
            <Input placeholder="Name, code, mobile, city..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={onTypeChange}>
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
          <Card className="p-12 text-center text-muted-foreground">
            {statusFilter === "pending" && isTradeTestQueue
              ? "No trade test centres are waiting for approval."
              : "No partners found."}
          </Card>
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
                      <Badge className={statusClass(r.status)} variant="outline">
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
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => { setRejecting(false); setReason(""); setSelected(r); }}>
                      {r.status === "pending" ? "Review application" : "View"}
                    </Button>
                    {canToggleAddWorker && r.status === "approved" && (
                      <Button
                        size="sm"
                        variant={r.can_add_workers ? "outline" : "default"}
                        onClick={() => setCanAddWorkers(r.id, !r.can_add_workers)}
                      >
                        {r.can_add_workers ? "Turn off add worker" : "Turn on add worker"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeReview(); }}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{ext?.company_name || "Trade test centre"}</DialogTitle>
                <DialogDescription>
                  Applied {new Date(selected.created_at).toLocaleString()} · {selected.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <Section title="Centre">
                  <Field label="Organisation" value={ext?.company_name} />
                  <Field label="Owner" value={ext?.owner_name} />
                  <Field label="Mobile" value={ext?.mobile} />
                  <Field label="Email" value={ext?.email} />
                  <Field label="Partner type" value={selected.partner_types?.name} />
                  <Field label="Partner code" value={selected.partner_code} />
                </Section>
                <Section title="Location">
                  <Field label="Address" value={ext?.address} />
                  <Field label="City" value={selected.city} />
                  <Field label="District" value={selected.district} />
                  <Field label="State" value={selected.state} />
                  <Field label="PIN" value={ext?.pincode} />
                </Section>
                <Section title="Tax and payout">
                  <Field label="PAN" value={ext?.pan} />
                  <Field label="GST" value={ext?.gst} />
                  <Field label="Account holder" value={bank?.holder} />
                  <Field label="Account" value={maskAccount(bank?.account)} />
                  <Field label="IFSC" value={bank?.ifsc} />
                  <Field label="UPI" value={ext?.upi} />
                </Section>
                {selected.rejection_reason && (
                  <Card className="p-3 bg-destructive/5 border-destructive/30 text-sm">
                    <p className="font-medium text-destructive mb-1">Rejection reason</p>
                    <p>{selected.rejection_reason}</p>
                  </Card>
                )}
                {rejecting && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Reason for rejection</label>
                    <Textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell the centre why this application was not approved."
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-wrap gap-2">
                {rejecting ? (
                  <>
                    <Button variant="outline" onClick={() => { setRejecting(false); setReason(""); }} disabled={acting}>
                      Back
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={acting || !reason.trim()}
                      onClick={() => setStatus(selected.id, "rejected", reason.trim())}
                    >
                      {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Confirm rejection
                    </Button>
                  </>
                ) : (
                  <>
                    {selected.status === "approved" ? (
                      <Button variant="outline" disabled={acting} onClick={() => setStatus(selected.id, "suspended")}>
                        Suspend
                      </Button>
                    ) : (
                      <Button disabled={acting} onClick={() => setStatus(selected.id, "approved")}>
                        {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Approve
                      </Button>
                    )}
                    {selected.status !== "rejected" && (
                      <Button variant="outline" disabled={acting} onClick={() => setRejecting(true)}>
                        Reject
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span>{value?.trim() ? value : "—"}</span>
    </div>
  );
}
