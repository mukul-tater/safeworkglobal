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

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, refreshRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Login failed');
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

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const normalized = resetEmail.trim().toLowerCase();
    if (!isWhitelistedAdminEmail(normalized)) {
      setResetError('Password reset is only available for approved admin emails.');
      return;
    }
    setResetLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }
    toast.success('If this admin email exists, a reset link has been sent.');
    setResetOpen(false);
    setResetEmail('');
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
              <Label htmlFor="admin-password">Password</Label>
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

          <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
            Need an admin account?{' '}
            <Link to="/admin/register" className="text-primary font-medium hover:underline">
              Create admin account
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset admin password</DialogTitle>
            <DialogDescription>
              Enter your approved admin email. We'll send a secure link to set a new password.
              Reset links only work for whitelisted SafeWork Global admin accounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendReset} className="space-y-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{resetError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Admin email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@safeworkglobal.com"
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
    </AdminLayout>
  );
}
