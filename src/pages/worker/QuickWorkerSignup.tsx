import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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
import {
  WORKER_TERMS_FULL,
} from '@/modules/worker-verification/constants';
import { createVerifiedWorkerAccount } from '@/modules/worker-registration/lib/createVerifiedWorkerAccount';
import GoogleAuthButton, { AuthDivider } from '@/modules/worker-registration/components/GoogleAuthButton';
import TermsAgreeRow from '@/components/TermsAgreeRow';
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
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel />

        <main className="relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-4 sm:justify-center sm:px-8 md:overflow-hidden md:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[400px] py-1 md:py-0">
            <div className="mb-3 md:mb-4">
              <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                {step === 'form' ? 'Create your worker profile' : 'Verify your mobile'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {step === 'form'
                  ? 'Name · Email · Mobile OTP · Password'
                  : `Enter the 6-digit SMS code sent to +91 ${mobile}`}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-3 py-2">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'form' && (
              <div className="mb-3 space-y-1.5">
                <GoogleAuthButton label="Sign up with Google" role="worker" />
                <AuthDivider />
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleRequestOtp} className="space-y-2.5" noValidate>
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1">
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
                      className="h-10 pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="10-digit mobile (+91 SMS)"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className="h-10 pl-10"
                      autoComplete="tel"
                    />
                  </div>
                  {!firebaseOtp.isAvailable && (
                    <p className="text-xs text-warning">
                      SMS OTP needs Firebase Phone Auth keys before signup can continue.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
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
                        className="h-10 pl-10 pr-9"
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

                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword">Confirm</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-10 pl-10"
                        autoComplete="new-password"
                      />
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
                  className="h-10 w-full font-semibold"
                  disabled={formLoading}
                >
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send SMS code
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/worker/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyAndCreate} className="space-y-4">
                <div className="flex justify-center">
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

                <p className="text-center text-xs text-muted-foreground">
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
                  className="h-10 w-full font-semibold"
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
        </main>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker terms &amp; declarations</DialogTitle>
            <DialogDescription>
              Please read carefully. Agreeing confirms medical fitness and platform rules.
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
