import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, IndianRupee, Users, Store, Wallet } from 'lucide-react';
import { toast } from 'sonner';

function inr(n: number) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

export default function AdminEmitraAnalytics() {
  const [loading, setLoading] = useState(true);
  const [m, setM] = useState<any>({});
  const [reward, setReward] = useState('1000');
  const [savingCfg, setSavingCfg] = useState(false);

  const load = async () => {
    setLoading(true);
    const sb: any = supabase;
    const [partners, workers, rewards, withdraw, cfg] = await Promise.all([
      sb.from('partner_profiles').select('status'),
      sb.from('worker_profiles').select('review_status, source_type'),
      sb.from('reward_transactions').select('amount, status'),
      sb.from('withdrawal_requests').select('amount, status'),
      sb.from('partner_reward_config').select('placement_reward_amount').eq('id', true).maybeSingle(),
    ]);
    const ps = partners.data || [];
    const ws = (workers.data || []).filter((w: any) => w.source_type === 'emitra');
    const rs = rewards.data || [];
    const wd = withdraw.data || [];
    setM({
      totalPartners: ps.length,
      pendingPartners: ps.filter((p: any) => p.status === 'applied' || p.status === 'under_review').length,
      approvedPartners: ps.filter((p: any) => p.status === 'approved' || p.status === 'active').length,
      rejectedPartners: ps.filter((p: any) => p.status === 'rejected').length,
      workersOnboarded: ws.length,
      workersPending: ws.filter((w: any) => w.review_status === 'pending').length,
      workersApproved: ws.filter((w: any) => w.review_status === 'approved').length,
      workersRejected: ws.filter((w: any) => w.review_status === 'rejected').length,
      totalRewards: rs.reduce((s: number, r: any) => s + Number(r.amount), 0),
      paidOut: wd.filter((w: any) => w.status === 'paid').reduce((s: number, r: any) => s + Number(r.amount), 0),
      pendingWithdraw: wd.filter((w: any) => w.status === 'pending').reduce((s: number, r: any) => s + Number(r.amount), 0),
      outstanding: rs.filter((r: any) => r.status === 'available').reduce((s: number, r: any) => s + Number(r.amount), 0),
    });
    if (cfg.data?.placement_reward_amount) setReward(String(cfg.data.placement_reward_amount));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveCfg = async () => {
    setSavingCfg(true);
    try {
      const { error } = await (supabase as any).from('partner_reward_config')
        .upsert({ id: true, placement_reward_amount: Number(reward), updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success('Reward updated');
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
    finally { setSavingCfg(false); }
  };

  if (loading) return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">eMitra Analytics</h1>
      <p className="text-sm text-muted-foreground mb-5">Partner, worker, and reward metrics across the eMitra network.</p>

      <Section title="Partner Metrics" icon={<Store className="h-5 w-5" />}>
        <Stat label="Total Partners" value={m.totalPartners} />
        <Stat label="Pending" value={m.pendingPartners} />
        <Stat label="Approved" value={m.approvedPartners} />
        <Stat label="Rejected" value={m.rejectedPartners} />
      </Section>
      <Section title="Worker Metrics" icon={<Users className="h-5 w-5" />}>
        <Stat label="Onboarded via eMitra" value={m.workersOnboarded} />
        <Stat label="Pending Review" value={m.workersPending} />
        <Stat label="Approved" value={m.workersApproved} />
        <Stat label="Rejected" value={m.workersRejected} />
      </Section>
      <Section title="Reward Metrics" icon={<IndianRupee className="h-5 w-5" />}>
        <Stat label="Total Generated" value={inr(m.totalRewards)} />
        <Stat label="Total Paid" value={inr(m.paidOut)} />
        <Stat label="Pending Withdrawals" value={inr(m.pendingWithdraw)} />
        <Stat label="Outstanding" value={inr(m.outstanding)} />
      </Section>

      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-3"><Wallet className="h-5 w-5" /><h2 className="font-semibold">Reward Configuration</h2></div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label>Reward per successful placement (₹)</Label>
            <Input type="number" value={reward} onChange={e => setReward(e.target.value)} className="w-48" />
          </div>
          <Button onClick={saveCfg} disabled={savingCfg}>{savingCfg && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">{icon}{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return <Card className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold mt-1">{value ?? 0}</p></Card>;
}