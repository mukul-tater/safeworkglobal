import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { CalendarDays, ClipboardCheck, CheckCircle2, FileText, Star, DollarSign } from "lucide-react";

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

export default function SsvnDashboard() {
  const { partner } = useCurrentPartner();
  const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0, pending: 0, avg: 0, revenue: 0 });

  useEffect(() => {
    if (!partner?.id) return;
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [tRes, uRes, cRes, pRes] = await Promise.all([
        (supabase as any).from("assessments").select("id", { count: "exact", head: true })
          .eq("partner_id", partner.id)
          .gte("scheduled_at", today.toISOString())
          .lt("scheduled_at", tomorrow.toISOString()),
        (supabase as any).from("assessments").select("id", { count: "exact", head: true })
          .eq("partner_id", partner.id).eq("status", "scheduled"),
        (supabase as any).from("assessments").select("id", { count: "exact", head: true })
          .eq("partner_id", partner.id).eq("status", "completed"),
        (supabase as any).from("assessments").select("id", { count: "exact", head: true })
          .eq("partner_id", partner.id).eq("status", "employer_review"),
      ]);
      setStats({
        today: tRes.count ?? 0,
        upcoming: uRes.count ?? 0,
        completed: cRes.count ?? 0,
        pending: pRes.count ?? 0,
        avg: 0,
        revenue: 0,
      });
    })();
  }, [partner?.id]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Skill Verification Dashboard</h1>
          <p className="text-muted-foreground">Trade test operations at a glance</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Today's Assessments" value={stats.today} icon={ClipboardCheck} />
          <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarDays} />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
          <StatCard label="Pending Reports" value={stats.pending} icon={FileText} />
          <StatCard label="Avg Rating" value={stats.avg.toFixed(1)} icon={Star} />
          <StatCard label="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} icon={DollarSign} />
        </div>
        <Card className="p-6">
          <h2 className="font-semibold mb-2">Getting started</h2>
          <p className="text-sm text-muted-foreground">
            Assessments will appear here once admin assigns workers to your centre.
            Use the sidebar to view your calendar, run today's assessments, or check history.
          </p>
        </Card>
      </div>
    </PartnerLayout>
  );
}
