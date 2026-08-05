import type { ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string;
}

interface Props {
  tone: 'success' | 'error';
  title: string;
  body: string;
  stats?: Stat[];
  children?: ReactNode;
}

/**
 * Result archetype: a decision came back (pass/fail, ready/rejected).
 * Celebratory or corrective, always with a clear next action from children.
 */
export default function StageResultShell({ tone, title, body, stats, children }: Props) {
  const Icon = tone === 'success' ? CheckCircle2 : XCircle;
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-6 text-center sm:p-8">
        <div className="flex flex-col items-center">
          <span
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full',
              tone === 'success' ? 'bg-success/15' : 'bg-destructive/10',
            )}
          >
            <Icon className={cn('h-10 w-10', tone === 'success' ? 'text-success' : 'text-destructive')} />
          </span>
          <h1 className="mt-4 text-2xl font-bold font-heading text-foreground">{title}</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
        </div>

        {stats && stats.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/30 px-2 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {children ? <div className="flex flex-col gap-2">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
