import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { createCustomPaymentLink } from '@/lib/customAmountPayment';
import { rememberPaymentsReturn } from '@/modules/worker-verification/lib/pendingJourneyJob';

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  short_url: string | null;
  created_at: string;
};

function wholeRupees(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isInteger(amount) || amount < 1 || amount > 500000) return null;
  return amount;
}

export default function CustomAmountPay() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setRows([]);
      return;
    }
    let cancelled = false;
    void (supabase as any)
      .from('custom_amount_payments')
      .select('id, amount, status, short_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }: { data: PaymentRow[] | null }) => {
        if (!cancelled && Array.isArray(data)) setRows(data);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const pay = async () => {
    const rupees = wholeRupees(amount);
    if (!rupees) {
      toast.error('Enter a whole rupee amount from 1 to 5,00,000');
      return;
    }
    if (!isAuthenticated) {
      rememberPaymentsReturn();
      navigate('/worker/login');
      return;
    }
    setBusy(true);
    try {
      const link = await createCustomPaymentLink(rupees);
      if (!link.short_url) throw new Error('Razorpay did not return a payment link');
      window.location.assign(link.short_url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start payment');
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay a specific amount</CardTitle>
        <CardDescription>
          Enter the amount in rupees. Razorpay opens a payment link for that exact amount.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-pay-amount">Amount (₹)</Label>
          <Input
            id="custom-pay-amount"
            inputMode="numeric"
            placeholder="1000"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
        <Button type="button" onClick={() => void pay()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isAuthenticated ? 'Pay with Razorpay' : 'Sign in to pay'}
        </Button>
        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            You will come back to <Link to="/payments" className="underline">Payments</Link> after signing in.
          </p>
        ) : null}
        {rows.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span>₹{Number(row.amount).toLocaleString('en-IN')}</span>
                <span className="text-muted-foreground">{row.status === 'paid' ? 'Paid' : 'Pending'}</span>
                {row.status !== 'paid' && row.short_url ? (
                  <a href={row.short_url} className="text-primary underline">Open link</a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
