import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { employerNavGroups, employerProfileMenu } from '@/config/employerNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listMySharedWorkers, type MySharedWorker } from '@/services/workerShareService';
import { Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SharedWorkers() {
  const [rows, setRows] = useState<MySharedWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRows(await listMySharedWorkers());
      } catch (e) {
        console.error(e);
        toast.error('Failed to load shared workers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer" profileMenuItems={employerProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Shared workers</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Workers SafeWork admin shared with your company — full profile, ID cards, and trade-test videos.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Share2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No workers have been shared with you yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <Card key={w.share_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{w.full_name || 'Unnamed worker'}</p>
                <p className="text-sm text-muted-foreground">
                  {[w.primary_work_type, w.current_location, w.phone].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button asChild size="sm">
                <Link to={`/shared-worker/${w.share_token}`}>
                  <Eye className="h-4 w-4 mr-1" /> Open dossier
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
