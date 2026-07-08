import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminPartnerPayouts() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({ status: "approved", reference: "", notes: "", rejection_reason: "" });

  const load = async () => {
    const { data } = await (supabase as any)
      .from("partner_payout_requests").select("*, partners(partner_code)").order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const process = async () => {
    if (!selected) return;
    const { error } = await (supabase as any).rpc("admin_process_payout", {
      p_payout_id: selected.id,
      p_status: form.status,
      p_reference: form.reference || null,
      p_notes: form.notes || null,
      p_rejection_reason: form.rejection_reason || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setSelected(null);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Partner Payout Requests</h1>
      <Card className="p-4">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No requests.</div>
        ) : (
          <div className="divide-y">
            {rows.map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">₹{Number(r.amount).toLocaleString("en-IN")} <span className="text-xs text-muted-foreground">({r.partners?.partner_code ?? "—"})</span></div>
                  <div className="text-xs text-muted-foreground">{new Date(r.requested_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => { setSelected(r); setForm({ status: "approved", reference: "", notes: "", rejection_reason: "" }); }}>Process</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process payout</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-sm">Amount: <b>₹{Number(selected.amount).toLocaleString("en-IN")}</b></div>
              <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto">{JSON.stringify(selected.bank_details, null, 2)}</pre>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["approved","processing","paid","rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reference / UTR</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div><Label>Admin notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              {form.status === "rejected" && (
                <div><Label>Rejection reason</Label><Textarea value={form.rejection_reason} onChange={(e) => setForm({ ...form, rejection_reason: e.target.value })} /></div>
              )}
              <Button className="w-full" onClick={process}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
