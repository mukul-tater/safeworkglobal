import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import {
  approveBond,
  approveMedical,
  approveTradeTest,
  markPaymentPaid,
  recordInterviewScore,
} from '@/modules/worker-verification/services/verificationService';
import { displayableEmail } from '@/lib/workerAuthEmail';

type QueueTab =
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'trade_test'
  | 'medical'
  | 'bond';

type Row = {
  id: string;
  user_id: string;
  stage: string;
  primary_skill: string | null;
  interview_score: number | null;
  trade_test_required: boolean | null;
  trade_test_status: string | null;
  trade_test_result_url: string | null;
  trade_test_center_name: string | null;
  trade_test_reporting_window: string | null;
  state: string | null;
  medical_status: string | null;
  medical_result_url: string | null;
  bond_status: string | null;
  payment_status: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function AdminVerificationQueue() {
  const [tab, setTab] = useState<QueueTab>('awaiting_interview');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('worker_verification')
        .select('*')
        .order('updated_at', { ascending: false });

      if (tab === 'awaiting_interview') query = query.eq('stage', 'awaiting_interview');
      else if (tab === 'awaiting_payment') query = query.eq('stage', 'awaiting_payment');
      else if (tab === 'trade_test') query = query.eq('stage', 'trade_test');
      else if (tab === 'medical') query = query.eq('stage', 'medical');
      else if (tab === 'bond') query = query.eq('stage', 'bond').eq('bond_status', 'submitted');

      const { data, error } = await query;
      if (error) throw error;

      const list = (data || []) as Row[];
      if (list.length) {
        const ids = list.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .in('id', ids);
        const map = new Map((profiles || []).map((p) => [p.id, p]));
        list.forEach((r) => {
          const p = map.get(r.user_id);
          r.full_name = p?.full_name;
          r.phone = p?.phone;
          r.email = displayableEmail(p?.email) || null;
        });
      }
      setRows(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load queue');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (userId: string, fn: () => Promise<unknown>, ok: string) => {
    setActingId(userId);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Verification queue</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Score interviews, confirm payments, review trade/medical uploads, and approve bonds.
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as QueueTab)} className="mb-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="awaiting_interview">Interviews</TabsTrigger>
          <TabsTrigger value="awaiting_payment">Payments</TabsTrigger>
          <TabsTrigger value="trade_test">Trade tests</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="bond">Bonds</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No workers in this queue.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{r.full_name || 'Worker'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[r.phone, r.email].filter(Boolean).join(' · ') || 'No contact yet'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.primary_skill && <Badge variant="outline">{r.primary_skill}</Badge>}
                    <Badge variant="secondary">{r.stage}</Badge>
                    {r.trade_test_required && <Badge>Trade test required</Badge>}
                  </div>
                </div>
              </div>

              {tab === 'awaiting_interview' && (
                <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label>Score (0–100)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={scores[r.user_id] ?? '75'}
                      onChange={(e) => setScores((s) => ({ ...s, [r.user_id]: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea
                      rows={2}
                      value={notes[r.user_id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.user_id]: e.target.value }))}
                    />
                  </div>
                  <Button
                    disabled={actingId === r.user_id}
                    onClick={() =>
                      void run(
                        r.user_id,
                        () =>
                          recordInterviewScore(
                            r.user_id,
                            Number(scores[r.user_id] ?? 75),
                            notes[r.user_id],
                          ),
                        'Interview scored — moved to payment',
                      )
                    }
                  >
                    {actingId === r.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save score'}
                  </Button>
                </div>
              )}

              {tab === 'awaiting_payment' && (
                <Button
                  disabled={actingId === r.user_id}
                  onClick={() =>
                    void run(
                      r.user_id,
                      () =>
                        markPaymentPaid(r.user_id, ASSESSMENT_FEE_INR, {
                          provider: 'admin_manual',
                        }),
                      'Payment marked paid',
                    )
                  }
                >
                  {actingId === r.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Mark payment received (₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')})
                </Button>
              )}

              {tab === 'trade_test' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {r.state ? <>State: {r.state} · </> : null}
                    Centre: {r.trade_test_center_name || 'Not confirmed'}
                    {r.trade_test_reporting_window
                      ? ` · Report ${r.trade_test_reporting_window}`
                      : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {r.trade_test_status || 'pending'}
                    {r.trade_test_result_url ? (
                      <>
                        {' · '}
                        <a
                          className="text-primary underline"
                          href={r.trade_test_result_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View upload
                        </a>
                      </>
                    ) : (
                      ' · No upload yet'
                    )}
                  </p>
                  <Button
                    disabled={actingId === r.user_id || !r.trade_test_result_url}
                    onClick={() =>
                      void run(r.user_id, () => approveTradeTest(r.user_id), 'Trade test passed')
                    }
                  >
                    Approve trade test
                  </Button>
                </div>
              )}

              {tab === 'medical' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Status: {r.medical_status || 'pending'}
                    {r.medical_result_url ? (
                      <>
                        {' · '}
                        <a
                          className="text-primary underline"
                          href={r.medical_result_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View upload
                        </a>
                      </>
                    ) : (
                      ' · No upload yet'
                    )}
                  </p>
                  <Button
                    disabled={actingId === r.user_id || !r.medical_result_url}
                    onClick={() =>
                      void run(r.user_id, () => approveMedical(r.user_id), 'Medical passed')
                    }
                  >
                    Approve medical
                  </Button>
                </div>
              )}

              {tab === 'bond' && (
                <Button
                  disabled={actingId === r.user_id}
                  onClick={() =>
                    void run(r.user_id, () => approveBond(r.user_id), 'Bond approved — GCC ready')
                  }
                >
                  Approve bond & mark GCC ready
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
