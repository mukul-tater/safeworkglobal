import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PartnerLayout from "../../layout/PartnerLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrentPartner } from "../../hooks/useCurrentPartner";
import { listPartnerAssessments, assessmentWorkerLabel, findPartnerAssessmentByReference } from "@/modules/trade-test/services/assessmentService";
import { appliedForLine, testTodayLine, tradeLabel } from "@/modules/trade-test/lib/slipCopy";
import type { AssessmentRow } from "@/modules/trade-test/types";

export default function SsvnCheckin() {
  const { partner } = useCurrentPartner();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("ref") || "");
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);

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
            ["allocated", "accepted", "scheduled", "checked_in", "kyc_done", "running"].includes(a.status),
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

  const openByReference = async (reference: string) => {
    const id = reference.trim();
    if (!id || !partner?.id) return;
    setLookingUp(true);
    try {
      const row = await findPartnerAssessmentByReference(partner.id, id);
      if (!row) {
        toast.error("No booking with that reference for your centre");
        setLookingUp(false);
        return false;
      }
      navigate(`/partner/ssvn/assessment/${row.id}`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open that booking");
      setLookingUp(false);
      return false;
    }
  };

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref || !partner?.id) return;
    void openByReference(ref);
    // Open the scanned slip once the centre is signed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, searchParams]);

  return (
    <PartnerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Candidate check-in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan the worker&apos;s slip or type the booking reference. Confirm the job, the test, and
            the person, then start the test.
          </p>
        </div>
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Booking reference</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TT-10000"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => void openByReference(code)}
            disabled={!code.trim() || lookingUp}
          >
            {lookingUp ? "Opening…" : "Open arrival check"}
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
                  <div className="font-medium">{assessmentWorkerLabel(a)}</div>
                  <div className="text-sm text-muted-foreground">
                    {appliedForLine(tradeLabel(a.primary_skill, a.job_title))}
                    {" · "}
                    {testTodayLine(tradeLabel(a.primary_skill, a.job_title))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.booking_reference ? `${a.booking_reference} · ` : ""}
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
