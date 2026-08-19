import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Store, GraduationCap, Briefcase, ArrowRight, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const OPTIONS = [
  {
    code: 'SSVN',
    title: 'Trade Test Centre (SSVN)',
    description: 'Accept allocations, run Aadhaar KYC + practical tests, submit for SafeWork review.',
    to: '/partner/ssvn/login',
    accent: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    Icon: Building2,
  },
  {
    code: 'SEN',
    title: 'E-Mitra Partner',
    description: 'Register and manage workers from your CSC / E-Mitra centre.',
    to: '/emitra/login',
    accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Icon: Store,
  },
  {
    code: 'ITI',
    title: 'ITI Partner',
    description: 'Industrial Training Institutes — train and onboard skilled workers.',
    to: '/partner/iti/login',
    accent: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
    Icon: GraduationCap,
  },
  {
    code: 'EMPLOYER',
    title: 'Employer',
    description: 'Hire verified workers for overseas jobs.',
    to: '/employer/login',
    accent: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    Icon: Briefcase,
  },
] as const;

export default function PartnerLoginChooser() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a
            href="https://safeworkglobal.com"
            className="flex items-center gap-2 hover:opacity-80"
          >
            <img src="/safework-global-logo.png" alt="SafeWork Global" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-sm sm:text-base">SafeWork Global</span>
          </a>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Partner Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Choose your account type. Trade test centres use SSVN login — not E-Mitra.
            </p>
          </div>

          <div className="grid gap-3">
            {OPTIONS.map((opt) => (
              <Card key={opt.code} className="overflow-hidden">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`p-3 rounded-xl shrink-0 w-fit ${opt.accent}`}>
                    <opt.Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold">{opt.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                  <Button asChild className="shrink-0 gap-1.5">
                    <Link to={opt.to}>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New partner?{' '}
            <Link to="/partner/register" className="text-primary font-medium hover:underline">
              Apply here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
