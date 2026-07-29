import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, Phone, ShieldCheck, CheckCircle2, ArrowLeft, HardHat, Lock, Eye, EyeOff,
} from 'lucide-react';
import { NATIONALITIES } from '@/lib/constants';
import { lovable } from '@/integrations/lovable/index';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_HOST_ID,
  dismissRecaptchaWidgets,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { workerAuthEmailFromMobile } from '@/lib/workerAuthEmail';

type Step = 'form' | 'otp';

/**
 * Worker signup — Name + Mobile (Firebase SMS OTP) + Password.
 * Email is not collected here; workers add/verify email inside the portal.
 */
export default function QuickWorkerSignup() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const firebaseOtp = useFirebasePhoneOtp();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [otp, setOtp] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem('pending_oauth_role', 'worker');
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem('pending_oauth_role');
        toast.error('Google signup failed');
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem('pending_oauth_role');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'worker') {
      navigate('/worker/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering OTP step
  }, [step]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!isValidIndianMobile(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    if (!isFirebaseConfigured()) {
      return 'Phone SMS verification is not configured. Use Continue with Google, or ask the admin to add Firebase Phone Auth keys.';
    }
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!country) return 'Please select your country';
    return null;
  };

  const createWorkerAccount = async () => {
    const digits = mobile.replace(/\D/g, '').slice(-10);
    const authEmail = workerAuthEmailFromMobile(digits);

    const { error: signupErr } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/worker/trust`,
        data: {
          full_name: name.trim(),
          phone: digits,
          role: 'worker',
        },
      },
    });

    if (signupErr) {
      if (/already registered|already exists/i.test(signupErr.message)) {
        throw new Error('This mobile number is already registered. Please sign in instead.');
      }
      throw new Error(signupErr.message);
    }

    await supabase.auth.signInWithPassword({ email: authEmail, password });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (roleRow && roleRow.role !== 'worker') {
        await supabase.auth.signOut();
        throw new Error(
          `This account is already registered as a ${roleRow.role}. Please log in with the correct role.`
        );
      }
      await supabase
        .from('worker_profiles')
        .upsert({ user_id: user.id, country, nationality: country } as any, {
          onConflict: 'user_id',
        });
      await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone: digits,
          mobile_verified: true,
        })
        .eq('id', user.id);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await firebaseOtp.verifyOtp(otp);

      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }

      await createWorkerAccount();
      toast.success('Welcome to SafeWorkGlobal! 🎉');
      navigate('/worker/trust', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      await firebaseOtp.sendOtp(digits);
      toast.success(`New code sent to +91 ${digits}`);
    } catch (err: unknown) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div
          id={WORKER_OTP_RECAPTCHA_HOST_ID}
          className="pointer-events-none fixed left-[-9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
          aria-hidden="true"
        />

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-heading">Create your worker profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Takes under 2 minutes • No agent fees</p>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <HardHat className="h-3.5 w-3.5" />
          Signing up as a Worker
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'form' && (
              <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue with Google
                </Button>

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">OR VERIFY WITH MOBILE</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
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
                    We&apos;ll send an SMS code to verify it&apos;s you (+91). Email can be added later in your profile.
                  </p>
                  {!firebaseOtp.isAvailable && (
                    <p className="text-xs text-warning">
                      SMS OTP needs Firebase Phone Auth keys. Until then, use Google signup.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10 pr-10"
                      autoComplete="new-password"
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select
                    value={country}
                    onValueChange={(v) => {
                      if (v === 'India') setCountry(v);
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {NATIONALITIES.filter((c) => c !== 'All Nationalities').map((c) => (
                        <SelectItem key={c} value={c} disabled={c !== 'India'}>
                          {c}
                          {c !== 'India' ? ' (coming soon)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Worker signup is India-only for now (+91 SMS OTP).
                  </p>
                </div>

                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send SMS code
                </Button>

                <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg p-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Verified jobs only · No upfront fees</span>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-1">
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
              <form onSubmit={handleVerifyAndCreate} className="space-y-5">
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
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    Resend SMS
                  </button>
                </p>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={loading || otp.length !== 6}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
      </div>
    </div>
  );
}
