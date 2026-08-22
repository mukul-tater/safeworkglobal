import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAuditTs } from '@/modules/trade-test/constants';
import type { WorkerIdentityPack } from '@/modules/trade-test/types';

function docLabel(type: string): string {
  const map: Record<string, string> = {
    pan: 'PAN',
    passport: 'Passport',
    passport_front: 'Passport first page',
    passport_last: 'Passport last page',
    id_proof: 'ID proof',
  };
  return map[type] || type;
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
    return <p className="text-sm text-muted-foreground">Loading worker identity documents…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review PAN and passport photos the worker uploaded. Aadhaar is last 4 digits only — check the
        original card in person. Do not scan or save the Aadhaar.
      </p>
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">PAN</div>
          <div className="font-medium">{pack?.pan_number || 'Not on file'}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Aadhaar (last 4)</div>
          <div className="font-medium">{pack?.aadhaar_last4 ? `XXXX-XXXX-${pack.aadhaar_last4}` : 'Not on file'}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Passport</div>
          <div className="font-medium">
            {pack?.passport_number || (pack?.has_passport ? 'On file' : 'Not uploaded')}
          </div>
          {pack?.passport_expiry ? (
            <div className="mt-1 text-xs text-muted-foreground">
              Expires {new Date(`${pack.passport_expiry}T00:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          ) : null}
        </div>
      </div>

      {!pack?.documents.length ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          No identity photos found. Ask the worker to upload PAN and passport in their journey before
          the trade test.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pack.documents.map((d) => (
            <figure key={d.id} className="rounded-md border overflow-hidden bg-muted/30">
              {d.preview_url ? (
                <a href={d.preview_url} target="_blank" rel="noreferrer">
                  <img
                    src={d.preview_url}
                    alt={d.document_name}
                    className="h-48 w-full object-contain bg-white"
                  />
                </a>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                  Preview unavailable
                </div>
              )}
              <figcaption className="px-3 py-2 text-xs flex items-center justify-between gap-2">
                <span className="font-medium">{docLabel(d.document_type)}</span>
                <span className="text-muted-foreground">{formatAuditTs(d.uploaded_at)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {preReviewedAt ? (
          <Badge variant="outline">Pre-arrival review {formatAuditTs(preReviewedAt)}</Badge>
        ) : onMarkReviewed ? (
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onMarkReviewed}>
            Mark documents reviewed for this centre
          </Button>
        ) : null}
      </div>
    </div>
  );
}
