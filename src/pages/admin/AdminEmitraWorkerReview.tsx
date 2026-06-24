import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmitraWorkerReview() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: workers } = await (supabase as any).from('worker_profiles')
      .select('user_id, primary_work_type, current_location, review_status, review_rejection_reason, review_notes, source_partner_id, years_of_experience, has_passport, created_at')
      .eq('source_type', 'emitra')
      .eq('review_status', tab)
      .order('created_at', { ascending: false });
    const list = workers || [];
    if (list.length) {
      const uids = list.map((w: any) => w.user_id);
      const pids = list.map((w: any) => w.source_partner_id).filter(Boolean);
      const [{ data: profs }, { data: partners }] = await Promise.all([
        (supabase as any).from('profiles').select('id, full_name, phone, email').in('id', uids),
        (supabase as any).from('partner_profiles').select('id, center_name, partner_code').in('id', pids),
      ]);
      const pmap = new Map((profs || []).map((p: any) => [p.id, p]));
      const partmap = new Map((partners || []).map((p: any) => [p.id, p]));
      list.forEach((w: any) => { w.profile = pmap.get(w.user_id); w.partner = partmap.get(w.source_partner_id); });
    }
    setRows(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tab]);

  const submit = async () => {
    if (!selected || !action || !user) return;
    if (action === 'reject' && !reason.trim()) return toast.error('Reason required');
    setActing(true);
    try {
      const patch: any = {
        review_status: action === 'approve' ? 'approved' : 'rejected',
        review_notes: notes || null,
        review_rejection_reason: action === 'reject' ? reason : null,
      };
      const { error } = await (supabase as any).from('worker_profiles')
        .update(patch).eq('user_id', selected.user_id);
      if (error) throw error;
      await (supabase as any).from('admin_actions').insert({
        admin_id: user.id, target_type: 'worker_profile', target_id: selected.user_id,
        action: `review_${action}`, reason: reason || null,
      });
      toast.success(`Worker ${action}d`);
      setSelected(null); setAction(null); setReason(''); setNotes('');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally { setActing(false); }
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">eMitra Worker Review</h1>
      <p className="text-sm text-muted-foreground mb-4">Approve or reject workers onboarded by eMitra partners.</p>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No workers in this view.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(w => (
            <Card key={w.user_id} className="p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{w.profile?.full_name || 'Worker'}</h3>
                    <Badge variant="outline">{w.primary_work_type}</Badge>
                    {w.has_passport && <Badge variant="secondary">Passport</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.profile?.phone} · {w.current_location}</p>
                  <p className="text-xs text-muted-foreground">
                    Partner: {w.partner?.center_name || '—'} ({w.partner?.partner_code || '—'}) · {w.years_of_experience || 0}y exp
                  </p>
                </div>
                <div className="flex gap-2">
                  {tab === 'pending' && (
                    <>
                      <Button size="sm" variant="destructive" onClick={() => { setSelected(w); setAction('reject'); }}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => { setSelected(w); setAction('approve'); }}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {w.review_status === 'rejected' && w.review_rejection_reason && (
                <p className="text-xs text-destructive mt-2">Reason: {w.review_rejection_reason}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!action} onOpenChange={o => { if (!o) { setAction(null); setReason(''); setNotes(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{action} worker</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {action === 'reject' && (
              <div><label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} /></div>
            )}
            <div><label className="text-sm font-medium">Review Notes (optional)</label>
              <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submit} disabled={acting} variant={action === 'reject' ? 'destructive' : 'default'}>
              {acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}