import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SiteVisitStats } from '@/lib/recordSiteVisit';

function formatCount(n: number) {
  return n.toLocaleString('en-IN');
}

function weekdayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }).slice(0, 2);
}

export default function SiteTrafficCard({ stats }: { stats: SiteVisitStats }) {
  const max = Math.max(1, ...stats.series.map((d) => d.count));
  const series = stats.series.length
    ? stats.series
    : Array.from({ length: 7 }, (_, i) => ({ date: String(i), count: 0 }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-info" />
          Visitors
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Counted once per public browser session. Not shown to the public.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="mt-1 text-3xl font-bold font-heading tabular-nums tracking-tight">
              {formatCount(stats.today)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-3xl font-bold font-heading tabular-nums tracking-tight">
              {formatCount(stats.all_time)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Last 7 days</p>
          <div className="flex h-14 items-end gap-1.5">
            {series.map((day) => {
              const px = day.count > 0 ? Math.max(10, Math.round((day.count / max) * 56)) : 4;
              return (
                <div key={day.date} className="flex min-w-0 flex-1 items-end">
                  <div
                    className={`w-full rounded-sm ${day.count > 0 ? 'bg-info' : 'bg-muted'}`}
                    style={{ height: `${px}px` }}
                    title={`${day.date}: ${formatCount(day.count)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {stats.series.map((day) => (
              <span key={day.date} className="min-w-0 flex-1 text-center text-[10px] text-muted-foreground">
                {weekdayLabel(day.date)}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
