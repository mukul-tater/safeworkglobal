import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { HeartPulse, FileCheck2, Plane, Briefcase } from "lucide-react";

const STAGES = [
  { code: "medical", label: "Medical", icon: HeartPulse },
  { code: "visa", label: "Visa", icon: FileCheck2 },
  { code: "travel", label: "Travel", icon: Plane },
  { code: "deployment", label: "Deployment", icon: Briefcase },
] as const;

export default function SrnDashboard() {
  const { partner } = useCurrentPartner();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const result: Record<string, number> = {};
      for (const s of STAGES) {
        const { count } = await (supabase as any)
          .from("srn_worker_stages")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partner.id)
          .eq("stage", s.code)
          .neq("status", "completed");
        result[s.code] = count ?? 0;
      }
      setCounts(result);
    })();
  }, [partner]);

  if (!partner) return null;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">SRN Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Track worker deployment across medical, visa, travel and deployment stages.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.code} className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-bold">{counts[s.code] ?? 0}</div>
                    <div className="text-xs text-muted-foreground">in progress</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="p-6 text-sm text-muted-foreground">
          Use the sidebar to open the workflow for each stage. Documents uploaded per stage are stored securely and available for admin review.
        </Card>
      </div>
    </PartnerLayout>
  );
}
