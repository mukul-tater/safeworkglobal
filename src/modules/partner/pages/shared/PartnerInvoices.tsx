import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

export default function PartnerInvoices() {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("partner_invoices").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, [partner]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Monthly invoices generated for services rendered.</p>
        </div>
        <Card className="p-4">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{r.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.period_start ? `${r.period_start} → ${r.period_end}` : new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{Number(r.total).toLocaleString("en-IN")}</div>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PartnerLayout>
  );
}
