import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineNodeStatus = 'done' | 'current' | 'pending';

export interface TimelineNode {
  label: string;
  /** Optional secondary line, e.g. a timestamp or short detail. */
  detail?: string;
  status: TimelineNodeStatus;
}

/** Vertical timeline used on waiting screens to show what happened and what's next. */
export default function StageTimeline({ nodes }: { nodes: TimelineNode[] }) {
  return (
    <ol className="relative space-y-4 pl-1">
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        return (
          <li key={`${node.label}-${i}`} className="relative flex gap-3">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-4px)] w-px',
                  node.status === 'done' ? 'bg-success/40' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                node.status === 'done' && 'bg-success text-success-foreground',
                node.status === 'current' && 'bg-warning text-warning-foreground ring-4 ring-warning/20',
                node.status === 'pending' && 'border border-border bg-muted text-muted-foreground',
              )}
            >
              {node.status === 'done' ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : node.status === 'current' ? (
                <Clock className="h-3.5 w-3.5" />
              ) : null}
            </span>
            <div className="min-w-0 pb-1">
              <p
                className={cn(
                  'text-sm leading-tight',
                  node.status === 'pending' ? 'text-muted-foreground' : 'font-medium text-foreground',
                )}
              >
                {node.label}
              </p>
              {node.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{node.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
