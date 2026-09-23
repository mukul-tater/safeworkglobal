import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

type ChangeRow = {
  id: string;
  worker_name: string;
  from_job_title: string | null;
  to_job_title: string | null;
  change_number: number;
  created_at: string;
};

type WorkerRow = {
  user_id: string;
  worker_name: string;
  phone: string | null;
  job_title: string | null;
  job_switch_blocked: boolean;
  job_change_fee_due: number | null;
  job_change_fee_paid_at: string | null;
};

type PaymentRow = {
  id: string;
  worker_name: string;
  amount: number;
  provider: string | null;
  provider_ref: string | null;
  transfer_method: string | null;
  created_at: string;
};

type Overview = {
  job_switch_enabled: boolean;
  changes: ChangeRow[];
  workers: WorkerRow[];
  payments: PaymentRow[];
};

const fmt = (value: string) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminJobSwitchPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_job_switch_overview');
    if (error) {
      toast.error(error.message);
      setOverview(null);
    } else {
      const next = data as unknown as Overview;
      setOverview(next);
      const draft: Record<string, string> = {};
      for (const worker of next.workers || []) {
        draft[worker.user_id] = worker.job_change_fee_due ? String(worker.job_change_fee_due) : '';
      }
      setFees(draft);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(null);
    }
  };

  if (loading && !overview) {
    return (
      <Card className="mb-4 flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading job switch
      </Card>
    );
  }
  if (!overview) return null;

  return (
    <Card className="mb-4 space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Job switch</h2>
          <p className="text-sm text-muted-foreground">
            On by default. Workers keep one active job. A return to an earlier job reopens that application.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={overview.job_switch_enabled}
            disabled={busy === 'enabled'}
            onCheckedChange={(checked) =>
              void run(
                'enabled',
                async () => {
                  const { error } = await supabase.rpc('admin_set_job_switch_enabled', { p_enabled: checked });
                  if (error) throw new Error(error.message);
                },
                checked ? 'Job switch is on' : 'Job switch is off',
              )
            }
          />
          <span className="text-sm">{overview.job_switch_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      {overview.payments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Bank transfers waiting</p>
          {overview.payments.map((payment) => (
            <div key={payment.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                {payment.worker_name} · ₹{Number(payment.amount).toLocaleString('en-IN')} · {payment.transfer_method || payment.provider} · {payment.provider_ref || '—'}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy === payment.id}
                  onClick={() =>
                    void run(
                      payment.id,
                      async () => {
                        const { error } = await supabase.rpc('admin_review_job_change_payment', {
                          p_payment_id: payment.id,
                          p_action: 'approve',
                        });
                        if (error) throw new Error(error.message);
                      },
                      'Transfer approved',
                    )
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === payment.id}
                  onClick={() =>
                    void run(
                      payment.id,
                      async () => {
                        const { error } = await supabase.rpc('admin_review_job_change_payment', {
                          p_payment_id: payment.id,
                          p_action: 'reject',
                        });
                        if (error) throw new Error(error.message);
                      },
                      'Transfer rejected',
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Workers on a job</p>
        {overview.workers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No worker has an active job yet.</p>
        ) : (
          overview.workers.map((worker) => (
            <div key={worker.user_id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="text-sm font-medium">{worker.worker_name}</p>
                <p className="text-xs text-muted-foreground">
                  {worker.job_title || 'No active job'}
                  {worker.phone ? ` · ${worker.phone}` : ''}
                  {worker.job_change_fee_paid_at ? ' · extra amount paid' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="h-9 w-28"
                  inputMode="numeric"
                  placeholder="Extra ₹"
                  value={fees[worker.user_id] ?? ''}
                  onChange={(e) => setFees((prev) => ({ ...prev, [worker.user_id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === worker.user_id}
                  onClick={() =>
                    void run(
                      worker.user_id,
                      async () => {
                        const raw = (fees[worker.user_id] || '').trim();
                        const amount = raw ? Number(raw) : 0;
                        if (raw && !Number.isFinite(amount)) throw new Error('Enter a number');
                        const { error } = await supabase.rpc('admin_set_job_change_fee', {
                          p_user_id: worker.user_id,
                          p_amount: amount,
                        });
                        if (error) throw new Error(error.message);
                      },
                      'Extra amount saved',
                    )
                  }
                >
                  Save amount
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={worker.job_switch_blocked}
                  disabled={busy === `block-${worker.user_id}`}
                  onCheckedChange={(checked) =>
                    void run(
                      `block-${worker.user_id}`,
                      async () => {
                        const { error } = await supabase.rpc('admin_set_worker_job_switch_blocked', {
                          p_user_id: worker.user_id,
                          p_blocked: checked,
                        });
                        if (error) throw new Error(error.message);
                      },
                      checked ? 'Job switch blocked for this worker' : 'Job switch allowed for this worker',
                    )
                  }
                />
                <span className="text-sm">{worker.job_switch_blocked ? 'Blocked' : 'Can switch'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">History</p>
        {overview.changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No job choices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3 font-medium">Worker</th>
                  <th className="py-1 pr-3 font-medium">From</th>
                  <th className="py-1 pr-3 font-medium">To</th>
                  <th className="py-1 pr-3 font-medium">Choice</th>
                  <th className="py-1 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {overview.changes.map((change) => (
                  <tr key={change.id} className="border-t border-border/70">
                    <td className="py-2 pr-3">{change.worker_name}</td>
                    <td className="py-2 pr-3">{change.from_job_title || '—'}</td>
                    <td className="py-2 pr-3">{change.to_job_title || '—'}</td>
                    <td className="py-2 pr-3">{change.change_number}</td>
                    <td className="py-2">{fmt(change.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
