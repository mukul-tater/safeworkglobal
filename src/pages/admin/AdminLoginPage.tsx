import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureAdminAccess, isWhitelistedAdminEmail } from '@/lib/adminAuth';
import AdminLayout from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, refreshRole, loading: authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (isAuthenticated && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate, authLoading, profileLoading]);

  if (authLoading || (isAuthenticated && (profileLoading || role === 'admin'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email.trim(), password);
    if (!result.success) {
      const raw = result.error || 'Login failed';
      const looksMissing =
        /invalid login credentials|invalid_credentials|email not confirmed/i.test(raw);
      setError(
        looksMissing
          ? `${raw} If this is the first admin login, create the account at /admin/register (whitelisted emails only), or run scripts/ensure-demo-admin.sql in Supabase.`
          : raw,
      );
      setLoading(false);
      return;
    }

    const access = await ensureAdminAccess();
    if (!access.ok) {
      await supabase.auth.signOut();
      setError((access as { ok: false; error: string }).error);
      setLoading(false);
      return;
    }

    await refreshRole();
    toast.success('Welcome back');
    navigate('/admin/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <AdminLayout
      centered
      maxWidth="md"
      title="Admin Sign In"
      subtitle="Sign in to manage workers, employers, partners, jobs, and platform operations."
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
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@safeworkglobal.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <ForgotPasswordControl
                  loginPath="/admin/login"
                  initialIdentifier={email}
                  title="Reset admin password"
                  description="Enter your approved admin email. We'll send a secure link to set a new password. Reset links only work for whitelisted SafeWork Global admin accounts."
                  identifierLabel="Admin email"
                  identifierPlaceholder="admin@safeworkglobal.com"
                  triggerClassName="text-sm"
                  resolveAuthEmail={async (raw) => {
                    const normalized = raw.trim().toLowerCase();
                    if (!isWhitelistedAdminEmail(normalized)) {
                      throw new Error('Password reset is only available for approved admin emails.');
                    }
                    return normalized;
                  }}
                />
              </div>
              <Input
                id="admin-password"
                type="password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In to Admin Portal
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
            Need an admin account?{' '}
            <Link to="/admin/register" className="text-primary font-medium hover:underline">
              Create admin account
            </Link>
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
