import type { ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StageTimeline, { type TimelineNode } from './StageTimeline';

interface Props {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  /** What happened / what's next. Rendered as a vertical timeline. */
  timeline?: TimelineNode[];
  /** When the worker can expect movement, e.g. "Usually within a few hours". */
  expected?: string;
  /** How the worker will be told when it changes. */
  notifyNote?: string;
  /** Action buttons (join link, recovery, etc.). */
  children?: ReactNode;
}

/**
 * Waiting archetype: staff or a system owes the next move.
 * Gives waiting a real destination instead of an empty card.
 */
export default function StageWaitingShell({
  icon: Icon,
  title,
  body,
  timeline,
  expected,
  notifyNote,
  children,
}: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-warning/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-warning/10" aria-hidden />
            <Icon className="h-7 w-7 text-warning" />
          </span>
          <h2 className="mt-3 text-lg font-semibold font-heading text-foreground">{title}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
          {expected ? (
            <p className="mt-2 text-xs font-medium text-warning">{expected}</p>
          ) : null}
        </div>

        {timeline && timeline.length > 0 ? (
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <StageTimeline nodes={timeline} />
          </div>
        ) : null}

        {notifyNote ? (
          <div className="flex items-start gap-2 rounded-xl border border-info/25 bg-info/5 px-3 py-2.5 text-xs text-foreground">
            <span aria-hidden className="mt-0.5 text-info">•</span>
            <span>{notifyNote}</span>
          </div>
        ) : null}

        {children ? <div className="flex flex-col gap-2">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
