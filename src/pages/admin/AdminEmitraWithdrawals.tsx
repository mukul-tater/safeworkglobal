import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmitraWithdrawals() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<null | { type: 'approve' | 'reject' | 'paid'; row: any }>(null);
  const [reason, setReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('withdrawal_requests').select('*').eq('status', tab).order('created_at', { ascending: false });
    const list = data || [];
    if (list.length) {
      const ids = list.map((r: any) => r.partner_id);
      const { data: partners } = await (supabase as any).from('partner_profiles').select('id, center_name, partner_code, owner_name').in('id', ids);
      const pm = new Map((partners || []).map((p: any) => [p.id, p]));
      list.forEach((r: any) => { r.partner = pm.get(r.partner_id); });
    }
    setRows(list); setLoading(false);
  };
  useEffect(() => { load(); }, [tab]);

  const submit = async () => {
    if (!action || !user) return;
    setActing(true);
    try {
      if (action.type === 'paid') {
        const { error } = await (supabase as any).rpc('admin_mark_withdrawal_paid', {
          p_withdrawal_id: action.row.id, p_payment_reference: paymentRef || null,
        });
        if (error) throw error;
      } else {
        const patch: any = {
          status: action.type === 'approve' ? 'approved' : 'rejected',
          processed_by: user.id, processed_at: new Date().toISOString(),
        };
        if (action.type === 'reject') patch.rejection_reason = reason;
        const { error } = await (supabase as any).from('withdrawal_requests').update(patch).eq('id', action.row.id);
        if (error) throw error;
      }
      toast.success('Done');
      setAction(null); setReason(''); setPaymentRef('');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally { setActing(false); }
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">eMitra Withdrawals</h1>
      <p className="text-sm text-muted-foreground mb-4">Review and process partner withdrawal requests.</p>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {['pending', 'approved', 'paid', 'rejected'].map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      {loading ? <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        : rows.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No requests.</Card>
        : <div className="space-y-2">{rows.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <p className="text-lg font-bold">₹{Number(r.amount).toLocaleString('en-IN')}</p>
                <p className="text-sm">{r.partner?.center_name} ({r.partner?.partner_code}) · {r.partner?.owner_name}</p>
                <p className="text-xs text-muted-foreground">A/C ••••{(r.account_number || '').slice(-4)} · {r.ifsc} · UPI: {r.upi_id || '—'}</p>
                <p className="text-xs text-muted-foreground">Requested {new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{r.status}</Badge>
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => setAction({ type: 'reject', row: r })}>Reject</Button>
                    <Button size="sm" onClick={() => setAction({ type: 'approve', row: r })}>Approve</Button>
                  </>
                )}
                {r.status === 'approved' && (
                  <Button size="sm" onClick={() => setAction({ type: 'paid', row: r })}>Mark Paid</Button>
                )}
              </div>
            </div>
          </Card>
        ))}</div>
      }
      <Dialog open={!!action} onOpenChange={o => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{action?.type} withdrawal</DialogTitle></DialogHeader>
          {action?.type === 'reject' && <div><label className="text-sm font-medium">Reason *</label><Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} /></div>}
          {action?.type === 'paid' && <div><label className="text-sm font-medium">Payment reference (UTR / transaction id)</label><Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} /></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submit} disabled={acting}>{acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}