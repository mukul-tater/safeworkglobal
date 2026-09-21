import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminActionItem } from '@/lib/adminActionInbox';

function formatCount(n: number) {
  return n.toLocaleString('en-IN');
}

function countClass(tone: AdminActionItem['tone']) {
  if (tone === 'urgent') return 'bg-destructive/10 text-destructive';
  if (tone === 'warn') return 'bg-warning/10 text-warning';
  return 'bg-primary/10 text-primary';
}

export default function AdminActionInbox({ items }: { items: AdminActionItem[] }) {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Needs your action
          </CardTitle>
          {total > 0 ? (
            <Badge className="bg-warning/10 text-warning font-normal">
              {formatCount(total)} waiting
            </Badge>
          ) : (
            <Badge className="bg-success/10 text-success font-normal">Caught up</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Open a row to approve, reject, or finish it. This list is only on the admin dashboard.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-medium">Nothing waiting right now</p>
              <p className="text-sm text-muted-foreground">
                New KYC, payments, partner applications, and reviews will show up here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.href)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <Badge className={`min-w-8 justify-center tabular-nums ${countClass(item.tone)}`}>
                  {formatCount(item.count)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Open</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
