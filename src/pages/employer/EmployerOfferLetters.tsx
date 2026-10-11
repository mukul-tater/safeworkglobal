import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { employerNavGroups, employerProfileMenu } from '@/config/employerNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import JobOfferLetterUpload from '@/components/offers/JobOfferLetterUpload';
import {
  listJobOfferQueue,
  type OfferLetterQueueRow,
} from '@/modules/worker-verification/services/offerLetterService';
import { toast } from 'sonner';
import { FileSignature } from 'lucide-react';

function letterLabel(row: OfferLetterQueueRow): string {
  if (row.letter_status === 'accepted') return 'Accepted';
  if (row.letter_status === 'declined') return 'Declined';
  if (row.file_name) return 'Waiting for acceptance';
  return 'Needs PDF';
}

export default function EmployerOfferLetters() {
  const [rows, setRows] = useState<OfferLetterQueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listJobOfferQueue());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load offer letters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout
      navGroups={employerNavGroups}
      portalLabel="Employer Portal"
      portalName="Employer"
      profileMenuItems={employerProfileMenu}
    >
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">Offer letters</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Workers who passed the video interview on your jobs. Upload one PDF each. They download it and accept it
        with an OTP before the service fee opens. You cannot mark it accepted.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <FileSignature className="mx-auto mb-3 h-8 w-8 opacity-50" />
          No workers are waiting for an offer letter on your jobs.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={`${row.user_id}-${row.job_id}`} className="grid gap-4 p-4 md:grid-cols-[240px_1fr]">
              <div className="space-y-1">
                <p className="font-semibold">{row.full_name || 'Worker'}</p>
                <p className="text-xs text-muted-foreground">{row.phone || '—'}</p>
                <p className="text-sm">{row.job_title || 'Job'}</p>
                <Badge variant="outline">{letterLabel(row)}</Badge>
              </div>
              <JobOfferLetterUpload userId={row.user_id} jobId={row.job_id} onChanged={() => void load()} />
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
