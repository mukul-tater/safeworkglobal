import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Loader2, Phone, ShieldCheck, Lock, Eye, EyeOff,
} from 'lucide-react';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { getFirebaseAuth, isFirebaseConfigured, redirectLocalhostForPhoneAuth } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import {
  WORKER_TERMS_FULL,
} from '@/modules/worker-verification/constants';
import { createVerifiedWorkerAccount } from '@/modules/worker-registration/lib/createVerifiedWorkerAccount';
import GoogleAuthButton, { AuthDivider } from '@/modules/worker-registration/components/GoogleAuthButton';

type Step = 'form' | 'otp';

/**
 * Worker signup — Name + Mobile (Firebase SMS OTP) + Password + T&C.
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
    redirectLocalhostForPhoneAuth();
  }, []);

  useEffect(() => {
    if (profileLoading || formLoading) return;
    if (step !== 'form') return;
    if (isAuthenticated && role === 'worker') {
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
        mobile,
        password,
        country,
        source: { type: 'organic' },
      });
      // Signup OTP already verified this number — mark session verified now so
      // ProtectedRoute does not send the worker to bind-mobile again.
      markMobileVerified(created.mobile);
      await refreshProfile();
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
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-info/5 flex items-center justify-center px-4 py-2">
      <div className="w-full max-w-md max-h-full min-h-0">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 mb-1.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold font-heading">Create your worker profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Name · Mobile OTP · Password</p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="p-3.5 sm:p-4">
            {error && (
              <Alert variant="destructive" className="mb-2.5 py-2">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'form' && (
              <div className="space-y-1.5 mb-2.5">
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
                    className="h-9"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="10-digit mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className="h-9 pl-10"
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-9 pl-10 pr-9"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-9 pl-10"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border bg-muted/30 px-2.5 py-2.5">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(v) => {
                      const on = !!v;
                      setAcceptedTerms(on);
                      if (on) setTermsOpen(true);
                    }}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="inline p-0 m-0 border-0 bg-transparent font-medium text-primary align-baseline hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsOpen(true);
                      }}
                    >
                      terms &amp; declarations
                    </button>
                  </span>
                </label>

                <Button
                  id={WORKER_OTP_RECAPTCHA_BTN_ID}
                  type="submit"
                  className="w-full h-9 font-semibold"
                  disabled={formLoading}
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send SMS code
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/worker/login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyAndCreate} className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Enter the 6-digit SMS code sent to</p>
                  <p className="font-semibold text-foreground mt-0.5">+91 {mobile}</p>
                </div>

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

                <p className="text-xs text-center text-muted-foreground">
                  Didn&apos;t get the code?{' '}
                  <button
                    id={WORKER_OTP_RECAPTCHA_BTN_ID}
                    type="button"
                    onClick={handleResendOtp}
                    disabled={formLoading}
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    Resend SMS
                  </button>
                </p>

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold"
                  disabled={formLoading || otp.length !== 6}
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verify & create account
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setOtp('');
                    setError('');
                    firebaseOtp.resetRecaptcha();
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change details
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Worker terms & declarations</DialogTitle>
              <DialogDescription>
                Please read carefully. Agreeing confirms medical fitness and platform rules.
              </DialogDescription>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
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
    </div>
  );
}
