import { ArrowRight, ShieldOff, Store, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Store,
    title: 'Centre signs up',
    detail: 'Account is active immediately',
  },
  {
    icon: UserPlus,
    title: 'Centre works',
    detail: 'Login and register workers',
  },
  {
    icon: ShieldOff,
    title: 'Admin can disable',
    detail: 'Turn the centre off or back on',
  },
] as const;

export default function PartnerApprovalFlow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-border bg-muted/20', compact ? 'p-4' : 'p-5 md:p-6')}>
      <p className="text-sm font-semibold text-foreground mb-1">E-Mitra centre access</p>
      <p className="text-xs text-muted-foreground mb-4">
        A new centre can use the portal as soon as they finish signup. Disable a centre to block login and adding workers. Enable it again on the same login.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex lg:flex-1 items-center gap-2 min-w-0">
              <div className="flex flex-1 min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{step.detail}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block h-4 w-4 shrink-0 text-muted-foreground/60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
