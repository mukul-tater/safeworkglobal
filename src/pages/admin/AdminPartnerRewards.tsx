import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';

interface RewardConfig {
  id: string;
  placement_reward_inr: number;
  physical_test_fee_inr: number;
  active: boolean;
}

export default function AdminPartnerRewards() {
  const [config, setConfig] = useState<RewardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState('');
  const [fee, setFee] = useState('');

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
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const r = Number(reward); const f = Number(fee);
    if (!Number.isFinite(r) || r < 0) { toast.error('Invalid reward'); return; }
    if (!Number.isFinite(f) || f < 0) { toast.error('Invalid fee'); return; }
    setSaving(true);
    if (config) {
      const { error } = await (supabase as any)
        .from('partner_reward_config')
        .update({ placement_reward_amount: r, worker_fee_amount: f })
        .eq('id', config.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await (supabase as any)
        .from('partner_reward_config')
        .insert({ placement_reward_amount: r, worker_fee_amount: f });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    toast.success('Saved');
    load();
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Portal"
      portalName="SafeWork Global"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Partner Reward Configuration</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Controls the placement reward credited to E-Mitra partners and the physical test fee gating stage 3.
        </p>

        <Card>
          <CardHeader><CardTitle className="text-lg">Active Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Placement reward per worker (₹)</Label>
                  <Input type="number" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="1000" />
                </div>
                <div className="space-y-2">
                  <Label>Physical skill test fee (₹)</Label>
                  <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="35400" />
                </div>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Configuration
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}