import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, IndianRupee, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import ApprovedPartnerGate, { useApprovedPartner } from '../components/ApprovedPartnerGate';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';

function inr(n: number) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

function Inner() {
  const { partnerId } = useApprovedPartner();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!partnerId) return;
    setLoading(true);
    const [{ data: rxs }, { data: p }] = await Promise.all([
      (supabase as any).from('reward_transactions').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }),
      (supabase as any).from('partner_profiles').select('account_holder, account_number, ifsc, upi_id').eq('id', partnerId).maybeSingle(),
    ]);
    setRewards(rxs || []);
    setPartner(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, [partnerId]);

  const total = rewards.reduce((s, r) => s + Number(r.amount), 0);
  const available = rewards.filter(r => r.status === 'available').reduce((s, r) => s + Number(r.amount), 0);
  const withdrawn = rewards.filter(r => r.status === 'withdrawn').reduce((s, r) => s + Number(r.amount), 0);
  const pending = rewards.filter(r => r.status === 'pending_placement').reduce((s, r) => s + Number(r.amount), 0);

  const submitWithdrawal = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > available) return toast.error('Amount exceeds available balance');
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('withdrawal_requests').insert({
        partner_id: partnerId, amount: amt,
        account_holder: partner?.account_holder, account_number: partner?.account_number,
        ifsc: partner?.ifsc, upi_id: partner?.upi_id, status: 'pending',
      });
      if (error) throw error;
      toast.success('Withdrawal request submitted');
      setOpen(false); setAmount('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Wallet className="h-6 w-6" /> Rewards & Earnings</h1>
      <p className="text-sm text-muted-foreground mb-4">Track placement rewards and request withdrawals.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total Earned" value={inr(total)} />
        <Stat label="Available" value={inr(available)} highlight />
        <Stat label="Withdrawn" value={inr(withdrawn)} />
        <Stat label="Pending" value={inr(pending)} />
      </div>

      <div className="flex justify-end mb-3">
        <Button onClick={() => setOpen(true)} disabled={available <= 0}>
          <IndianRupee className="h-4 w-4 mr-1" /> Request Withdrawal
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : rewards.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No rewards yet. Rewards are credited when your workers are hired.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr><th className="text-left p-3">Worker</th><th className="text-left p-3">Job</th><th className="text-left p-3">Date</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {rewards.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.worker_id.slice(0, 8)}…</td>
                  <td className="p-3">{r.job_id?.slice(0, 8) || '—'}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right font-medium">{inr(r.amount)}</td>
                  <td className="p-3"><Badge variant={r.status === 'available' ? 'default' : r.status === 'withdrawn' ? 'secondary' : 'outline'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (max {inr(available)})</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
              Pays to: {partner?.account_holder || '—'} · A/C ••••{(partner?.account_number || '').slice(-4)} · {partner?.ifsc || '—'}<br/>
              UPI: {partner?.upi_id || '—'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitWithdrawal} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`p-4 ${highlight ? 'border-primary bg-primary/5' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </Card>
  );
}

export default function EmitraRewardsPage() {
  return <ApprovedPartnerGate><Inner /></ApprovedPartnerGate>;
}