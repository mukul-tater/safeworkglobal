import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import ApprovedPartnerGate, { useApprovedPartner } from '../components/ApprovedPartnerGate';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';

const STATUS_VARIANT: Record<string, any> = {
  pending: 'secondary', approved: 'default', paid: 'default', rejected: 'destructive',
};

function Inner() {
  const { partnerId } = useApprovedPartner();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) return;
    (supabase as any).from('withdrawal_requests').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).then(({ data }: any) => {
      setRows(data || []); setLoading(false);
    });
  }, [partnerId]);

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <h1 className="text-2xl font-bold mb-1">Withdrawal Requests</h1>
      <p className="text-sm text-muted-foreground mb-4">Track the status of your withdrawal requests.</p>
      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No withdrawal requests yet.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="text-lg font-bold">₹{Number(r.amount).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">Requested {new Date(r.created_at).toLocaleString()}</p>
                  {r.paid_at && <p className="text-xs text-muted-foreground">Paid {new Date(r.paid_at).toLocaleString()} · Ref: {r.payment_reference || '—'}</p>}
                  {r.rejection_reason && <p className="text-xs text-destructive mt-1">Rejected: {r.rejection_reason}</p>}
                </div>
                <Badge variant={STATUS_VARIANT[r.status] || 'outline'}>{r.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EmitraWithdrawalsPage() {
  return <ApprovedPartnerGate><Inner /></ApprovedPartnerGate>;
}