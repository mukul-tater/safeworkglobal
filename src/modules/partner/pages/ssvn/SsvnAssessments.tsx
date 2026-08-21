import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PartnerLayout from '../../layout/PartnerLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentPartner } from '../../hooks/useCurrentPartner';
import { listPartnerAssessments } from '@/modules/trade-test/services/assessmentService';
import type { AssessmentRow } from '@/modules/trade-test/types';

export default function SsvnAssessments({
  title,
  filter,
}: {
  title: string;
  filter: 'inbox' | 'today' | 'active' | 'history' | 'calendar';
}) {
  const { partner } = useCurrentPartner();
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner?.id) return;
    (async () => {
      try {
        const mapped =
          filter === 'calendar' ? 'active' : filter;
        const data = await listPartnerAssessments(partner.id, mapped);
        setRows(data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
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
              <Card key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {a.worker_name || `Worker ${a.worker_id.slice(0, 8)}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.appointment_date ||
                      (a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : 'Unscheduled')}
                    {a.reporting_window ? ` · ${a.reporting_window}` : ''}
                    {a.center_name ? ` · ${a.center_name}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.test_evidence_completed_at && !a.overall_score ? (
                    <Badge>Awaiting scorecard</Badge>
                  ) : a.overall_score != null ? (
                    <div className="text-sm">
                      Score: <b>{a.overall_score}</b>
                    </div>
                  ) : null}
                  <Badge variant="outline">{a.status}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/partner/ssvn/assessment/${a.id}`}>Open</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
