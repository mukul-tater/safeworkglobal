import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { displayableEmail } from '@/lib/workerAuthEmail';
import { serviceChargeGstSplit } from '@/lib/jobServiceCharge';
import InsuranceCoverageInfo from '@/components/worker/InsuranceCoverageInfo';
import { ASSESSMENT_FEE_INCLUSIONS, normalizeVerificationStage } from '@/modules/worker-verification/constants';
import type { WorkerVerification } from '@/modules/worker-verification/types';
import {
  BANK_TRANSFER_ACCOUNT,
  BANK_TRANSFER_METHODS,
  RAZORPAY_GATEWAY_FEE_PCT,
  type BankTransferMethod,
  type BankTransferPayment,
  bankTransferPaymentNote,
  formatInr,
  isBankTransferRejected,
  isBankTransferSubmitted,
  razorpayChargedAmountInr,
  razorpayGatewayFeeInr,
} from '@/modules/worker-verification/payment/bankTransfer';
import {
  loadLatestBankTransferPayment,
  payAssessmentFeeWithRazorpay,
  submitBankTransferPayment,
  syncAssessmentPaymentAfterCheckout,
  uploadBankTransferProof,
  waiveAssessmentPaymentPilot,
} from '@/modules/worker-verification/services/verificationService';

type PayMethod = 'bank' | 'razorpay';

function todayIsoDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium text-foreground break-all', mono && 'font-mono text-[13px]')}>
          {value}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          } catch {
            toast.error('Could not copy');
          }
        }}
      >
        <Copy className="h-3.5 w-3.5 mr-1" />
        Copy
      </Button>
    </div>
  );
}

export default function PaymentStage({
  assessmentFee,
  subjectId,
  payerName,
  payerEmail,
  payerContact,
  partnerKiosk,
  showDevReset,
  onPaid,
}: {
  assessmentFee: number;
  subjectId: string;
  payerName?: string | null;
  payerEmail?: string | null;
  payerContact?: string | null;
  partnerKiosk: boolean;
  showDevReset: boolean;
  onPaid: (next: WorkerVerification) => void;
}) {
  const feeSplit = serviceChargeGstSplit(assessmentFee);
  const gatewayFee = razorpayGatewayFeeInr(assessmentFee);
  const razorpayTotal = razorpayChargedAmountInr(assessmentFee);
  const paymentNote = bankTransferPaymentNote(subjectId);

  const [method, setMethod] = useState<PayMethod>('bank');
  const [ledger, setLedger] = useState<BankTransferPayment | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmRazorpay, setConfirmRazorpay] = useState(false);

  const [transferMethod, setTransferMethod] = useState<BankTransferMethod>('upi');
  const [providerRef, setProviderRef] = useState('');
  const [transferredOn, setTransferredOn] = useState(todayIsoDate());
  const [proof, setProof] = useState<File | null>(null);

  const submitted = isBankTransferSubmitted(ledger);
  const rejected = isBankTransferRejected(ledger);

  useEffect(() => {
    let cancelled = false;
    setLoadingLedger(true);
    loadLatestBankTransferPayment(subjectId)
      .then((row) => {
        if (!cancelled) setLedger(row);
      })
      .catch(() => {
        if (!cancelled) setLedger(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingLedger(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const applyPaid = (next: WorkerVerification) => {
    onPaid({
      ...next,
      stage: normalizeVerificationStage(next.stage, next.trade_test_required),
    });
  };

  const payRazorpay = async () => {
    setSaving(true);
    try {
      const next = await payAssessmentFeeWithRazorpay({
        name: payerName,
        email: displayableEmail(payerEmail),
        contact: payerContact,
        workerUserId: partnerKiosk ? subjectId : undefined,
      });
      applyPaid(next);
      toast.success(
        next.trade_test_required
          ? 'Payment successful — continue to trade test'
          : 'Payment successful — continue to medical',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      if (/cancelled/i.test(msg)) toast.message('Payment cancelled');
      else toast.error(msg);
    } finally {
      setSaving(false);
      setConfirmRazorpay(false);
    }
  };

  const submitBank = async () => {
    if (!proof) {
      toast.error('Upload a screenshot or PDF of the transfer');
      return;
    }
    setSaving(true);
    try {
      const uploaded = await uploadBankTransferProof(subjectId, proof);
      const row = await submitBankTransferPayment({
        method: transferMethod,
        providerRef,
        proofPath: uploaded.path,
        proofFileName: uploaded.fileName,
        amount: assessmentFee,
        transferredOn,
        workerUserId: partnerKiosk ? subjectId : undefined,
      });
      setLedger(row);
      setProof(null);
      toast.success('Transfer details submitted — we will verify and unlock the next step');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit transfer details');
    } finally {
      setSaving(false);
    }
  };

  const methodLabel = useMemo(() => {
    return BANK_TRANSFER_METHODS.find((m) => m.id === ledger?.transfer_method)?.label || ledger?.transfer_method;
  }, [ledger?.transfer_method]);

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3 border-b border-border/60 pb-4">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-heading leading-tight">Assessment fee</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This fee depends on your selected job. Pay the exact {formatInr(assessmentFee)} by bank transfer, or pay
              instantly with Razorpay (2.5% extra).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-3xl font-bold font-heading tabular-nums text-foreground">{formatInr(assessmentFee)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One-time all-inclusive fee for your overseas job application
          </p>
          <div className="mt-3 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-muted-foreground">Skill assessment &amp; processing</span>
              <span className="tabular-nums">{formatInr(feeSplit.base)}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="tabular-nums">{formatInr(feeSplit.gst)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatInr(assessmentFee)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold font-heading text-foreground">
            What you get in this {formatInr(assessmentFee)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">No hidden agent charges — this fee covers:</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ASSESSMENT_FEE_INCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="inline-flex items-center gap-1.5">
                  {item}
                  {item === 'Insurance' && <InsuranceCoverageInfo />}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {loadingLedger ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : submitted ? (
          <div className="space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
            <p className="font-semibold text-foreground">We are checking your bank transfer</p>
            <p className="text-sm text-muted-foreground">
              Your next step unlocks after SafeWork matches this credit in our bank account. This usually takes a few
              hours during working days.
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Method</dt>
                <dd className="font-medium">{methodLabel || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">UTR / UPI reference</dt>
                <dd className="font-mono text-[13px]">{ledger?.provider_ref || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd className="font-medium tabular-nums">{formatInr(Number(ledger?.amount || assessmentFee))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payment remark</dt>
                <dd className="font-mono text-[13px]">{ledger?.payment_note || paymentNote}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <>
            {rejected && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <p className="font-medium text-destructive">Transfer could not be verified</p>
                <p className="mt-1 text-foreground">{ledger?.rejection_reason || 'Please submit the details again.'}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  method === 'bank'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Building2 className="h-4 w-4" /> Direct bank / UPI
                  </span>
                  <Badge>Recommended</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pay the exact {formatInr(assessmentFee)}. No extra charge.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('razorpay')}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  method === 'razorpay'
                    ? 'border-warning bg-warning/10 ring-1 ring-warning/40'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4" /> Razorpay
                  </span>
                  <Badge variant="secondary">+{RAZORPAY_GATEWAY_FEE_PCT}%</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Instant unlock. You pay {formatInr(gatewayFee)} extra (total {formatInr(razorpayTotal)}).
                </p>
              </button>
            </div>
          </>
        )}

        {!loadingLedger && !submitted && method === 'bank' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold">Transfer to this account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Use UPI, IMPS, NEFT or RTGS. Put the payment remark exactly as shown so we can match your credit.
              </p>
              <div className="mt-2 divide-y divide-border/60">
                <CopyRow label="Beneficiary" value={BANK_TRANSFER_ACCOUNT.beneficiary} />
                <CopyRow label="Account number" value={BANK_TRANSFER_ACCOUNT.accountNumber} mono />
                <CopyRow label="Bank" value={BANK_TRANSFER_ACCOUNT.bankName} />
                <CopyRow label="IFSC" value={BANK_TRANSFER_ACCOUNT.ifsc} mono />
                <CopyRow label="Amount" value={String(assessmentFee)} mono />
                <CopyRow label="Payment remark" value={paymentNote} mono />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>How did you pay?</Label>
                <div className="flex flex-wrap gap-2">
                  {BANK_TRANSFER_METHODS.map((m) => (
                    <Button
                      key={m.id}
                      type="button"
                      size="sm"
                      variant={transferMethod === m.id ? 'default' : 'outline'}
                      onClick={() => setTransferMethod(m.id)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transfer-ref">UTR / UPI reference</Label>
                <Input
                  id="transfer-ref"
                  value={providerRef}
                  onChange={(e) => setProviderRef(e.target.value.toUpperCase())}
                  placeholder="e.g. 123456789012"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transfer-on">Transfer date</Label>
                <Input
                  id="transfer-on"
                  type="date"
                  value={transferredOn}
                  max={todayIsoDate()}
                  onChange={(e) => setTransferredOn(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="transfer-proof">Receipt screenshot or PDF</Label>
                <Input
                  id="transfer-proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setProof(e.target.files?.[0] || null)}
                />
                {proof ? (
                  <p className="text-xs text-muted-foreground truncate">{proof.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or PDF, up to 10 MB</p>
                )}
              </div>
            </div>

            <Button className="w-full" disabled={saving} onClick={() => void submitBank()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
              Submit transfer details
            </Button>
          </div>
        )}

        {!loadingLedger && (method === 'razorpay' || submitted) && (
          <div className="space-y-3">
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">Razorpay adds a {RAZORPAY_GATEWAY_FEE_PCT}% gateway charge</p>
              <p className="mt-1 text-foreground">
                You will pay <strong>{formatInr(gatewayFee)} extra</strong> — total{' '}
                <strong>{formatInr(razorpayTotal)}</strong> instead of {formatInr(assessmentFee)}.
                {submitted ? ' Use this only if you do not want to wait for bank verification.' : ' Use direct bank / UPI to avoid this extra charge.'}
              </p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                <ShieldCheck className="h-4 w-4" /> Instant, encrypted checkout
              </p>
              <ul className="mt-2 space-y-1 text-xs text-foreground">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Payment is encrypted and PCI-DSS compliant
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> You get an official receipt with an ID
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> UPI, card or netbanking via Razorpay
                </li>
              </ul>
            </div>
            <Button className="w-full" disabled={saving} onClick={() => setConfirmRazorpay(true)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
              Pay {formatInr(razorpayTotal)} with Razorpay
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const next = await syncAssessmentPaymentAfterCheckout();
                  applyPaid(next);
                  toast.success('Payment synced — journey unlocked');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'No completed payment found yet');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Already paid on Razorpay? Sync payment
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Never pay any agent or person.</span> All official payments happen only on
            this screen. Report anyone asking for cash to SafeWork.
          </p>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          By proceeding you agree to SafeWork Global&apos;s terms &amp; conditions.
        </p>

        {showDevReset && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full border border-dashed border-amber-500/40 text-muted-foreground"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const next = await waiveAssessmentPaymentPilot(subjectId);
                applyPaid(next);
                toast.success('Fee waived for pilot (dev)');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Could not continue');
              } finally {
                setSaving(false);
              }
            }}
          >
            Dev: continue without payment
          </Button>
        )}
      </CardContent>

      <AlertDialog open={confirmRazorpay} onOpenChange={setConfirmRazorpay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay {formatInr(razorpayTotal)} with Razorpay?</AlertDialogTitle>
            <AlertDialogDescription>
              Razorpay charges an extra {RAZORPAY_GATEWAY_FEE_PCT}% gateway fee ({formatInr(gatewayFee)}). You will pay{' '}
              {formatInr(razorpayTotal)} instead of the exact fee {formatInr(assessmentFee)}. Direct bank / UPI has no
              extra charge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void payRazorpay();
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Continue to Razorpay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
