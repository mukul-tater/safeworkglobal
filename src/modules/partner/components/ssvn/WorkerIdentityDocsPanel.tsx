import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAuditTs } from '@/modules/trade-test/constants';
import type { WorkerIdentityPack } from '@/modules/trade-test/types';

function last4(value: string | null | undefined): string | null {
  const trimmed = (value || '').replace(/\s/g, '');
  if (trimmed.length < 4) return null;
  return trimmed.slice(-4);
}

function maskedValue(value: string | null | undefined, emptyLabel: string): string {
  const digits = last4(value);
  return digits ? `XXXX ${digits}` : emptyLabel;
}

export default function WorkerIdentityDocsPanel({
  pack,
  loading,
  preReviewedAt,
  onMarkReviewed,
  saving,
}: {
  pack: WorkerIdentityPack | null;
  loading?: boolean;
  preReviewedAt?: string | null;
  onMarkReviewed?: () => void;
  saving?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading worker identity status…</p>;
  }

  const aadhaarOnFile = Boolean(pack?.aadhaar_last4) || Boolean(
    pack?.documents.some((d) => d.document_type.startsWith('aadhaar') || d.document_type === 'id_proof'),
  );
  const panOnFile = Boolean(pack?.pan_number) || Boolean(pack?.documents.some((d) => d.document_type === 'pan'));
  const passportOnFile = Boolean(pack?.has_passport || pack?.passport_number) || Boolean(
    pack?.documents.some((d) => d.document_type.startsWith('passport')),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Only the last 4 characters are shown. Check original Aadhaar in person when the worker
        arrives. Do not store copies on this portal.
      </p>
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Aadhaar (last 4)</div>
          <div className="font-medium font-mono tracking-wide">
            {maskedValue(pack?.aadhaar_last4, aadhaarOnFile ? 'On file' : 'Not uploaded')}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">PAN (last 4)</div>
          <div className="font-medium font-mono tracking-wide">
            {maskedValue(pack?.pan_number, panOnFile ? 'On file' : 'Not uploaded')}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Passport (last 4)</div>
          <div className="font-medium font-mono tracking-wide">
            {maskedValue(pack?.passport_number, passportOnFile ? 'On file' : 'Not uploaded')}
          </div>
        </div>
      </div>

      {!aadhaarOnFile ? (
        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          Aadhaar is not on file. Ask the worker to upload Aadhaar in their journey. Do not collect
          or store Aadhaar copies on this portal.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {preReviewedAt ? (
          <Badge variant="outline">Arrival check noted {formatAuditTs(preReviewedAt)}</Badge>
        ) : onMarkReviewed ? (
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onMarkReviewed}>
            Confirm I will check original Aadhaar at arrival
          </Button>
        ) : null}
      </div>
    </div>
  );
}
