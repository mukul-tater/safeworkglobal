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
import { isValidPassportNumber, normalizePassportNumber } from '@/lib/validations/passport';
import { displayableEmail } from '@/lib/workerAuthEmail';

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
  const { isAuthenticated, user, profile } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [email, setEmail] = useState('');
  const [passport, setPassport] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<PaymentRow[]>([]);

  useEffect(() => {
    setRegisteredMobile(profile?.phone || '');
    setEmail(displayableEmail(profile?.email) || '');
  }, [profile?.phone, profile?.email]);

  useEffect(() => {
    if (!user?.id) {
      setPassport('');
      return;
    }
    let cancelled = false;
    void (supabase as any)
      .from('worker_profiles')
      .select('passport_number')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: { passport_number?: string | null } | null }) => {
        if (!cancelled) setPassport(data?.passport_number || '');
      });
    return () => { cancelled = true; };
  }, [user?.id]);

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
    const normalizedMobile = registeredMobile.replace(/[\s()-]/g, '');
    if (!/^\+?\d{10,15}$/.test(normalizedMobile)) {
      toast.error('Enter your registered mobile number.');
      return;
    }
    const normalizedEmail = displayableEmail(email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error('Enter a valid email address.');
      return;
    }
    const normalizedPassport = normalizePassportNumber(passport);
    if (!isValidPassportNumber(normalizedPassport)) {
      toast.error('Enter a valid passport number (6–9 letters and digits).');
      return;
    }
    setBusy(true);
    try {
      const link = await createCustomPaymentLink(rupees, {
        registeredMobile: normalizedMobile,
        email: normalizedEmail,
        passportNumber: normalizedPassport,
      });
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
          <Label htmlFor="custom-pay-mobile">Registered mobile number</Label>
          <Input
            id="custom-pay-mobile"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={registeredMobile}
            onChange={(event) => setRegisteredMobile(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-pay-email">Email</Label>
          <Input
            id="custom-pay-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-pay-passport">Passport number</Label>
          <Input
            id="custom-pay-passport"
            autoComplete="off"
            value={passport}
            onChange={(event) => setPassport(normalizePassportNumber(event.target.value))}
          />
        </div>
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
          {isAuthenticated ? 'Pay Now' : 'Sign in to pay'}
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
