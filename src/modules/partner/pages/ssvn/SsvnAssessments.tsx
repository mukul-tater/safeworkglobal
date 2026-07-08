import { useEffect, useState } from "react";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";

interface Assessment {
  id: string;
  worker_id: string;
  scheduled_at: string | null;
  status: string;
  assessor_name: string | null;
  location: string | null;
  overall_score: number | null;
}

export default function SsvnAssessments({
  title,
  filter,
}: {
  title: string;
  filter: "today" | "calendar" | "history";
}) {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner?.id) return;
    (async () => {
      let q = (supabase as any).from("assessments").select("*").eq("partner_id", partner.id);
      if (filter === "today") {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        q = q.gte("scheduled_at", today.toISOString()).lt("scheduled_at", tomorrow.toISOString());
      } else if (filter === "history") {
        q = q.in("status", ["completed", "approved", "rejected"]);
      }
      q = q.order("scheduled_at", { ascending: filter !== "history" });
      const { data } = await q;
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [partner?.id, filter]);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {loading ? (
          <div>Loading...</div>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            No assessments to show.
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Worker {a.worker_id.slice(0, 8)}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "Unscheduled"}
                    {a.location ? ` · ${a.location}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.overall_score != null && (
                    <div className="text-sm">Score: <b>{a.overall_score}</b></div>
                  )}
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
