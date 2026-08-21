import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, UserPlus, Users } from "lucide-react";
import PartnerLayout from "../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PARTNER_ADD_WORKER_PATH } from "../lib/partnerAssistedWorker";

type WorkerRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  primary_work_type: string | null;
  current_location: string | null;
  review_status: string | null;
  created_at: string | null;
};

export default function PartnerMyWorkersPage() {
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const { data, error: rpcErr } = await (supabase as any).rpc("partner_list_my_workers");
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr.message);
        setRows([]);
      } else {
        const list = ((data || []) as WorkerRow[]).slice().sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        );
        setRows(list);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PartnerLayout>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Workers</h1>
          <p className="text-sm text-muted-foreground">
            Workers you registered. They can sign in with the mobile number and password you set.
          </p>
        </div>
        <Button asChild>
          <Link to={PARTNER_ADD_WORKER_PATH}>
            <UserPlus className="mr-1 h-4 w-4" /> Add Worker
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-destructive">{error}</Card>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No workers added yet.</p>
          <Button asChild className="mt-4">
            <Link to={PARTNER_ADD_WORKER_PATH}>Add Worker</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((w) => (
            <Card key={w.user_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{w.full_name || "Worker"}</h3>
                    {w.review_status && w.review_status !== "not_required" && (
                      <Badge variant="outline">{w.review_status.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[w.phone, w.email, w.primary_work_type, w.current_location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {w.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Registered {new Date(w.created_at).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PartnerLayout>
  );
}
