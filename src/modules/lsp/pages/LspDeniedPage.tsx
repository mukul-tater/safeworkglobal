import { Link, useSearchParams } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LSP_DENY_REASONS } from '../types/lsp.types';

export default function LspDeniedPage() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'missing_params';
  const message = LSP_DENY_REASONS[reason] || 'Access denied. Open SafeWork from your LSP portal.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md w-full border-border/60 shadow-lg">
        <CardContent className="p-8 space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">LSP entry blocked</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground font-mono">reason: {reason}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild>
              <Link to="/emitra/login">Partner login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
