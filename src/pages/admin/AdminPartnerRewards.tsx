import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { displayableEmail } from '@/lib/workerAuthEmail';

interface RewardConfig {
  id: string | boolean;
  placement_reward_amount?: number;
  placement_reward_inr?: number;
  worker_fee_amount?: number;
  physical_test_fee_inr?: number;
}

type PendingReward = {
  id: string;
  amount: number;
  partner_id: string;
  worker_id: string;
  application_id: string | null;
  created_at: string;
  partner_name?: string | null;
  worker_name?: string | null;
  worker_phone?: string | null;
};

export default function AdminPartnerRewards() {
  const [config, setConfig] = useState<RewardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState('');
  const [fee, setFee] = useState('');
  const [pending, setPending] = useState<PendingReward[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('reward_transactions')
      .select('id, amount, partner_id, worker_id, application_id, created_at')
      .eq('status', 'pending_placement')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
      setPending([]);
      return;
    }
    const list = (data || []) as PendingReward[];
    if (list.length) {
      const partnerIds = [...new Set(list.map((r) => r.partner_id))];
      const workerIds = [...new Set(list.map((r) => r.worker_id))];
      const [{ data: partners }, { data: profiles }] = await Promise.all([
        (supabase as any).from('partner_profiles').select('id, center_name, partner_code').in('id', partnerIds),
        supabase.from('profiles').select('id, full_name, phone, email').in('id', workerIds),
      ]);
      const pmap = new Map((partners || []).map((p: any) => [p.id, p]));
      const wmap = new Map((profiles || []).map((p) => [p.id, p]));
      list.forEach((r) => {
        const p = pmap.get(r.partner_id) as { center_name?: string; partner_code?: string } | undefined;
        const w = wmap.get(r.worker_id) as { full_name?: string | null; phone?: string | null; email?: string | null } | undefined;
        r.partner_name = p?.center_name || p?.partner_code || null;
        r.worker_name = w?.full_name || null;
        r.worker_phone = w?.phone || displayableEmail(w?.email) || null;
      });
    }
    setPending(list);
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('partner_reward_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) toast.error('Failed to load config');
    if (data) {
      setConfig(data as RewardConfig);
      setReward(String(data.placement_reward_amount ?? data.placement_reward_inr ?? ''));
      setFee(String(data.worker_fee_amount ?? data.physical_test_fee_inr ?? ''));
    }
    await loadPending();
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const r = Number(reward);
    const f = Number(fee);
    if (!Number.isFinite(r) || r < 0) {
      toast.error('Invalid reward');
      return;
    }
    if (!Number.isFinite(f) || f < 0) {
      toast.error('Invalid fee');
      return;
    }
    setSaving(true);
    if (config) {
      const { error } = await (supabase as any)
        .from('partner_reward_config')
        .update({ placement_reward_amount: r, worker_fee_amount: f })
        .eq('id', config.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await (supabase as any)
        .from('partner_reward_config')
        .insert({ placement_reward_amount: r, worker_fee_amount: f });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    toast.success('Saved');
    void load();
  };

  const confirmReward = async (id: string) => {
    setConfirmingId(id);
    try {
      const { error } = await (supabase as any).rpc('confirm_emitra_placement_reward', {
        p_reward_id: id,
      });
      if (error) throw error;
      toast.success('Placement reward confirmed');
      await loadPending();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Confirm failed');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Portal"
      portalName="SafeWork Global"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Partner rewards</h1>
          <p className="text-sm text-muted-foreground">
            Configure amounts and confirm placement rewards before they become withdrawable.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Placement reward per worker (₹)</Label>
                  <Input
                    type="number"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Physical skill test fee (₹)</Label>
                  <Input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="35400"
                  />
                </div>
                <Button onClick={() => void save()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save configuration
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending placement confirmations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending placement rewards.</p>
            ) : (
              pending.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.worker_name || 'Worker'}</span>
                      <Badge variant="outline">₹{Number(r.amount).toLocaleString('en-IN')}</Badge>
                      <Badge variant="secondary">pending</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Partner: {r.partner_name || r.partner_id.slice(0, 8)}
                      {r.worker_phone ? ` · ${r.worker_phone}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={confirmingId === r.id}
                    onClick={() => void confirmReward(r.id)}
                  >
                    {confirmingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirm reward'
                    )}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
