import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BANK_TRANSFER_METHODS,
  formatInr,
  type BankTransferPayment,
} from '@/modules/worker-verification/payment/bankTransfer';
import {
  loadLatestBankTransferPayment,
  markPaymentPaid,
  previewBankTransferProof,
  reviewBankTransferPayment,
} from '@/modules/worker-verification/services/verificationService';

function FileLink({ path, label }: { path?: string | null; label: string }) {
  if (!path) return <span className="text-muted-foreground">{label}: —</span>;
  return (
    <button
      type="button"
      className="text-left text-primary underline-offset-2 hover:underline"
      onClick={async () => {
        try {
          const url = await previewBankTransferProof(path);
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Could not open file');
        }
      }}
    >
      {label}
    </button>
  );
}

export default function AdminBankTransferReview({
  userId,
  expectedFee,
  busy,
  onDone,
}: {
  userId: string;
  expectedFee: number;
  busy: boolean;
  onDone: () => Promise<void>;
}) {
  const [row, setRow] = useState<BankTransferPayment | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const reload = async () => {
    setRow(await loadLatestBankTransferPayment(userId));
  };

  useEffect(() => {
    let cancelled = false;
    loadLatestBankTransferPayment(userId)
      .then((data) => {
        if (!cancelled) setRow(data);
      })
      .catch(() => {
        if (!cancelled) setRow(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setActing(true);
    try {
      await fn();
      toast.success(ok);
      await reload();
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  const submitted = row?.status === 'submitted';
  const methodLabel =
    BANK_TRANSFER_METHODS.find((m) => m.id === row?.transfer_method)?.label || row?.transfer_method || '—';
  const locked = busy || acting;

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Expected fee: <strong className="text-foreground tabular-nums">{formatInr(expectedFee)}</strong>
        {row?.payment_note ? (
          <>
            {' '}
            · Remark <span className="font-mono text-foreground">{row.payment_note}</span>
          </>
        ) : null}
      </p>

      {row ? (
        <div className="grid gap-1 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          <p>
            Status: <Badge variant="outline">{row.status}</Badge>
            {' · '}
            {methodLabel}
          </p>
          <p>
            UTR / UPI ref:{' '}
            <span className="font-mono text-foreground">{row.provider_ref || '—'}</span>
          </p>
          <p>
            Amount: <strong className="tabular-nums">{formatInr(Number(row.amount))}</strong>
            {row.transferred_on ? ` · Transfer date ${row.transferred_on}` : ''}
          </p>
          <FileLink path={row.proof_path} label={row.proof_file_name || 'Open receipt'} />
          {row.rejection_reason ? <p className="text-destructive">Last reason: {row.rejection_reason}</p> : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No bank transfer proof submitted yet.</p>
      )}

      {submitted && (
        <>
          <Textarea
            rows={2}
            placeholder="Reason (required if rejecting)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={locked}
              onClick={() => void run(() => reviewBankTransferPayment(userId, 'approve'), 'Bank transfer approved')}
            >
              {acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Approve transfer
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() =>
                void run(
                  () => reviewBankTransferPayment(userId, 'reject', reason),
                  'Bank transfer rejected',
                )
              }
            >
              Reject
            </Button>
          </div>
        </>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="border border-dashed"
        disabled={locked}
        onClick={() =>
          void run(
            () => markPaymentPaid(userId, expectedFee, { provider: 'admin_manual' }),
            'Payment marked paid',
          )
        }
      >
        {acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        Mark payment received without proof ({formatInr(expectedFee)})
      </Button>
    </div>
  );
}
