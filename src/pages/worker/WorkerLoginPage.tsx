import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, HardHat, Lock, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isValidIndianMobile } from '@/lib/validations/common';
import { workerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '@/lib/workerPortalAccess';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';

export default function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isMobileVerified, profileLoading } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileLoading) return;
    if (isAuthenticated && role === 'worker') {
      navigate(isMobileVerified ? '/worker/dashboard' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidIndianMobile(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    const authEmail = workerAuthEmailFromMobile(mobile);

    setLoading(true);
    const result = await login(authEmail, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (roleRow?.role && roleRow.role !== 'worker') {
        await supabase.auth.signOut();
        setError(
          `This account is registered as a ${roleRow.role}. Please sign in from the correct portal.`,
        );
        setLoading(false);
        return;
      }

      const reviewBlock = await getEmitraReviewBlockMessage(user.id);
      if (reviewBlock) {
        await supabase.auth.signOut();
        setError(reviewBlock);
        setLoading(false);
        return;
      }

      const ready = await isWorkerGccReady(user.id);
      if (!ready) {
        try {
          await getOrCreateVerification(user.id);
        } catch {
          /* journey row optional for redirect */
        }
        toast.success('Welcome back — continue your verification');
        navigate('/worker/journey', { replace: true });
        setLoading(false);
        return;
      }
    }
    toast.success('Welcome back!');
    navigate('/worker/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-mesh)' }} />
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-4">
            <HardHat className="h-7 w-7 text-success" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Worker Login</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with the mobile number and password from signup.
          </p>
        </div>

        <div className="mb-4 mx-auto w-fit flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <HardHat className="h-3.5 w-3.5" />
          Signing in as a Worker
        </div>

        <Card className="shadow-lg border-border/60 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-success via-success/80 to-primary" />
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="worker-mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="worker-mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className="h-11 pl-10"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="worker-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="worker-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              New worker?{' '}
              <Link to="/worker/quick-signup" className="text-primary font-medium hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
