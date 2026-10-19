import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import SEOHead from '@/components/SEOHead';
import CustomAmountPay from '@/components/payments/CustomAmountPay';

export default function Payments() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Payments | SafeWork Global"
        description="Pay a specific amount to SafeWork Global with a Razorpay payment link."
      />
      <Header />
      <main className="container mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Payments</h1>
        <p className="mb-6 text-muted-foreground">
          Pay the amount you were asked for. The Razorpay link charges that amount and nothing else.
        </p>
        <CustomAmountPay />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
