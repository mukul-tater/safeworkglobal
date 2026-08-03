import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, HardHat, Lock, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  workerAuthEmailFromIdentifier,
} from '@/lib/workerAuthEmail';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '@/lib/workerPortalAccess';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';
import {
  WORKER_TERMS_FULL,
} from '@/modules/worker-verification/constants';
import TermsAgreeRow from '@/components/TermsAgreeRow';

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
  const { login, isAuthenticated, role, isMobileVerified, profileLoading } = useAuth();
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
    if (profileLoading) return;
    if (isAuthenticated && role === 'worker') {
      navigate(isMobileVerified ? '/worker/dashboard' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, navigate]);

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
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-background">
      <div className="flex min-h-dvh flex-col lg:h-full lg:flex-row">
        {/* Brand panel — side on desktop, compact header on mobile */}
        <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-success px-6 py-8 text-primary-foreground lg:w-[46%] lg:px-12 lg:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, hsl(0 0% 100% / 0.25), transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(192 95% 48% / 0.35), transparent 50%)',
            }}
          />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src="/safework-global-logo.png"
                alt=""
                className="h-9 w-9 rounded-lg bg-white/95 object-contain p-0.5"
              />
              <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">
                SafeWork Global
              </span>
            </Link>
          </div>

          <div className="relative z-10 mt-8 max-w-md lg:mt-0">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm lg:mb-6 lg:h-14 lg:w-14">
              <HardHat className="h-6 w-6 lg:h-7 lg:w-7" />
            </div>
            <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Worker sign in
            </h1>
            <p className="mt-3 text-base text-primary-foreground/90 sm:text-lg">
              Verified GCC jobs. No agent fees.
            </p>
            <ul className="mt-6 hidden space-y-2.5 text-sm text-primary-foreground/85 lg:block">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/90" />
                Mobile or email — one password
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/90" />
                Continue your verification journey anytime
              </li>
            </ul>
          </div>

          <p className="relative z-10 mt-8 hidden text-xs text-primary-foreground/70 lg:mt-0 lg:block">
            Fair recruitment for skilled workers from India to the GCC.
          </p>
        </aside>

        {/* Form panel */}
        <main className="relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:overflow-y-auto lg:px-12 lg:py-10">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-6 lg:mb-8">
              <p className="text-sm font-medium text-muted-foreground lg:hidden">Welcome back</p>
              <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Sign in to continue
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose mobile or email, then enter your password.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {method === 'mobile' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="worker-mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                className="h-11 w-full font-medium"
                disabled={loading || !acceptedTerms}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <p className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              New worker?{' '}
              <Link to="/worker/quick-signup" className="font-medium text-primary hover:underline">
                Create your profile
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Hiring workers?{' '}
              <Link to="/employer/login" className="text-primary hover:underline">
                Employer sign in
              </Link>
              {' · '}
              <Link to="/emitra/login" className="text-primary hover:underline">
                Partner sign in
              </Link>
            </p>
          </div>
        </main>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker terms &amp; declarations</DialogTitle>
            <DialogDescription>
              Please review these terms before signing in.
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
            {WORKER_TERMS_FULL}
          </pre>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTermsOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setAcceptedTerms(true);
                setTermsOpen(false);
              }}
            >
              I agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
