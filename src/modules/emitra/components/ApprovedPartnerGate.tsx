import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';

type PartnerStatus = 'applied' | 'under_review' | 'approved' | 'active' | 'suspended' | 'rejected';

export function useApprovedPartner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<PartnerStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('partner_profiles')
      .select('id, status, rejection_reason')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setPartnerId(data?.id ?? null);
        setStatus(data?.status ?? null);
        setLoading(false);
      });
  }, [user]);

  const isApproved = status === 'approved' || status === 'active';
  return { loading, partnerId, status, isApproved };
}

export default function ApprovedPartnerGate({ children }: { children: ReactNode }) {
  const { loading, status, isApproved } = useApprovedPartner();

  if (loading) {
    return (
      <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      </DashboardLayout>
    );
  }

  if (isApproved) return <>{children}</>;

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <Card className="p-10 text-center max-w-xl mx-auto">
        {status === 'rejected' ? (
          <>
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Application Rejected</h2>
            <p className="text-sm text-muted-foreground">Your partner application was rejected. Please contact support for next steps.</p>
          </>
        ) : status === 'suspended' ? (
          <>
            <ShieldAlert className="h-12 w-12 text-warning mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Account Suspended</h2>
            <p className="text-sm text-muted-foreground">Your partner account is currently suspended. Contact support for reinstatement.</p>
          </>
        ) : (
          <>
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Pending Admin Approval</h2>
            <p className="text-sm text-muted-foreground">Your partner application is under review. You'll be notified once approved and can then onboard workers.</p>
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}