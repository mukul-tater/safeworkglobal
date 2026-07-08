import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function AdminPartnerTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");

  const load = async () => {
    const { data } = await (supabase as any)
      .from("partner_support_tickets").select("*, partners(partner_code, company_name:partner_profiles_ext(company_name))")
      .order("updated_at", { ascending: false });
    setTickets(data ?? []);
  };

  const loadMsgs = async (id: string) => {
    const { data } = await (supabase as any)
      .from("partner_support_messages").select("*").eq("ticket_id", id).order("created_at");
    setMessages(data ?? []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadMsgs(selected.id); }, [selected]);

  const send = async () => {
    if (!selected || !user || !reply.trim()) return;
    const { error } = await (supabase as any).from("partner_support_messages").insert({
      ticket_id: selected.id, sender_id: user.id, sender_role: "admin", body: reply,
    });
    if (error) return toast.error(error.message);
    setReply("");
    loadMsgs(selected.id);
    load();
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const { error } = await (supabase as any).from("partner_support_tickets").update({ status }).eq("id", selected.id);
    if (error) return toast.error(error.message);
    setSelected({ ...selected, status });
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Partner Support Tickets</h1>
      <div className="grid md:grid-cols-[340px_1fr] gap-4">
        <Card className="p-2 max-h-[75vh] overflow-y-auto">
          {tickets.map(t => (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-full text-left p-3 rounded-md hover:bg-muted ${selected?.id === t.id ? "bg-muted" : ""}`}>
              <div className="font-medium text-sm truncate">{t.subject}</div>
              <div className="text-xs text-muted-foreground">{t.partners?.partner_code ?? "—"}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>
              </div>
            </button>
          ))}
        </Card>

        <Card className="p-4 min-h-[75vh] flex flex-col">
          {selected ? (
            <>
              <div className="border-b pb-3 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selected.subject}</div>
                  <div className="text-xs text-muted-foreground">{selected.category} • {selected.priority}</div>
                </div>
                <Select value={selected.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open","in_progress","waiting","resolved","closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg text-sm max-w-[80%] ${m.sender_role === "admin" ? "bg-primary/10 ml-auto" : "bg-muted"}`}>
                    <div className="text-[10px] text-muted-foreground mb-1">{m.sender_role} • {new Date(m.created_at).toLocaleString()}</div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Type a reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a ticket.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
