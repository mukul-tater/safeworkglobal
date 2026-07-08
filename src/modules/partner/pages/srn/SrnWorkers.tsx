import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

interface WorkerTimeline {
  worker_id: string;
  stages: { stage: string; status: string; updated_at: string }[];
}

export default function SrnWorkers() {
  const { partner } = useCurrentPartner();
  const [workers, setWorkers] = useState<WorkerTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("srn_worker_stages")
        .select("worker_id, stage, status, updated_at")
        .eq("partner_id", partner.id)
        .order("updated_at", { ascending: false });
      const grouped = new Map<string, WorkerTimeline>();
      (data ?? []).forEach((r: any) => {
        if (!grouped.has(r.worker_id)) grouped.set(r.worker_id, { worker_id: r.worker_id, stages: [] });
        grouped.get(r.worker_id)!.stages.push(r);
      });
      setWorkers([...grouped.values()]);
      setLoading(false);
    })();
  }, [partner]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Assigned Workers</h1>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : workers.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No workers assigned yet.</Card>
        ) : (
          <div className="space-y-3">
            {workers.map((w) => (
              <Card key={w.worker_id} className="p-4">
                <div className="font-mono text-xs text-muted-foreground">{w.worker_id}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {w.stages.map((s) => (
                    <Badge key={s.stage} variant="outline">
                      {s.stage}: {s.status}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
