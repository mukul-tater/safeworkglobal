import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureEmitraPartnerAccess, resolveEmitraAuthEmail } from '../lib/emitraAuth';
import EmitraLayout from '../components/EmitraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { hasValidLspSession } from '@/modules/lsp/services/lspSession';

export default function EmitraLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role, refreshRole, loading: authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const nextPath = searchParams.get('next') || '';

  const afterLoginPath = () => {
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) return nextPath;
    if (hasValidLspSession()) return '/lsp/verify';
    return '/emitra/dashboard';
  };

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (isAuthenticated && role === 'partner') {
      navigate(afterLoginPath(), { replace: true });
    }
  }, [isAuthenticated, role, navigate, authLoading, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || (isAuthenticated && (profileLoading || role === 'partner'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const authEmail = await resolveEmitraAuthEmail(email);
    if (!authEmail) {
      setError('Enter the email from your partner application, or your 10-digit mobile number.');
      setLoading(false);
      return;
    }

    const result = await login(authEmail, password);
    if (!result.success) {
      const raw = result.error || 'Login failed';
      const looksMissing = /invalid login credentials|invalid_credentials|email not confirmed/i.test(raw);
      setError(
        looksMissing
          ? `${raw} If you do not have an account yet, apply at /emitra/register.`
          : raw,
      );
      setLoading(false);
      return;
    }

    const access = await ensureEmitraPartnerAccess();
    if (!access.ok) {
      await supabase.auth.signOut();
      setError((access as { error?: string }).error || 'Access denied');
      setLoading(false);
      return;
    }

    await refreshRole();
    toast.success('Welcome back');
    navigate(afterLoginPath(), { replace: true });
    setLoading(false);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const authEmail = await resolveEmitraAuthEmail(resetEmail);
    if (!authEmail) {
      setResetError('Enter the email from your partner application, or your 10-digit mobile number.');
      return;
    }
    setResetLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }
    toast.success('If this partner email exists, a reset link has been sent.');
    setResetOpen(false);
    setResetEmail('');
  };

  return (
    <EmitraLayout
      centered
      maxWidth="md"
      title="E-Mitra Sign In"
      subtitle="Sign in to manage workers, rewards, and your CSC / E-Mitra centre."
    >
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6 md:p-8">
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="emitra-email">Email Address</Label>
              <Input
                id="emitra-email"
                type="text"
                autoComplete="username"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@email.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Email from your application, or your 10-digit registered mobile.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emitra-password">Password</Label>
              <Input
                id="emitra-password"
                type="password"
                autoComplete="current-password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In to E-Mitra Portal
            </Button>

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetError('');
                  setResetOpen(true);
                }}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border space-y-2">
            <p>
              New E-Mitra partner?{' '}
              <Link to="/emitra/register" className="text-primary font-medium hover:underline">
                Apply here
              </Link>
            </p>
            <p>
              Trade test centre (SSVN)?{' '}
              <Link to="/partner/ssvn/login" className="text-primary font-medium hover:underline">
                Use SSVN login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset partner password</DialogTitle>
            <DialogDescription>
              Enter the email from your partner application. We&apos;ll send a secure link to set a new
              password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendReset} className="space-y-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{resetError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="emitra-reset-email">Partner email</Label>
              <Input
                id="emitra-reset-email"
                type="text"
                autoComplete="username"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="partner@email.com"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </EmitraLayout>
  );
}
