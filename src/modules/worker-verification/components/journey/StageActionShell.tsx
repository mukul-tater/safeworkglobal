import type { ComponentType, ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  /** Short time estimate, e.g. "Takes 5–7 minutes". */
  timeEstimate?: string;
  /** The form / inputs for this stage. */
  children: ReactNode;
  /** Primary + secondary actions. Rendered in a footer row. */
  footer?: ReactNode;
}

/**
 * Action archetype: the worker must do something.
 * Coral accent stripe, one clear heading, optional time estimate, and a footer for the CTA.
 */
export default function StageActionShell({
  icon: Icon,
  title,
  description,
  timeEstimate,
  children,
  footer,
}: Props) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3 border-b border-border/60 pb-4">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold font-heading leading-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-sm text-muted-foreground">{description}</div>
            ) : null}
            {timeEstimate ? (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {timeEstimate}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">{children}</div>

        {footer ? (
          <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
