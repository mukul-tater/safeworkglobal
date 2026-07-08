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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  last_reply_at: string | null;
}

interface Message {
  id: string;
  body: string;
  sender_role: string;
  created_at: string;
}

export default function PartnerTickets() {
  const { partner } = useCurrentPartner();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", body: "" });

  const loadTickets = async () => {
    if (!partner) return;
    const { data } = await (supabase as any)
      .from("partner_support_tickets").select("*").eq("partner_id", partner.id).order("updated_at", { ascending: false });
    setTickets(data ?? []);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await (supabase as any)
      .from("partner_support_messages").select("*").eq("ticket_id", ticketId).order("created_at");
    setMessages(data ?? []);
  };

  useEffect(() => { loadTickets(); /* eslint-disable-next-line */ }, [partner]);
  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected]);

  const createTicket = async () => {
    if (!partner || !user || !form.subject || !form.body) return;
    const { data, error } = await (supabase as any).from("partner_support_tickets").insert({
      partner_id: partner.id,
      subject: form.subject,
      category: form.category,
      priority: form.priority,
    }).select().single();
    if (error) return toast.error(error.message);
    await (supabase as any).from("partner_support_messages").insert({
      ticket_id: data.id, sender_id: user.id, sender_role: "partner", body: form.body,
    });
    toast.success("Ticket created");
    setOpen(false);
    setForm({ subject: "", category: "general", priority: "normal", body: "" });
    loadTickets();
  };

  const sendReply = async () => {
    if (!selected || !user || !reply.trim()) return;
    const { error } = await (supabase as any).from("partner_support_messages").insert({
      ticket_id: selected.id, sender_id: user.id, sender_role: "partner", body: reply,
    });
    if (error) return toast.error(error.message);
    setReply("");
    loadMessages(selected.id);
    loadTickets();
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">Raise and track issues with the SafeWork support team.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New ticket</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New support ticket</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["general","billing","technical","account","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low","normal","high","urgent"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Message</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <Button className="w-full" onClick={createTicket}>Create ticket</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <Card className="p-2 max-h-[70vh] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No tickets yet.</div>
            ) : tickets.map(t => (
              <button key={t.id} onClick={() => setSelected(t)}
                className={`w-full text-left p-3 rounded-md hover:bg-muted transition ${selected?.id === t.id ? "bg-muted" : ""}`}>
                <div className="font-medium text-sm truncate">{t.subject}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>
                </div>
              </button>
            ))}
          </Card>

          <Card className="p-4 min-h-[70vh] flex flex-col">
            {selected ? (
              <>
                <div className="border-b pb-3 mb-3">
                  <div className="font-semibold">{selected.subject}</div>
                  <div className="text-xs text-muted-foreground">{selected.category} • {selected.priority} • {selected.status}</div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`p-3 rounded-lg text-sm max-w-[80%] ${m.sender_role === "partner" ? "bg-primary/10 ml-auto" : "bg-muted"}`}>
                      <div className="text-[10px] text-muted-foreground mb-1">{m.sender_role} • {new Date(m.created_at).toLocaleString()}</div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Type your reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                  <Button onClick={sendReply}><Send className="h-4 w-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a ticket to view the conversation.</div>
            )}
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
}
