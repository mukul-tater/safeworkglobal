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
  Loader2, Phone, Lock, Eye, EyeOff, Mail, ShieldCheck,
} from 'lucide-react';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  isLeakedPassword,
  isWeakPasswordAuthError,
  passwordSignupIssue,
  WEAK_PASSWORD_MESSAGE,
} from '@/lib/validations/password';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { getFirebaseAuth, redirectToPhoneAuthHost } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { createVerifiedWorkerAccount } from '@/modules/worker-registration/lib/createVerifiedWorkerAccount';
import GoogleAuthButton from '@/modules/worker-registration/components/GoogleAuthButton';
import TermsAgreeRow from '@/components/TermsAgreeRow';
import WorkerTermsDialog from '@/components/WorkerTermsDialog';
import SignupJourneyPanel from '@/components/SignupJourneyPanel';
import SEOHead from '@/components/SEOHead';
import DevOtpHint from '@/components/DevOtpHint';
import FormStepPills from '@/components/FormStepPills';
import {
  CREATED_BY_PARTNER_LABEL,
  partnerWorkerJourneyPath,
  resolvePartnerAddWorkerContext,
  type PartnerAddWorkerContext,
} from '@/modules/partner/lib/partnerAssistedWorker';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import EmitraWorkerOnboardingNoticeDialog from '@/modules/emitra/components/EmitraWorkerOnboardingNoticeDialog';
import HindiText from '@/components/indian-workforce/HindiText';
import {
  hasAckedEmitraOnboardingNotice,
  suggestEmitraWorkerPassword,
} from '@/modules/emitra/lib/emitraWorkerOnboarding';

type Step = 'form' | 'otp';

type Props = {
  /** Partner is registering a worker; same form and journey as independent signup. */
  assistedByPartner?: boolean;
  /** Render only the form card (used inside the worker-portal sidebar). */
  embedded?: boolean;
};

/**
 * Worker signup — Name + Email + Mobile (Firebase SMS OTP) + Password + T&C.
 * Independent workers continue to /worker/journey.
 * Partners stay signed in and fill the worker GCC journey as a kiosk service.
 */
export default function QuickWorkerSignup({ assistedByPartner = false, embedded = false }: Props) {
  const navigate = useNavigate();
  const {
    user, isAuthenticated, role, isMobileVerified, profileLoading, refreshProfile, refreshRole, markMobileVerified,
  } = useAuth();
  const firebaseOtp = useFirebasePhoneOtp();
  const partnerAssisted = assistedByPartner || role === 'partner';
  const [partnerCtx, setPartnerCtx] = useState<PartnerAddWorkerContext | null>(null);
  const [partnerCtxLoading, setPartnerCtxLoading] = useState(partnerAssisted);

  const [step, setStep] = useState<Step>('form');
  const [otpReached, setOtpReached] = useState(false);
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
  const [emitraNoticeOpen, setEmitraNoticeOpen] = useState(false);
  const isEmitraAssisted = partnerAssisted && partnerCtx?.source.type === 'emitra';

  // If already signed in when opening this page, send them on.
  // Do NOT redirect while OTP/account creation is in progress — signIn happens
  // before mobile_verified is written, and bouncing to bind-mobile causes a
  // second "Verify your mobile" screen right after signup OTP.
  useEffect(() => {
    redirectToPhoneAuthHost();
  }, []);

  useEffect(() => {
    if (!partnerAssisted || !user?.id) {
      setPartnerCtxLoading(false);
      return;
    }
    let cancelled = false;
    setPartnerCtxLoading(true);
    void resolvePartnerAddWorkerContext(user.id)
      .then((ctx) => {
        if (!cancelled) {
          setPartnerCtx(ctx);
          setPartnerCtxLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPartnerCtx({
            allowed: true,
            returnTo: '/partner/dashboard',
            myWorkersPath: '/partner/my-workers',
            source: { type: 'partner' },
            status: null,
          });
          setPartnerCtxLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [partnerAssisted, user?.id]);

  useEffect(() => {
    if (!isEmitraAssisted) return;
    if (hasAckedEmitraOnboardingNotice()) return;
    setEmitraNoticeOpen(true);
  }, [isEmitraAssisted]);

  useEffect(() => {
    if (profileLoading || formLoading) return;
    if (step !== 'form') return;
    // Partner stays on this form (and later My Workers). Never treat the
    // brief worker signUp session as "the partner should become this worker".
    if (partnerAssisted) return;
    if (isAuthenticated && role === 'worker') {
      // OTP signup users are already verified — never send them to bind-mobile
      // from this page (Google users without phone still go to bind).
      navigate(isMobileVerified ? '/worker/journey' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, formLoading, step, navigate, partnerAssisted]);

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
    if (!firebaseOtp.isAvailable) {
      return 'SMS verification is not available right now. Please contact support.';
    }
    const passwordIssue = passwordSignupIssue(password, { email: trimmedEmail, mobile });
    if (passwordIssue) return passwordIssue;
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!acceptedTerms) return 'Please agree to the terms and declarations';
    return null;
  };

  const goToSignupStep = (n: number) => {
    if (n === 1) {
      setStep('form');
      setOtp('');
      setError('');
      firebaseOtp.resetRecaptcha();
      return;
    }
    if (n === 2 && otpReached) {
      setError('');
      setStep('otp');
    }
  };

  const fillBasicPassword = () => {
    const suggested = suggestEmitraWorkerPassword();
    setPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
    setShowConfirmPassword(true);
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
      if (await isLeakedPassword(password)) {
        setError(WEAK_PASSWORD_MESSAGE);
        return;
      }
      const digits = mobile.replace(/\D/g, '');
      await firebaseOtp.sendOtp(digits);
      toast.success(`Verification code sent to +91 ${digits}`);
      setOtpReached(true);
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
        source: partnerAssisted ? (partnerCtx?.source ?? { type: 'partner' }) : { type: 'organic' },
        ...(partnerAssisted
          ? {
              preserveCallerSession: true,
              restoreCallerAfterSuccess: true,
              partnerReturnTo: partnerCtx?.myWorkersPath || '/partner/my-workers',
            }
          : {}),
      });
      if (partnerAssisted) {
        try {
          const { attachDraftDeclarationsToWorker } = await import(
            '@/modules/worker-verification/services/declarationService'
          );
          await attachDraftDeclarationsToWorker(created.userId);
        } catch {
          /* declarations can be re-done on the journey */
        }
      }
      if (created.requiresEmailConfirmation) {
        toast.success(
          partnerAssisted
            ? 'Worker created and listed in My Workers. Continue their GCC journey — they should also confirm email.'
            : 'Account created. Check your email to confirm your account, then sign in.',
        );
        navigate(partnerAssisted ? partnerWorkerJourneyPath(created.userId) : '/worker/login', {
          replace: true,
        });
        return;
      }
      // Persist flag BEFORE navigation so ProtectedRoute does not bounce to
      // /worker/bind-mobile (signup OTP already verified this number).
      // Pass userId — AuthContext user may not be set yet after signIn.
      if (!partnerAssisted) {
        markMobileVerified(created.mobile, created.userId);
        await refreshRole();
        await refreshProfile();
        markMobileVerified(created.mobile, created.userId);
        toast.success('Welcome to SafeWorkGlobal!');
        navigate('/worker/journey', { replace: true });
        return;
      }
      await refreshRole();
      await refreshProfile();
      toast.success('Worker created. Continue their GCC journey — you stay signed in as partner.');
      navigate(partnerWorkerJourneyPath(created.userId), { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (isWeakPasswordAuthError(message)) {
        firebaseOtp.resetRecaptcha();
        setOtp('');
        setStep('form');
        setError(WEAK_PASSWORD_MESSAGE);
        toast.error('Choose a stronger password, then send a new SMS code.');
      } else {
        setError(message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (partnerAssisted && (partnerCtxLoading || !partnerCtx)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (partnerAssisted && partnerCtx && !partnerCtx.allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-xl font-bold">Account not active</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            This partner account cannot add workers
            {partnerCtx.status ? ` (status: ${partnerCtx.status})` : ''}. Contact support if you need help.
          </p>
          <Button onClick={() => navigate(partnerCtx.returnTo)}>Back to partner portal</Button>
        </Card>
      </div>
    );
  }

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
    <div className={embedded ? 'w-full' : 'fixed inset-0 overflow-hidden bg-muted/40'}>
      <SEOHead
        title="Worker Registration | SafeWork Global"
        description="Create a free SafeWork Global worker profile to complete skill verification and connect with global employment opportunities."
      />
      <div className={embedded ? '' : 'flex h-full flex-col md:flex-row'}>
        {!embedded && <SignupJourneyPanel createdByPartner={partnerAssisted} />}

        <main className={embedded ? 'w-full' : 'relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-5 sm:justify-center sm:px-8 md:px-8 lg:px-12'}>
          <div className="mx-auto w-full max-w-[480px]">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              {partnerAssisted && !embedded && (
                <button
                  type="button"
                  data-inline
                  onClick={() => navigate(partnerCtx?.returnTo || '/partner/dashboard')}
                  className="mb-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Back to partner dashboard
                </button>
              )}
              <div className="mb-5">
                <FormStepPills
                  current={step === 'form' ? 1 : 2}
                  total={2}
                  maxReachable={otpReached ? 2 : 1}
                  onSelect={goToSignupStep}
                />
                {partnerAssisted && (
                  <Badge variant="secondary" className="mb-2">
                    {CREATED_BY_PARTNER_LABEL}
                  </Badge>
                )}
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  {step === 'form'
                    ? partnerAssisted
                      ? 'Create their worker login'
                      : 'Create your worker profile'
                    : partnerAssisted
                      ? 'Verify the worker mobile'
                      : 'Verify your mobile'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === 'form'
                    ? partnerAssisted
                      ? 'Create their account, then fill their full GCC journey here. You stay signed in as partner. They can also sign in later with this mobile and password.'
                      : 'Takes about 2 minutes. We’ll SMS a code to confirm your number.'
                    : `Enter the 6-digit SMS code sent to +91 ${mobile}`}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {step === 'form' && !partnerAssisted && (
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
                      placeholder={partnerAssisted ? 'Worker full name' : 'Your full name'}
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
                        SMS verification is temporarily unavailable. Please try again later or contact support.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">
                        {isEmitraAssisted ? 'Basic password' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="8+ chars"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
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
                          minLength={8}
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
                  {isEmitraAssisted ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        Set a basic password for this worker. Write it down with their mobile number.
                        They can change it later from Profile.
                      </p>
                      <HindiText className="text-xs text-muted-foreground">
                        वर्कर के लिए बेसिक पासवर्ड सेट करें। मोबाइल नंबर के साथ लिख लें। बाद में प्रोफ़ाइल से बदल सकते हैं।
                      </HindiText>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={fillBasicPassword}
                      >
                        Suggest basic password
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with letters and numbers. Avoid common or leaked passwords.
                    </p>
                  )}

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

                  {!partnerAssisted && (
                    <>
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
                    </>
                  )}
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyAndCreate} className="space-y-5">
                  <DevOtpHint />
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
                    {partnerAssisted ? 'Verify & add worker' : 'Verify & create account'}
                  </Button>

                  <button
                    type="button"
                    data-inline
                    onClick={() => goToSignupStep(1)}
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
      {isEmitraAssisted && (
        <EmitraWorkerOnboardingNoticeDialog
          open={emitraNoticeOpen}
          onOpenChange={(open) => {
            setEmitraNoticeOpen(open);
            if (!open && !password) fillBasicPassword();
          }}
        />
      )}
    </div>
  );
}
