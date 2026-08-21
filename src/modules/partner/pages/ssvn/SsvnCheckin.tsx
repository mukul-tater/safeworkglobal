import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { listPartnerAssessments } from "@/modules/trade-test/services/assessmentService";
import type { AssessmentRow } from "@/modules/trade-test/types";

export default function SsvnCheckin() {
  const { partner } = useCurrentPartner();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner?.id) return;
    (async () => {
      try {
        const [today, active] = await Promise.all([
          listPartnerAssessments(partner.id, "today"),
          listPartnerAssessments(partner.id, "active"),
        ]);
        const map = new Map<string, AssessmentRow>();
        [...today, ...active]
          .filter((a) =>
            ["accepted", "scheduled", "checked_in", "kyc_done", "running"].includes(a.status),
          )
          .forEach((a) => map.set(a.id, a));
        setRows([...map.values()]);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [partner?.id]);

  const openById = () => {
    const id = code.trim();
    if (!id) return;
    navigate(`/partner/ssvn/assessment/${id}`);
  };

  return (
    <PartnerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Candidate check-in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Open the worker&apos;s assessment to review Aadhaar / PAN / passport, confirm the person
            who arrived, take a live photo, then run video KYC.
          </p>
        </div>
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Assessment ID</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste assessment id"
            />
          </div>
          <Button className="w-full" onClick={openById} disabled={!code.trim()}>
            Open arrival check
          </Button>
        </Card>

        <div className="space-y-2">
          <h2 className="font-semibold">Today &amp; in-progress</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No candidates to check in.</Card>
          ) : (
            rows.map((a) => (
              <Card key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{a.worker_name || `Worker ${a.worker_id.slice(0, 8)}`}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.appointment_date || "Unscheduled"}
                    {a.reporting_window ? ` · ${a.reporting_window}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{a.status}</Badge>
                  <Button asChild size="sm">
                    <Link to={`/partner/ssvn/assessment/${a.id}`}>Open check-in</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
