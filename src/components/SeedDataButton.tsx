import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Loader2, CheckCircle, XCircle, IndianRupee } from 'lucide-react';
import { seedService, DEMO_ACCOUNTS } from '@/services/SeedService';
import { getSeedableCategories } from '@/data/jobSeedCatalog';

export default function SeedDataButton() {
  const [loading, setLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const seedResult = await seedService.seedAllData();
      setResult(seedResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to seed data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixSalaries = async () => {
    setSalaryLoading(true);
    setResult(null);

    try {
      const fixResult = await seedService.normalizeAllJobSalaries();
      setResult(fixResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fix salaries',
      });
    } finally {
      setSalaryLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Seed Demo Data
        </CardTitle>
        <CardDescription>
          Populate the database with demo accounts and sample data for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription className="whitespace-pre-line">
                  {result.message}
                </AlertDescription>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 text-sm space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-destructive">• {error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-muted-foreground">…and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Demo Accounts:</h3>
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
            {DEMO_ACCOUNTS.map((account, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-primary">{account.role.toUpperCase()}</span>
                <span>{account.email}</span>
                <span className="text-muted-foreground">••••••••</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">What will be created:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• 5+ jobs per category across {getSeedableCategories().length} trade categories</li>
            <li>• GCC, Asia & Europe cities with varied ₹50K–₹1L/month salaries</li>
            <li>• Job skills and requirements for each posting</li>
            <li>• Worker profiles, applications, and notifications</li>
          </ul>
        </div>

        <Button
          onClick={handleSeed}
          disabled={loading || salaryLoading}
          className="w-full"
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Seeding Database...' : 'Seed Demo Data'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or fix existing jobs</span>
          </div>
        </div>

        <Button
          onClick={handleFixSalaries}
          disabled={loading || salaryLoading}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {salaryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <IndianRupee className="mr-2 h-4 w-4" />
          {salaryLoading ? 'Updating Salaries...' : 'Fix All Job Salaries (₹50K–₹1L)'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Fix Salaries updates every active job in the database to realistic ₹50K–₹1L/month bands.
          Requires admin login.
        </p>
      </CardContent>
    </Card>
  );
}
