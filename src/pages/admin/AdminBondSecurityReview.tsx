import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatStampInr, lookupStampPaper } from '@/modules/worker-verification/bond-security/stampPaper';
import type { BondSecurityRow } from '@/modules/worker-verification/bond-security/types';
import {
  loadBondSecurity,
  markBondOriginalReceived,
  previewBondSecurityFile,
  reviewBondSecurity,
} from '@/modules/worker-verification/services/bondSecurityService';

function FileLink({ path, label }: { path?: string | null; label: string }) {
  if (!path) return <span className="text-muted-foreground">{label}: —</span>;
  return (
    <button
      type="button"
      className="text-left text-primary underline-offset-2 hover:underline"
      onClick={async () => {
        try {
          const url = await previewBondSecurityFile(path);
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

export default function AdminBondSecurityReview({
  userId,
  workerName,
  workerId,
  state,
  bondStatus,
  busy,
  onDone,
}: {
  userId: string;
  workerName?: string | null;
  workerId: string;
  state?: string | null;
  bondStatus?: string | null;
  busy: boolean;
  onDone: () => Promise<void>;
}) {
  const [pack, setPack] = useState<BondSecurityRow | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadBondSecurity(userId)
      .then((row) => {
        if (!cancelled) setPack(row);
      })
      .catch(() => {
        if (!cancelled) setPack(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stamp = pack?.applicable_stamp_value ?? lookupStampPaper(state)?.minimum_stamp_value ?? null;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await onDone();
      setPack(await loadBondSecurity(userId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid gap-1 text-xs text-muted-foreground">
        <p>Worker: <strong className="text-foreground">{workerName || '—'}</strong></p>
        <p>Worker ID: <span className="font-mono text-foreground">{workerId}</span></p>
        <p>State: <strong className="text-foreground">{pack?.confirmed_state || state || '—'}</strong></p>
        <p>
          Applicable Stamp Paper Value:{' '}
          <strong className="text-foreground">{stamp != null ? formatStampInr(Number(stamp)) : '—'}</strong>
        </p>
        <p>
          Pack status: <Badge variant="outline">{pack?.status || bondStatus || 'pending'}</Badge>
          {' · '}Courier: <Badge variant="outline">{pack?.courier_status || 'pending'}</Badge>
        </p>
      </div>

      <div className="grid gap-1 rounded-lg border border-border bg-muted/20 p-3 text-xs">
        <FileLink path={pack?.bond_file_path} label={`Bond upload (${pack?.bond_file_name || 'none'})`} />
        <p>Courier: {pack?.courier_company || '—'} · {pack?.tracking_number || 'no tracking'} · {pack?.courier_date || '—'}</p>
        <FileLink path={pack?.courier_receipt_path} label="Courier receipt" />
        <p>
          Worker cheque: {pack?.worker_cheque_holder_name || '—'} / {pack?.worker_cheque_bank_name || '—'} /{' '}
          {pack?.worker_cheque_number || '—'}
          {pack?.worker_cheque_amount != null ? ` · ₹${pack.worker_cheque_amount}` : ''}
        </p>
        <FileLink path={pack?.worker_cheque_path} label="Worker cheque image" />
        <p>
          Guarantor: {pack?.guarantor_full_name || '—'} ({pack?.guarantor_relationship || '—'}) ·{' '}
          {pack?.guarantor_mobile || '—'}
        </p>
        <p>Guarantor address: {pack?.guarantor_address || '—'}</p>
        <FileLink path={pack?.guarantor_cheque_path} label="Guarantor cheque image" />
        <p>
          Guarantor OTP:{' '}
          <strong>{pack?.guarantor_otp_verified ? `Verified ${pack.guarantor_otp_verified_at ? new Date(pack.guarantor_otp_verified_at).toLocaleString('en-IN') : ''}` : 'Not verified'}</strong>
        </p>
        {pack?.rejection_reason ? <p className="text-amber-700">Last reason: {pack.rejection_reason}</p> : null}
      </div>

      <Textarea
        rows={2}
        placeholder="Reason for rejection / resubmission (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy || pack?.status !== 'submitted'}
          onClick={() => void run(() => reviewBondSecurity(userId, 'approve'), 'Bond & security approved')}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run(() => reviewBondSecurity(userId, 'reject', reason), 'Rejected — resubmission required')}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run(() => reviewBondSecurity(userId, 'resubmission', reason), 'Resubmission requested')}
        >
          Request Resubmission
        </Button>
        <Button
          size="sm"
          disabled={busy || pack?.status !== 'approved'}
          onClick={() => void run(() => markBondOriginalReceived(userId), 'Original marked received — PDOT unlocked')}
        >
          Mark Original Received
        </Button>
      </div>
    </div>
  );
}
