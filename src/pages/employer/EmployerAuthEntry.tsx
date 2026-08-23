import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';
import GoogleAuthButton from '@/modules/worker-registration/components/GoogleAuthButton';
import MobileBottomNav from '@/components/MobileBottomNav';
import AuthContinueIdentifier from '@/components/auth/AuthContinueIdentifier';
import AuthConflictPanel from '@/components/auth/AuthConflictPanel';
import { validateSchema } from '@/lib/validations/common';
import { quickEmployerSignupSchema } from '@/lib/validations/onboarding';
import { sanitizePasswordInput, PASSWORD_HINT, PASSWORD_MIN_LENGTH } from '@/lib/validations/password';
import {
  AUTH_CONTINUE_MESSAGES,
  buildAuthContinueRequest,
  continueAuth,
  portalAuthPath,
  type AuthIdentifierMethod,
} from '@/lib/authContinue';
import { GET_STARTED_PATHS } from '@/lib/getStarted';

type Step = 'identifier' | 'login' | 'signup' | 'conflict';

export default function EmployerAuthEntry({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isMobileVerified, loading: authLoading, profileLoading } = useAuth();
  const [step, setStep] = useState<Step>('identifier');
  const [method, setMethod] = useState<AuthIdentifierMethod>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictMessage, setConflictMessage] = useState('');
  const [wrongPortal, setWrongPortal] = useState<'worker' | 'employer' | 'partner' | null>(null);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (isAuthenticated && role === 'employer') {
      navigate(isMobileVerified ? '/employer/dashboard' : '/employer/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, navigate, authLoading, profileLoading]);

  if (authLoading || (isAuthenticated && (profileLoading || role === 'employer'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Signing you in..." />
      </div>
    );
  }

  const handleContinue = async () => {
    setError('');
    const built = buildAuthContinueRequest('employer', method, email, mobile);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
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
      if (roleRow?.role && roleRow.role !== 'employer') {
        await supabase.auth.signOut();
        setError(
          `This account is registered as a ${roleRow.role}. Please continue from the correct portal.`,
        );
        setLoading(false);
        return;
      }
    }
    toast.success('Welcome back!');
    navigate('/employer/dashboard', { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validation = validateSchema(quickEmployerSignupSchema, { fullName, email, password });
    if (!validation.success) {
      const message = Object.values(validation.errors)[0];
      setError(message);
      toast.error(message);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const bothCheck = await continueAuth({
        role: 'employer',
        email: validation.data.email.trim(),
        mobile: mobile || undefined,
      });
      if (bothCheck.nextStep === 'ACCOUNT_CONFLICT') {
        setError(bothCheck.error || AUTH_CONTINUE_MESSAGES.conflict);
        setLoading(false);
        return;
      }
      if (bothCheck.nextStep === 'LOGIN' || bothCheck.nextStep === 'WRONG_PORTAL') {
        setError(bothCheck.error || 'An account already exists for these details.');
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: validation.data.email.trim(),
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/employer/quick-signup`,
          data: { full_name: validation.data.fullName.trim(), role: 'employer' },
        },
      });
      if (signUpError) {
        if (/already registered|already exists/i.test(signUpError.message)) {
          toast.error('This email is already registered. Continue with your password.');
          setStep('login');
          return;
        }
        throw signUpError;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        toast.success('Check your email to verify your account');
        navigate('/verify-email');
        return;
      }

      const { data: { user: created } } = await supabase.auth.getUser();
      if (created) {
        const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', created.id).maybeSingle();
        if (roleRow && roleRow.role !== 'employer') {
          await supabase.auth.signOut();
          toast.error(`This account is already registered as a ${roleRow.role}. Please continue from the correct portal.`);
          return;
        }
      }

      toast.success('Account created. Verify your mobile number to continue.');
      navigate('/employer/bind-mobile', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create account';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <>
      <div className="mb-5">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
          {step === 'login'
            ? 'Enter your password'
            : step === 'signup'
              ? 'Let’s create your account'
              : 'Continue as an employer'}
        </h2>
        <p className="mt-1 min-w-0 break-words text-sm text-muted-foreground">
          {step === 'login'
            ? `Welcome back. Enter the password for ${email.trim()}.`
            : step === 'signup'
              ? 'We’ll keep the email you entered and only ask for remaining details.'
              : 'Enter your work email or mobile. We’ll take you to the next step.'}
        </p>
      </div>

      {error && step !== 'conflict' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {step === 'conflict' && (
        <AuthConflictPanel
          message={conflictMessage}
          portal={wrongPortal && wrongPortal !== 'employer' ? wrongPortal : null}
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
            <GoogleAuthButton label="Continue with Google" role="employer" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email / mobile</span>
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
            methods={['email', 'mobile']}
            emailLabel="Work email"
            emailPlaceholder="you@company.com"
            idPrefix="employer"
          />
        </>
      )}

      {step === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="employer-password">Password</Label>
              <ForgotPasswordControl
                loginPath="/employer/login"
                initialIdentifier={email}
                title="Reset employer password"
                description="Enter the work email you use to continue. We'll send a secure link to set a new password."
                triggerClassName="text-xs"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="employer-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            ← Use a different email or mobile
          </button>
        </form>
      )}

      {step === 'signup' && (
        <form onSubmit={handleSignup} className="space-y-3.5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="employer-name">Full name</Label>
            <Input
              id="employer-name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employer-email-locked">Work email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="employer-email-locked"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={method === 'email'}
                required
                className="h-11 pl-10"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="employer-new-password">Password</Label>
              <Input
                id="employer-new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={PASSWORD_HINT}
                value={password}
                onChange={(e) => setPassword(sanitizePasswordInput(e.target.value))}
                required
                minLength={PASSWORD_MIN_LENGTH}
                className="h-11"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employer-confirm-password">Confirm</Label>
              <Input
                id="employer-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(sanitizePasswordInput(e.target.value))}
                required
                minLength={PASSWORD_MIN_LENGTH}
                className="h-11"
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}.</p>
          <Button type="submit" className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
          <button
            type="button"
            data-inline
            onClick={() => {
              setStep('identifier');
              setError('');
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            ← Use a different email or mobile
          </button>
        </form>
      )}

      {step !== 'conflict' && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2.5 text-center text-xs text-muted-foreground">Looking for a different portal?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-10 text-sm font-medium">
              <Link to={portalAuthPath('worker')}>Worker</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 text-sm font-medium">
              <Link to={GET_STARTED_PATHS.partner}>Partner</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-24 md:pb-4">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-mesh)' }} />
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Employer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Continue to hire verified workers and manage your jobs.
          </p>
        </div>
        <Card className="shadow-lg border-border/60 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-info" />
          <CardContent className="p-6">{body}</CardContent>
        </Card>
      </div>
      <MobileBottomNav />
    </div>
  );
}
