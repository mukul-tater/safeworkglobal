import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Phone, ShieldCheck, HardHat } from 'lucide-react';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { bindMobileLoginPath, afterMobileVerifiedPath, MOBILE_OTP_ROLES } from '@/lib/mobileVerification';
import DevOtpHint from '@/components/DevOtpHint';

type Step = 'form' | 'otp';

/**
 * Google (and any other) workers, employers, and partners without mobile_verified
 * must complete SMS OTP once here before accessing their portal.
 */
export default function WorkerBindMobilePage() {
  const navigate = useNavigate();
  const {
    user,
    role,
    profile,
    isAuthenticated,
    isMobileVerified,
    loading,
    profileLoading,
    refreshProfile,
    markMobileVerified,
    logout,
  } = useAuth();
  const firebaseOtp = useFirebasePhoneOtp();

  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!isAuthenticated) {
      navigate(bindMobileLoginPath(role), { replace: true });
      return;
    }
    if (role && !MOBILE_OTP_ROLES.includes(role)) {
      navigate('/auth', { replace: true });
      return;
    }
    if (isMobileVerified) {
      navigate(afterMobileVerifiedPath(role), { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, loading, profileLoading, navigate]);

  useEffect(() => {
    const digits = (profile?.phone || '').replace(/\D/g, '').slice(-10);
    if (digits.length === 10 && !mobile) setMobile(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once from profile
  }, [profile?.phone]);

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering OTP step
  }, [step]);

  const assertPhoneAvailable = async (digits: string) => {
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', digits)
      .neq('id', user!.id)
      .maybeSingle();
    if (taken) {
      throw new Error('This mobile number is already registered to another account. Use a different number or sign in with mobile + password.');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidIndianMobile(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!firebaseOtp.isAvailable) {
      setError('SMS verification is not available right now. Please contact support.');
      return;
    }

    setSubmitting(true);
    try {
      const digits = mobile.replace(/\D/g, '').slice(-10);
      await assertPhoneAvailable(digits);
      await firebaseOtp.sendOtp(digits);
      toast.success(`Verification code sent to +91 ${digits}`);
      setStep('otp');
      setOtp('');
    } catch (err: unknown) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }
    if (!user) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      await firebaseOtp.verifyOtp(otp);
      try {
        const { getFirebaseAuth } = await import('@/lib/firebase');
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        if (!firebaseOtp.devBypass) {
          await firebaseSignOut(getFirebaseAuth());
        }
      } catch {
        /* ignore — Firebase session only used for OTP */
      }

      const digits = mobile.replace(/\D/g, '').slice(-10);
      await assertPhoneAvailable(digits);

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ phone: digits, mobile_verified: true })
        .eq('id', user.id);
      if (updateErr) throw new Error(updateErr.message);

      await supabase.auth.updateUser({ data: { phone: digits } });
      if (role === 'worker') {
        await supabase.from('worker_profiles').upsert({ user_id: user.id } as any, {
          onConflict: 'user_id',
        });
      }

      markMobileVerified(digits, user.id);
      await refreshProfile();
      markMobileVerified(digits, user.id);
      toast.success('Mobile verified — welcome!');
      navigate(afterMobileVerifiedPath(role), { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setSubmitting(true);
    try {
      const digits = mobile.replace(/\D/g, '').slice(-10);
      await firebaseOtp.sendOtp(digits);
      toast.success(`New code sent to +91 ${digits}`);
    } catch (err: unknown) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || profileLoading || isMobileVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-heading">Verify your mobile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-time SMS check before you can use the{' '}
            {role === 'employer' ? 'employer' : role === 'partner' ? 'partner' : 'worker'} portal
          </p>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <HardHat className="h-3.5 w-3.5" />
          {role === 'employer' ? 'Employer' : role === 'partner' ? 'Partner' : 'Worker'} account ·
          mobile required
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <div className="mb-4">
              <DevOtpHint />
            </div>

            {step === 'form' && (
              <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className="h-11 pl-10"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send a 6-digit SMS code to verify your number. You only do this once.
                  </p>
                </div>

                <Button
                  id={WORKER_OTP_RECAPTCHA_BTN_ID}
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send SMS code
                </Button>

                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out and use a different account
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerify} className="space-y-5">
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
                    disabled={submitting}
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    Resend SMS
                  </button>
                </p>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verify mobile
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
                  ← Change number
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
