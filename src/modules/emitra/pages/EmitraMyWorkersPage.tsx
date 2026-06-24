import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Loader2, UserPlus, Users } from 'lucide-react';
import ApprovedPartnerGate, { useApprovedPartner } from '../components/ApprovedPartnerGate';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';

type WorkerRow = {
  user_id: string; primary_work_type: string | null; current_location: string | null;
  review_status: string; review_rejection_reason: string | null; review_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null } | null;
  reward?: { status: string; amount: number } | null;
  hired?: boolean;
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'placed', label: 'Placed' },
  { key: 'rewarded', label: 'Reward Earned' },
];

function reviewBadge(s: string) {
  if (s === 'approved') return <Badge variant="default">Approved</Badge>;
  if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  if (s === 'pending') return <Badge variant="secondary">Pending Review</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

function Inner() {
  const { partnerId } = useApprovedPartner();
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!partnerId) return;
    (async () => {
      setLoading(true);
      const { data: workers } = await (supabase as any).rpc('partner_list_my_workers');
      const list: WorkerRow[] = (workers || [])
        .slice()
        .sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      if (list.length) {
        const ids = list.map(w => w.user_id);
        const { data: profiles } = await (supabase as any).from('profiles')
          .select('id, full_name, phone').in('id', ids);
        const { data: apps } = await (supabase as any).from('job_applications')
          .select('worker_id, status').in('worker_id', ids).eq('status', 'HIRED');
        const { data: rewards } = await (supabase as any).from('reward_transactions')
          .select('worker_id, status, amount').eq('partner_id', partnerId);
        const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const hiredSet = new Set((apps || []).map((a: any) => a.worker_id));
        const rmap = new Map((rewards || []).map((r: any) => [r.worker_id, r]));
        list.forEach(w => {
          w.profile = pmap.get(w.user_id) as any;
          w.hired = hiredSet.has(w.user_id);
          w.reward = rmap.get(w.user_id) as any;
        });
      }
      setRows(list);
      setLoading(false);
    })();
  }, [partnerId]);

  const filtered = rows.filter(w => {
    if (tab === 'all') return true;
    if (tab === 'placed') return w.hired;
    if (tab === 'rewarded') return !!w.reward;
    return w.review_status === tab;
  });

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">My Workers</h1>
          <p className="text-sm text-muted-foreground">Workers you onboarded through eMitra</p>
        </div>
        <Button asChild><Link to="/emitra/onboard-worker"><UserPlus className="h-4 w-4 mr-1" /> Onboard Worker</Link></Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="flex flex-wrap h-auto">
          {STATUS_TABS.map(t => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No workers in this view.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <Card key={w.user_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{w.profile?.full_name || 'Worker'}</h3>
                    {reviewBadge(w.review_status)}
                    {w.hired && <Badge variant="default">Placed</Badge>}
                    {w.reward && <Badge variant="secondary">₹{Number(w.reward.amount).toLocaleString('en-IN')} {w.reward.status}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.profile?.phone} · {w.primary_work_type} · {w.current_location}</p>
                  <p className="text-xs text-muted-foreground">Registered {new Date(w.created_at).toLocaleDateString()}</p>
                  {w.review_status === 'rejected' && w.review_rejection_reason && (
                    <div className="mt-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded p-2">
                      <p className="font-medium">Reason: {w.review_rejection_reason}</p>
                      {w.review_notes && <p className="opacity-80 mt-0.5">{w.review_notes}</p>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EmitraMyWorkersPage() {
  return <ApprovedPartnerGate><Inner /></ApprovedPartnerGate>;
}