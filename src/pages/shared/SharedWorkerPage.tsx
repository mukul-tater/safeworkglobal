import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PartnerLayout from '@/modules/partner/layout/PartnerLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { employerNavGroups, employerProfileMenu } from '@/config/employerNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import WorkerDossierView from '@/components/worker/WorkerDossierView';
import {
  consumeShareReturnPath,
  getWorkerShareByToken,
  loadWorkerDossier,
  rememberShareReturnPath,
  type WorkerDossier,
  type WorkerShareAccess,
} from '@/services/workerShareService';
import { Loader2, Share2 } from 'lucide-react';

export default function SharedWorkerPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, role, loading: authLoading, profileLoading } = useAuth();
  const [access, setAccess] = useState<WorkerShareAccess | null>(null);
  const [dossier, setDossier] = useState<WorkerDossier | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const path = token ? `/shared-worker/${token}` : '';
  const employerLogin = `/employer/login?next=${encodeURIComponent(path)}`;
  const raLogin = `/partner/srn/login?next=${encodeURIComponent(path)}`;

  useEffect(() => {
    if (path) rememberShareReturnPath(path);
  }, [path]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!token) {
      setError('Share link is invalid');
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const share = await getWorkerShareByToken(token);
        const data = await loadWorkerDossier(share.worker_id);
        if (cancelled) return;
        setAccess(share);
        setDossier(data);
        consumeShareReturnPath();
      } catch (e) {
        if (cancelled) return;
        setAccess(null);
        setDossier(null);
        setError(e instanceof Error ? e.message : 'Could not open this worker profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, profileLoading, isAuthenticated, token]);

  const loginCard = (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Shared worker profile</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {error || 'Sign in as the employer or MEA licensed RA this profile was shared with to view ID cards, videos, and trade-test details.'}
          </p>
          <div className="grid gap-2">
            <Button asChild>
              <Link to={employerLogin} onClick={() => path && rememberShareReturnPath(path)}>Employer sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={raLogin} onClick={() => path && rememberShareReturnPath(path)}>RA sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !dossier || !access) {
    return loginCard;
  }

  const body = (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Shared worker dossier</p>
        <h1 className="text-2xl font-bold">{access.worker_name}</h1>
        <p className="text-sm text-muted-foreground">Shared with {access.recipient_name}</p>
      </div>
      <WorkerDossierView dossier={dossier} />
    </div>
  );

  if (role === 'admin') {
    return (
      <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
        {body}
      </DashboardLayout>
    );
  }

  if (role === 'employer') {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer" profileMenuItems={employerProfileMenu}>
        {body}
      </DashboardLayout>
    );
  }

  if (role === 'partner') {
    return <PartnerLayout>{body}</PartnerLayout>;
  }

  return loginCard;
}
