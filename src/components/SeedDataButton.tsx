import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Re-seeds the officials-demo dataset:
 * 30 workers, 12 employers across 7 countries (native currencies),
 * 4 eMitra partners, 24 live jobs, ~45 applications including HIRED.
 *
 * Idempotent: wipes prior `demo+*` users first.
 * Admin-only — enforced by the RPC.
 */
export default function SeedDataButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    const { data, error } = await (supabase as any).rpc('seed_officials_demo');
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Seed failed');
      return;
    }
    setResult(data as Record<string, number>);
    toast.success('Demo dataset re-seeded');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Officials-Demo Dataset
        </CardTitle>
        <CardDescription>
          Re-seeds a realistic demo: 30 workers across Indian states, 12 employers across 7 GCC + SE-Asia
          countries (native currencies — no fake INR conversion), 4 eMitra partners, 24 live jobs, ~45
          applications including HIRED placements that auto-credit partner placement rewards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Idempotent</AlertTitle>
          <AlertDescription>
            Re-running wipes the previous <code className="text-xs">demo+*@safeworkglobal.demo</code>{' '}
            users (and everything linked to them via FK cascade) before re-inserting. Admin only.
          </AlertDescription>
        </Alert>

        <Button onClick={run} disabled={loading} size="lg" className="w-full">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Seeding…</>
          ) : (
            <>Reset & seed officials demo</>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div>Workers: <strong>{result.workers}</strong></div>
                <div>Employers: <strong>{result.employers}</strong></div>
                <div>Jobs: <strong>{result.jobs}</strong></div>
                <div>Partners: <strong>{result.partners}</strong></div>
                <div>Applications: <strong>{result.applications}</strong></div>
                <div>Hired (approx): <strong>{result.hired_estimate}</strong></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                All demo users share password <code>Demo@1234</code>.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
