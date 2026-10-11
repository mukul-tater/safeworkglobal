import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getJobOffer,
  offerLetterSignedUrl,
  uploadJobOfferLetter,
  type JobOfferLetter,
} from '@/modules/worker-verification/services/offerLetterService';

interface Props {
  userId: string;
  jobId?: string | null;
  onChanged?: () => void;
}

function statusLine(letter: JobOfferLetter | null): string {
  if (!letter?.id) return 'No PDF uploaded yet.';
  if (letter.status === 'accepted') return `Accepted${letter.accepted_at ? ` ${new Date(letter.accepted_at).toLocaleString('en-IN')}` : ''}.`;
  if (letter.status === 'declined') return 'Worker declined this file. A new PDF can replace it.';
  if (letter.downloaded_version === letter.version) return 'Downloaded. Waiting for OTP acceptance.';
  return 'Uploaded. Worker has not downloaded this version yet.';
}

export default function JobOfferLetterUpload({ userId, jobId, onChanged }: Props) {
  const [letter, setLetter] = useState<JobOfferLetter | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getJobOffer(userId);
        if (!cancelled) setLetter(next);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Could not load the offer letter');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const locked = Boolean(letter?.payment_taken);
  const targetJob = letter?.job_id || jobId;

  const onUpload = async () => {
    if (!file || !targetJob) {
      toast.error('Choose a PDF for this worker’s current job');
      return;
    }
    setBusy(true);
    try {
      const next = await uploadJobOfferLetter(userId, targetJob, file);
      setLetter(next);
      setFile(null);
      toast.success(letter?.id ? 'Offer letter replaced' : 'Offer letter uploaded');
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onPreview = async () => {
    if (!letter?.storage_path) return;
    setBusy(true);
    try {
      const url = await offerLetterSignedUrl(letter.storage_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open the PDF');
    } finally {
      setBusy(false);
    }
  };

  if (!targetJob) {
    return <p className="text-xs text-amber-700">This worker has no current job, so an offer letter cannot be uploaded.</p>;
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold">Offer letter{letter?.job_title ? ` · ${letter.job_title}` : ''}</p>
      <p className="text-xs text-muted-foreground">{statusLine(letter)}</p>
      {letter?.file_name && (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onPreview()}>
          Open current PDF
        </Button>
      )}
      {locked ? (
        <p className="text-xs text-muted-foreground">Payment was already taken, so this letter cannot be replaced.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="file"
            accept="application/pdf,.pdf"
            className="max-w-xs"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button type="button" size="sm" disabled={busy || !file} onClick={() => void onUpload()}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {letter?.id ? 'Replace PDF' : 'Upload PDF'}
          </Button>
        </div>
      )}
      {!locked && letter?.status === 'accepted' && (
        <p className="text-xs text-amber-700">
          Replacing this file voids the acceptance. The worker must download and accept the new PDF before paying.
        </p>
      )}
    </div>
  );
}
