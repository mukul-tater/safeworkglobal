import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAuditTs } from '@/modules/trade-test/constants';
import type { WorkerIdentityPack } from '@/modules/trade-test/types';

function statusLabel(onFile: boolean): string {
  return onFile ? 'On file' : 'Not uploaded';
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
        SafeWork does not show Aadhaar, PAN or passport copies here. Check original Aadhaar in
        person when the worker arrives. PAN and passport can be collected after the skill test.
      </p>
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Aadhaar</div>
          <div className="font-medium">{statusLabel(aadhaarOnFile)}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">PAN</div>
          <div className="font-medium">{statusLabel(panOnFile)}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Passport</div>
          <div className="font-medium">{statusLabel(passportOnFile)}</div>
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
