import { ShieldCheck, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useJourneyRules } from '@/lib/journeyRules';
import {
  GCC_JOURNEY_NAV_STEPS,
  navStepForStage,
  navStepIndex,
  type VerificationStage,
} from '@/modules/worker-verification/constants';

/**
 * Context column beside the active stage: what's coming and data safety.
 * Keeps the worker oriented without crowding the task itself.
 */
export default function JourneySupportPanel({ stage }: { stage: VerificationStage }) {
  const support = useJourneyRules().copy.support;
  const currentIdx = navStepIndex(navStepForStage(stage));
  const upcoming = GCC_JOURNEY_NAV_STEPS.slice(currentIdx + 1, currentIdx + 4);

  return (
    <>
      {upcoming.length > 0 && (
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              {support.comingUp}
            </p>
            <ol className="mt-3 space-y-2.5">
              {upcoming.map((step, i) => (
                <li key={step.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {currentIdx + i + 2}
                  </span>
                  <span className="min-w-0 text-sm leading-snug text-muted-foreground">
                    {step.navLabel}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70">
        <CardContent className="p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            {support.dataSafeTitle}
          </p>
          <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
            {support.dataSafeBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
