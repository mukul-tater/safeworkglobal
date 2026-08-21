import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  workerAuthEmailFromIdentifier,
} from '@/lib/workerAuthEmail';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '@/lib/workerPortalAccess';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';
import TermsAgreeRow from '@/components/TermsAgreeRow';
import WorkerTermsDialog from '@/components/WorkerTermsDialog';
import SignupJourneyPanel from '@/components/SignupJourneyPanel';
import GoogleAuthButton from '@/modules/worker-registration/components/GoogleAuthButton';
import LoadingSpinner from '@/components/LoadingSpinner';

type LoginMethod = 'mobile' | 'email';

async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  // Resolved locally only: a public lookup RPC would let anyone enumerate
  // which emails/phone numbers are registered accounts.
  return workerAuthEmailFromIdentifier(trimmed);
}

/**
 * Worker sign-in — Mobile or Email + password + terms acceptance.
 */
export default function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isMobileVerified, profileLoading, loading: authLoading } = useAuth();
  const [method, setMethod] = useState<LoginMethod>('mobile');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (isAuthenticated && role === 'worker') {
      navigate(isMobileVerified ? '/worker/dashboard' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, authLoading, navigate]);

  if (authLoading || (isAuthenticated && (profileLoading || role === 'worker'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <LoadingSpinner size="lg" text="Signing you in..." />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('Please agree to the terms and declarations to continue');
      return;
    }

    let authEmail = '';
    if (method === 'mobile') {
      if (!isValidIndianMobile(mobile)) {
        setError('Enter a valid 10-digit Indian mobile number');
        return;
      }
      const resolved = await resolveAuthEmail(mobile);
      if (!resolved) {
        setError('No worker account found for this mobile number');
        return;
      }
      authEmail = resolved;
    } else {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError('Please enter a valid email');
        return;
      }
      const resolved = await resolveAuthEmail(email.trim());
      if (!resolved) {
        setError('No worker account found for this email');
        return;
      }
      authEmail = resolved;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

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
    <div className="fixed inset-0 overflow-hidden bg-muted/40">
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel variant="login" />

        <main className="relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-5 sm:justify-center sm:px-8 md:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              <div className="mb-5">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  Sign in to continue
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with Google, or use mobile / email and your password.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-4 space-y-3">
                <GoogleAuthButton label="Sign in with Google" role="worker" />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or continue with mobile / email</span>
                  </div>
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Sign-in method"
                className="mb-4 grid h-11 w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'mobile'}
                  data-inline
                  onClick={() => {
                    setMethod('mobile');
                    setError('');
                  }}
                  className={`inline-flex h-full min-h-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                    method === 'mobile'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" /> Mobile
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'email'}
                  data-inline
                  onClick={() => {
                    setMethod('email');
                    setError('');
                  }}
                  className={`inline-flex h-full min-h-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                    method === 'email'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {method === 'mobile' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="worker-mobile">Mobile number</Label>
                    <div className="flex h-11 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="inline-flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        +91
                      </span>
                      <Input
                        id="worker-mobile"
                        type="tel"
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className="h-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="worker-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="worker-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="worker-password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="worker-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      data-inline
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <TermsAgreeRow
                  id="worker-login-terms"
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                  onOpenTerms={() => setTermsOpen(true)}
                />

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                  disabled={loading || !acceptedTerms}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                New worker?{' '}
                <Link to="/worker/quick-signup" className="font-medium text-primary hover:underline">
                  Create your profile
                </Link>
              </p>

              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2.5 text-center text-xs text-muted-foreground">
                  Looking for a different portal?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-10 text-sm font-medium">
                    <Link to="/employer/login">Employer sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-10 text-sm font-medium">
                    <Link to="/partner/login">Partner sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <WorkerTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAgree={() => setAcceptedTerms(true)}
        description="Please review these terms before signing in."
      />
    </div>
  );
}
