import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function PartnerPayouts() {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", account_holder: "", account_number: "", ifsc: "" });

  const load = async () => {
    if (!partner) return;
    const { data } = await (supabase as any)
      .from("partner_payout_requests").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [partner]);

  const submit = async () => {
    if (!partner) return;
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    if (amount > partner.wallet_available) return toast.error("Amount exceeds available balance");
    const { error } = await (supabase as any).from("partner_payout_requests").insert({
      partner_id: partner.id,
      amount,
      bank_details: {
        account_holder: form.account_holder,
        account_number: form.account_number,
        ifsc: form.ifsc.toUpperCase(),
      },
    });
    if (error) return toast.error(error.message);
    toast.success("Payout requested");
    setOpen(false);
    setForm({ amount: "", account_holder: "", account_number: "", ifsc: "" });
    load();
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payouts</h1>
            <p className="text-sm text-muted-foreground">Request withdrawal of your available balance.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Request payout</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Request payout</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Available: ₹{Number(partner?.wallet_available ?? 0).toLocaleString("en-IN")}
                </div>
                <div><Label>Amount (INR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Account holder</Label><Input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} /></div>
                <div><Label>Account number</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
                <div><Label>IFSC</Label><Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} /></div>
                <Button className="w-full" onClick={submit}>Submit request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No payout requests yet.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">₹{Number(r.amount).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-muted-foreground">
                      Requested {new Date(r.requested_at).toLocaleString()}
                    </div>
                    {r.rejection_reason && <div className="text-xs text-destructive">Reason: {r.rejection_reason}</div>}
                    {r.reference && <div className="text-xs text-muted-foreground">Ref: {r.reference}</div>}
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PartnerLayout>
  );
}
