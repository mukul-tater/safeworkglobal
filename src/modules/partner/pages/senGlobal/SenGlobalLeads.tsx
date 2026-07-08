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

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  country: string | null;
  industry: string | null;
  estimated_hires: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function SenGlobalLeads() {
  const { partner } = useCurrentPartner();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: "", contact_name: "", contact_email: "", contact_phone: "",
    country: "", industry: "", estimated_hires: "", notes: "",
  });

  const load = async () => {
    if (!partner) return;
    const { data } = await (supabase as any)
      .from("sen_global_leads").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
    setLeads(data ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [partner]);

  const add = async () => {
    if (!partner || !form.company_name) return;
    const { error } = await (supabase as any).from("sen_global_leads").insert({
      partner_id: partner.id,
      ...form,
      estimated_hires: form.estimated_hires ? Number(form.estimated_hires) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Lead added");
    setOpen(false);
    setForm({ company_name: "", contact_name: "", contact_email: "", contact_phone: "", country: "", industry: "", estimated_hires: "", notes: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("sen_global_leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Employer Leads</h1>
            <p className="text-sm text-muted-foreground">Track prospects across the sales pipeline.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New lead</Button></DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New employer lead</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {[
                  ["Company name *", "company_name"],
                  ["Contact name", "contact_name"],
                  ["Contact email", "contact_email"],
                  ["Contact phone", "contact_phone"],
                  ["Country", "country"],
                  ["Industry", "industry"],
                  ["Estimated hires", "estimated_hires"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={add}>Save lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {leads.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No leads yet.</Card>
          ) : leads.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold">{l.company_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {[l.contact_name, l.country, l.industry].filter(Boolean).join(" • ")}
                  </div>
                  {l.estimated_hires ? <div className="text-xs mt-1">Estimated hires: {l.estimated_hires}</div> : null}
                  {l.notes ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.notes}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{l.status}</Badge>
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PartnerLayout>
  );
}
