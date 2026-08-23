import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { workerAuthEmailFromIdentifier } from '@/lib/workerAuthEmail';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '@/lib/workerPortalAccess';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';
import TermsAgreeRow from '@/components/TermsAgreeRow';
import WorkerTermsDialog from '@/components/WorkerTermsDialog';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import GoogleAuthButton from '@/modules/worker-registration/components/GoogleAuthButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';
import AuthContinueIdentifier from '@/components/auth/AuthContinueIdentifier';
import AuthConflictPanel from '@/components/auth/AuthConflictPanel';
import QuickWorkerSignup from '@/pages/worker/QuickWorkerSignup';
import {
  AUTH_CONTINUE_MESSAGES,
  buildAuthContinueRequest,
  continueAuth,
  portalAuthPath,
  type AuthIdentifierMethod,
} from '@/lib/authContinue';
import { GET_STARTED_PATHS } from '@/lib/getStarted';

type Step = 'identifier' | 'login' | 'signup' | 'conflict';

async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  return workerAuthEmailFromIdentifier(trimmed);
}

/**
 * Unified worker authentication — one Continue entry for login and signup.
 */
export default function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isMobileVerified, profileLoading, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('identifier');
  const [method, setMethod] = useState<AuthIdentifierMethod>('mobile');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictMessage, setConflictMessage] = useState('');
  const [wrongPortal, setWrongPortal] = useState<'worker' | 'employer' | 'partner' | null>(null);

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

  const handleContinue = async () => {
    setError('');
    const built = buildAuthContinueRequest('worker', method, email, mobile);
    if ('error' in built) {
      setError(built.error);
      return;
    }

    setLoading(true);
    const result = await continueAuth(built.request);
    setLoading(false);

    if (result.nextStep === 'RATE_LIMITED' || result.nextStep === 'ERROR') {
      setError(result.error || AUTH_CONTINUE_MESSAGES.server);
      return;
    }
    if (result.nextStep === 'ACCOUNT_CONFLICT') {
      setConflictMessage(result.error || AUTH_CONTINUE_MESSAGES.conflict);
      setWrongPortal(null);
      setStep('conflict');
      return;
    }
    if (result.nextStep === 'WRONG_PORTAL') {
      setConflictMessage(result.error || AUTH_CONTINUE_MESSAGES.wrong_portal(result.portal));
      setWrongPortal(result.portal ?? null);
      setStep('conflict');
      return;
    }
    if (result.nextStep === 'SIGNUP') {
      setStep('signup');
      return;
    }
    setStep('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('Please agree to the terms and declarations to continue');
      return;
    }

    const identifier = method === 'mobile' ? mobile : email;
    const resolved = await resolveAuthEmail(identifier);
    if (!resolved) {
      setError(method === 'mobile' ? 'Enter a valid 10-digit Indian mobile number' : 'Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await login(resolved, password);
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
          `This account is registered as a ${roleRow.role}. Please continue from the correct portal.`,
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

  if (step === 'signup') {
    return (
      <QuickWorkerSignup
        unified
        prefillEmail={method === 'email' ? email.trim().toLowerCase() : ''}
        prefillMobile={method === 'mobile' ? mobile : ''}
        onBackToContinue={() => {
          setStep('identifier');
          setError('');
        }}
      />
    );
  }

  return (
    <AuthSplitLayout audience="worker" variant={step === 'login' ? 'login' : 'continue'}>
              <div className="mb-5">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  {step === 'login' ? 'Enter your password' : 'Continue as a worker'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === 'login'
                    ? method === 'mobile'
                      ? `Welcome back. Enter the password for +91 ${mobile}.`
                      : `Welcome back. Enter the password for ${email.trim()}.`
                    : 'Enter your mobile number or email. We’ll take you to the next step.'}
                </p>
              </div>

              {error && step !== 'conflict' && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {step === 'conflict' && (
                <AuthConflictPanel
                  message={conflictMessage}
                  portal={wrongPortal && wrongPortal !== 'worker' ? wrongPortal : null}
                  onUseSingleIdentifier={() => {
                    setStep('identifier');
                    setConflictMessage('');
                    setWrongPortal(null);
                  }}
                />
              )}

              {step === 'identifier' && (
                <>
                  <div className="mb-4 space-y-3">
                    <GoogleAuthButton label="Continue with Google" role="worker" />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">or continue with mobile / email</span>
                      </div>
                    </div>
                  </div>

                  <AuthContinueIdentifier
                    method={method}
                    onMethodChange={(next) => {
                      setMethod(next);
                      setError('');
                    }}
                    email={email}
                    mobile={mobile}
                    onEmailChange={setEmail}
                    onMobileChange={setMobile}
                    onSubmit={() => void handleContinue()}
                    loading={loading}
                    idPrefix="worker"
                  />
                </>
              )}

              {step === 'login' && (
                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="worker-password">Password</Label>
                      <ForgotPasswordControl
                        loginPath="/worker/login"
                        initialIdentifier={method === 'email' ? email : ''}
                        title="Reset worker password"
                        description="Enter the email you used to create your worker account. We'll send a secure link to set a new password. Mobile-only accounts should contact SafeWork support."
                        triggerClassName="text-xs"
                      />
                    </div>
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
                    Continue
                  </Button>

                  <button
                    type="button"
                    data-inline
                    onClick={() => {
                      setStep('identifier');
                      setPassword('');
                      setError('');
                    }}
                    className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ← Use a different mobile or email
                  </button>
                </form>
              )}

              {step !== 'conflict' && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2.5 text-center text-xs text-muted-foreground">
                    Looking for a different portal?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="h-10 text-sm font-medium">
                      <Link to={portalAuthPath('employer')}>Employer</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 text-sm font-medium">
                      <Link to={GET_STARTED_PATHS.partner}>Partner</Link>
                    </Button>
                  </div>
                </div>
              )}
      <WorkerTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAgree={() => setAcceptedTerms(true)}
        description="Please review these terms before continuing."
      />
    </AuthSplitLayout>
  );
}
