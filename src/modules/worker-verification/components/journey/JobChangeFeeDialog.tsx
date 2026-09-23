import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BANK_TRANSFER_ACCOUNT,
  BANK_TRANSFER_METHODS,
  formatInr,
  razorpayChargedAmountInr,
  type BankTransferMethod,
} from '@/modules/worker-verification/payment/bankTransfer';
import {
  payJobChangeFee,
  submitJobChangeBankTransfer,
} from '@/modules/worker-verification/services/jobJourneyService';

interface Props {
  open: boolean;
  amount: number;
  workerUserId: string;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}

export default function JobChangeFeeDialog({
  open,
  amount,
  workerUserId,
  onOpenChange,
  onPaid,
}: Props) {
  const [method, setMethod] = useState<BankTransferMethod>('upi');
  const [reference, setReference] = useState('');
  const [transferredOn, setTransferredOn] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'razorpay' | 'bank' | null>(null);
  const razorpayTotal = razorpayChargedAmountInr(amount);

  const payRazorpay = async () => {
    setBusy('razorpay');
    try {
      await payJobChangeFee({ workerUserId });
      toast.success('Extra amount received. You can change job now.');
      onPaid();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setBusy(null);
    }
  };

  const payBank = async () => {
    if (!file || !reference.trim() || !transferredOn) {
      toast.error('Add the transfer date, reference, and proof');
      return;
    }
    setBusy('bank');
    try {
      await submitJobChangeBankTransfer({
        workerUserId,
        method,
        providerRef: reference,
        amount,
        transferredOn,
        file,
      });
      toast.success('Transfer submitted. An admin will confirm it before the job can change.');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit the transfer');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Extra amount before this job change</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                An admin set <span className="font-medium text-foreground">{formatInr(amount)}</span> for
                this change. Pay it with Razorpay, or send it by bank transfer and upload the proof.
              </p>
              <p>
                Razorpay total is <span className="font-medium text-foreground">{formatInr(razorpayTotal)}</span>.
                Bank transfer is {formatInr(amount)} to {BANK_TRANSFER_ACCOUNT.beneficiary}, account{' '}
                {BANK_TRANSFER_ACCOUNT.accountNumber}, IFSC {BANK_TRANSFER_ACCOUNT.ifsc}.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Transfer method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as BankTransferMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANK_TRANSFER_METHODS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transfer date</Label>
              <Input type="date" value={transferredOn} onChange={(e) => setTransferredOn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>UTR / UPI reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Proof</Label>
            <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
          <Button type="button" variant="outline" disabled={busy !== null} onClick={() => void payBank()}>
            {busy === 'bank' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit bank proof
          </Button>
          <Button type="button" disabled={busy !== null} onClick={() => void payRazorpay()}>
            {busy === 'razorpay' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay {formatInr(razorpayTotal)}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
