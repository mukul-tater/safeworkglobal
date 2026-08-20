import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SignupJourneyPanel, {
  type SignupAudience,
  type SignupVariant,
} from '@/components/SignupJourneyPanel';

/** Split auth shell used by worker / employer / partner signup & login. */
export default function AuthSplitLayout({
  audience,
  variant = 'signup',
  activeStep = 0,
  children,
  maxWidthClassName = 'max-w-[420px]',
  cardClassName,
  centerVertically = true,
  uncarded = false,
}: {
  audience: SignupAudience;
  variant?: SignupVariant;
  activeStep?: number;
  children: ReactNode;
  maxWidthClassName?: string;
  cardClassName?: string;
  /** Center the card when it fits; disable for long lists/forms so the top stays reachable. */
  centerVertically?: boolean;
  uncarded?: boolean;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-muted/40">
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel audience={audience} variant={variant} activeStep={activeStep} />

        <main
          className={cn(
            'relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-8 md:px-8 lg:px-12',
            centerVertically ? 'justify-start sm:justify-center' : 'justify-start',
          )}
        >
          <div className={cn('mx-auto w-full', maxWidthClassName)}>
            {uncarded ? (
              children
            ) : (
              <div
                className={cn(
                  'rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7',
                  cardClassName,
                )}
              >
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
