import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { listAdminAssessments, assessmentWorkerLabel } from '@/modules/trade-test/services/assessmentService';
import type { AssessmentRow } from '@/modules/trade-test/types';

type Filter = 'inbox' | 'today' | 'active' | 'history';

const isFilter = (value: string | null): value is Filter =>
  value === 'inbox' || value === 'today' || value === 'active' || value === 'history';

export default function AdminTradeTestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: Filter = isFilter(searchParams.get('tab')) ? (searchParams.get('tab') as Filter) : 'inbox';
  const workerId = searchParams.get('worker') || undefined;
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminAssessments(workerId ? undefined : filter, workerId)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, workerId]);

  const setTab = (next: Filter) => {
    const nextParams: Record<string, string> = { tab: next };
    if (workerId) nextParams.worker = workerId;
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin"
      portalName="Admin"
      profileMenuItems={adminProfileMenu}
    >
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading">Conduct trade tests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin can run the same centre workflow as an SSVN partner: accept, check-in, KYC, score, and submit.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/trade-test-allocations">Assign centre first</Link>
          </Button>
        </div>

        {workerId && (
          <p className="text-xs text-muted-foreground">
            Showing assessments for this worker.{' '}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => setSearchParams({ tab: filter }, { replace: true })}
            >
              Clear filter
            </button>
          </p>
        )}

        <Tabs value={filter} onValueChange={(v) => setTab(v as Filter)}>
          <TabsList>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm space-y-2">
              <p>No assessments in this list.</p>
              <p>
                Allocate a worker from{' '}
                <Link to="/admin/trade-test-allocations" className="text-primary underline">
                  Assign trade test
                </Link>
                , choosing <strong>Admin will conduct</strong> if no SSVN partner is live yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((a) => (
              <Card key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{assessmentWorkerLabel(a)}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.primary_skill ? `${a.primary_skill} · ` : ''}
                    {a.appointment_date ||
                      (a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : 'Unscheduled')}
                    {a.reporting_window ? ` · ${a.reporting_window}` : ''}
                    {a.center_name ? ` · ${a.center_name}` : ''}
                    {!a.partner_id ? ' · Admin-conducted' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.overall_score != null && (
                    <div className="text-sm">
                      Score: <b>{a.overall_score}</b>
                    </div>
                  )}
                  <Badge variant="outline">{a.status}</Badge>
                  <Button asChild size="sm">
                    <Link to={`/admin/trade-tests/${a.id}`}>Open</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
