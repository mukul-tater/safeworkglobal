import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Loader2, Phone, Lock, Eye, EyeOff, Mail,
} from 'lucide-react';
import { isValidIndianMobile } from '@/lib/validations/common';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { getFirebaseAuth, isFirebaseConfigured, redirectToPhoneAuthHost } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { createVerifiedWorkerAccount } from '@/modules/worker-registration/lib/createVerifiedWorkerAccount';
import GoogleAuthButton from '@/modules/worker-registration/components/GoogleAuthButton';
import TermsAgreeRow from '@/components/TermsAgreeRow';
import WorkerTermsDialog from '@/components/WorkerTermsDialog';
import SignupJourneyPanel from '@/components/SignupJourneyPanel';

type Step = 'form' | 'otp';

/**
 * Worker signup — Name + Email + Mobile (Firebase SMS OTP) + Password + T&C.
 * Continues to /worker/journey for essentials and skill verification.
 */
export default function QuickWorkerSignup() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isMobileVerified, profileLoading, refreshProfile, markMobileVerified } =
    useAuth();
  const firebaseOtp = useFirebasePhoneOtp();

  const [step, setStep] = useState<Step>('form');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const country = 'India';
  const [otp, setOtp] = useState('');

  // If already signed in when opening this page, send them on.
  // Do NOT redirect while OTP/account creation is in progress — signIn happens
  // before mobile_verified is written, and bouncing to bind-mobile causes a
  // second "Verify your mobile" screen right after signup OTP.
  useEffect(() => {
    redirectToPhoneAuthHost();
  }, []);

  useEffect(() => {
    if (profileLoading || formLoading) return;
    if (step !== 'form') return;
    if (isAuthenticated && role === 'worker') {
      // OTP signup users are already verified — never send them to bind-mobile
      // from this page (Google users without phone still go to bind).
      navigate(isMobileVerified ? '/worker/journey' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, formLoading, step, navigate]);

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering OTP step
  }, [step]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Enter a valid email address';
    }
    if (isWorkerMobileAuthEmail(trimmedEmail)) {
      return 'Enter your real email address';
    }
    if (!isValidIndianMobile(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    if (!isFirebaseConfigured()) {
      return 'Phone SMS verification is not configured. Ask the admin to add Firebase Phone Auth keys.';
    }
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!acceptedTerms) return 'Please agree to the terms and declarations';
    return null;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setFormLoading(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      await firebaseOtp.sendOtp(digits);
      toast.success(`Verification code sent to +91 ${digits}`);
      setStep('otp');
      setOtp('');
    } catch (err: unknown) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setFormLoading(true);
    try {
      await firebaseOtp.verifyOtp(otp);

      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }

      const created = await createVerifiedWorkerAccount({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        mobile,
        password,
        country,
        source: { type: 'organic' },
      });
      if (created.requiresEmailConfirmation) {
        toast.success('Account created. Check your email to confirm your account, then sign in.');
        navigate('/worker/login', { replace: true });
        return;
      }
      // Persist flag BEFORE navigation so ProtectedRoute does not bounce to
      // /worker/bind-mobile (signup OTP already verified this number).
      // Pass userId — AuthContext user may not be set yet after signIn.
      markMobileVerified(created.mobile, created.userId);
      await refreshProfile();
      markMobileVerified(created.mobile, created.userId);
      toast.success('Welcome to SafeWorkGlobal!');
      navigate('/worker/journey', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setFormLoading(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      await firebaseOtp.sendOtp(digits);
      toast.success(`New code sent to +91 ${digits}`);
    } catch (err: unknown) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-muted/40">
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel />

        <main className="relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-5 sm:justify-center sm:px-8 md:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-6 rounded-full ${step === 'form' ? 'bg-primary' : 'bg-primary/30'}`}
                  />
                  <span
                    className={`h-1.5 w-6 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-muted-foreground/25'}`}
                  />
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                    Step {step === 'form' ? '1' : '2'} of 2
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  {step === 'form' ? 'Create your worker profile' : 'Verify your mobile'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === 'form'
                    ? 'Takes about 2 minutes. We’ll SMS a code to confirm your number.'
                    : `Enter the 6-digit SMS code sent to +91 ${mobile}`}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {step === 'form' && (
                <div className="mb-4 space-y-3">
                  <GoogleAuthButton label="Sign up with Google" role="worker" />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 'form' && (
                <form onSubmit={handleRequestOtp} className="space-y-3.5" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
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

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">Mobile number</Label>
                    <div className="flex h-11 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="inline-flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        +91
                      </span>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className="h-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoComplete="tel"
                      />
                    </div>
                    {!firebaseOtp.isAvailable && (
                      <p className="text-xs text-warning">
                        SMS OTP needs Firebase Phone Auth keys before signup can continue.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 chars"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-11 pl-10 pr-9"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          data-inline
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-11 pl-10 pr-9"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          data-inline
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <TermsAgreeRow
                    id="worker-signup-terms"
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                    onOpenTerms={() => setTermsOpen(true)}
                  />

                  <Button
                    id={WORKER_OTP_RECAPTCHA_BTN_ID}
                    type="submit"
                    className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                    disabled={formLoading}
                  >
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send SMS code
                  </Button>

                  <p className="pt-1 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/worker/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>

                  <div className="mt-4 border-t border-border pt-4">
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
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyAndCreate} className="space-y-5">
                  <div className="flex justify-center py-1">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Didn&apos;t get the code?{' '}
                    <button
                      id={WORKER_OTP_RECAPTCHA_BTN_ID}
                      type="button"
                      data-inline
                      onClick={handleResendOtp}
                      disabled={formLoading}
                      className="font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      Resend SMS
                    </button>
                  </p>

                  <Button
                    type="submit"
                    className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                    disabled={formLoading || otp.length !== 6}
                  >
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & create account
                  </Button>

                  <button
                    type="button"
                    data-inline
                    onClick={() => {
                      setStep('form');
                      setOtp('');
                      setError('');
                      firebaseOtp.resetRecaptcha();
                    }}
                    className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ← Change details
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>

      <WorkerTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAgree={() => setAcceptedTerms(true)}
      />
    </div>
  );
}
