import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

export default function SenGlobalRevenue() {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("sen_global_commissions").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, [partner]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Revenue & Commissions</h1>
        <Card className="p-4">
          {rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No commission entries yet.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold">₹{Number(r.amount).toLocaleString("en-IN")} <span className="text-xs text-muted-foreground">{r.currency}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{r.reference ?? r.id}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
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
