import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type StageCode = "medical" | "visa" | "offer_letter" | "poe" | "travel" | "deployment";

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

interface Row {
  id: string;
  worker_id: string;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export default function SrnStageManager({ stage, title }: { stage: StageCode; title: string }) {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ worker_id: "", scheduled_at: "", notes: "" });

  const load = async () => {
    if (!partner) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("srn_worker_stages")
      .select("id, worker_id, status, scheduled_at, completed_at, notes")
      .eq("partner_id", partner.id)
      .eq("stage", stage)
      .order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner, stage]);

  const add = async () => {
    if (!partner || !form.worker_id) return;
    const { error } = await (supabase as any).from("srn_worker_stages").insert({
      partner_id: partner.id,
      worker_id: form.worker_id,
      stage,
      status: "in_progress",
      scheduled_at: form.scheduled_at || null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    setOpen(false);
    setForm({ worker_id: "", scheduled_at: "", notes: "" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await (supabase as any).from("srn_worker_stages").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">Track and update {title.toLowerCase()} progress per worker.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add worker</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add worker to {title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Worker ID</Label>
                  <Input value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })} placeholder="UUID of the worker" />
                </div>
                <div>
                  <Label>Scheduled at</Label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={add}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No workers in this stage yet.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate">{r.worker_id}</div>
                    {r.notes && <div className="text-xs text-muted-foreground truncate">{r.notes}</div>}
                    {r.scheduled_at && <div className="text-xs text-muted-foreground">Scheduled: {new Date(r.scheduled_at).toLocaleString()}</div>}
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PartnerLayout>
  );
}
