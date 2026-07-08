import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { Building2, TrendingUp, DollarSign, Briefcase } from "lucide-react";

export default function SenGlobalDashboard() {
  const { partner } = useCurrentPartner();
  const [stats, setStats] = useState({ leads: 0, won: 0, revenue: 0, pending: 0 });

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const [leadsRes, wonRes, revRes] = await Promise.all([
        (supabase as any).from("sen_global_leads").select("id", { count: "exact", head: true }).eq("partner_id", partner.id),
        (supabase as any).from("sen_global_leads").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("status", "won"),
        (supabase as any).from("sen_global_commissions").select("amount, status").eq("partner_id", partner.id),
      ]);
      const commissions = (revRes.data ?? []) as any[];
      setStats({
        leads: leadsRes.count ?? 0,
        won: wonRes.count ?? 0,
        revenue: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0),
        pending: commissions.filter((c) => ["pending", "earned", "invoiced"].includes(c.status)).reduce((s, c) => s + Number(c.amount), 0),
      });
    })();
  }, [partner]);

  const cards = [
    { icon: Building2, label: "Total Leads", value: stats.leads },
    { icon: TrendingUp, label: "Won Deals", value: stats.won },
    { icon: DollarSign, label: "Revenue (Paid)", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
    { icon: Briefcase, label: "Pending Commission", value: `₹${stats.pending.toLocaleString("en-IN")}` },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">SEN Global Dashboard</h1>
          <p className="text-sm text-muted-foreground">Employer leads, commissions and revenue overview.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                    <div className="text-xl font-bold">{c.value}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PartnerLayout>
  );
}
