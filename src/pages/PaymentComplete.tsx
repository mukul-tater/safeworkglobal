import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { confirmCustomPaymentLink } from '@/lib/customAmountPayment';

export default function PaymentComplete() {
  const [params] = useSearchParams();
  const linkId = params.get('razorpay_payment_link_id') || '';
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!linkId) {
      setState('error');
      setMessage('This page opens after Razorpay sends you back.');
      return;
    }
    let cancelled = false;
    void confirmCustomPaymentLink(linkId)
      .then((result) => {
        if (cancelled) return;
        setAmount(result.amount_inr);
        setState(result.paid ? 'paid' : 'pending');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Could not confirm the payment');
      });
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  const title = state === 'paid'
    ? 'Payment received'
    : state === 'pending'
      ? 'Payment not completed yet'
      : state === 'error'
        ? 'Payment not confirmed'
        : 'Checking payment';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-xl px-4 py-16 text-center">
        {state === 'checking' ? <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" /> : null}
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        {state === 'paid' && amount != null ? (
          <p className="text-muted-foreground">₹{amount.toLocaleString('en-IN')} has been received.</p>
        ) : null}
        {state === 'pending' ? (
          <p className="text-muted-foreground">Razorpay has not marked this link as paid yet.</p>
        ) : null}
        {state === 'error' ? <p className="text-muted-foreground">{message}</p> : null}
        <Button asChild className="mt-6">
          <Link to="/payments">Back to payments</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
