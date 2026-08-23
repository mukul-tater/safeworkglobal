import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Store, GraduationCap, Briefcase, HeartPulse, UsersRound, ArrowRight } from 'lucide-react';
import AuthSplitLayout from '@/components/AuthSplitLayout';

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
    code: 'SRN',
    title: 'MEA Licensed RA',
    description: 'MEA-approved licensed recruitment agencies — overseas placement, visa and emigration.',
    to: '/partner/srn/login',
    accent: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    Icon: HeartPulse,
  },
  {
    code: 'CONSULTANT',
    title: 'Consultants',
    description: 'Placement consultants, recruitment partners, freelancers, NGOs and candidate mobilisers.',
    to: '/partner/consultant/login',
    accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    Icon: UsersRound,
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
    <AuthSplitLayout
      audience="partner"
      variant="continue"
      maxWidthClassName="max-w-[480px]"
      centerVertically={false}
    >
      <div className="mb-5">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
          Continue as a partner
        </h2>
        <p className="mt-1 min-w-0 break-words text-sm text-muted-foreground">
          Choose your account type. We’ll take you to the next step.
        </p>
      </div>

      <div className="grid gap-2">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.code}
            to={opt.to}
            className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 transition-all hover:border-primary/40 hover:bg-muted/50"
          >
            <div className={`shrink-0 rounded-lg p-2 ${opt.accent}`}>
              <opt.Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{opt.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <p className="pt-5 text-center text-sm text-muted-foreground">
        Need to pick a partner type first?{' '}
        <Link to="/partner/register" className="font-medium text-primary hover:underline">
          View partner types
        </Link>
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2.5 text-center text-xs text-muted-foreground">Looking for a different portal?</p>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-10 text-sm font-medium">
            <Link to="/worker/login">Worker</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 text-sm font-medium">
            <Link to="/employer/login">Employer</Link>
          </Button>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
