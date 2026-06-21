import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

/** Demo seeding disabled after Phase 0 platform reset. Use scripts/phase0-reset-platform-data.sql instead. */
export default function SeedDataButton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Seeding Disabled
        </CardTitle>
        <CardDescription>
          Test data seeding was removed as part of the Phase 0 platform reset.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTitle>Platform reset</AlertTitle>
          <AlertDescription>
            To wipe jobs, users, and test records while keeping only the three admin accounts, run{' '}
            <code className="text-xs">scripts/phase0-reset-platform-data.sql</code> in the Supabase SQL
            Editor, or use <code className="text-xs">npm run reset:phase0</code> with{' '}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> set.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
