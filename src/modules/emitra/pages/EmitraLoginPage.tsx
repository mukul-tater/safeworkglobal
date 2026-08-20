import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail, Store } from 'lucide-react';
import { toast } from 'sonner';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { partnerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import { isPartnerOperational, getPartnerProfile } from '../services/emitraService';
import { hasValidLspSession } from '@/modules/lsp/services/lspSession';
import AuthSplitLayout from '@/components/AuthSplitLayout';

type Method = 'mobile' | 'email';
type Step = 'credentials' | 'otp';

export default function EmitraLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role } = useAuth();
  const firebaseOtp = useFirebasePhoneOtp();
  const nextPath = searchParams.get('next') || '';

  const afterLoginPath = () => {
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) return nextPath;
    if (hasValidLspSession()) return '/lsp/verify';
    // Single partner entry — router sends eMitra (SEN) to /emitra/dashboard
    return '/partner/dashboard';
  };
  const [method, setMethod] = useState<Method>('mobile');
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (isAuthenticated && role === 'partner') {
      navigate(afterLoginPath(), { replace: true });
    }
  }, [isAuthenticated, role, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const checkPartnerApproved = async (userId: string): Promise<boolean> => {
    const profile = await getPartnerProfile(userId);
    return isPartnerOperational(profile);
  };

  const partnerLogin = async (authEmail: string, pwd: string, mobileDigits: string) => {
    const synthetic = partnerAuthEmailFromMobile(mobileDigits);
    let result = await login(authEmail, pwd);
    if (!result.success && authEmail !== synthetic) {
      result = await login(synthetic, pwd);
    }
    return result;
  };

  const handleMobileOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!isFirebaseConfigured()) {
      setError('SMS verification is not configured. Ask admin to add Firebase Phone Auth keys.');
      return;
    }

    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('phone', digits)
        .maybeSingle();

      if (!prof) {
        setError('No partner account found with this mobile. Please apply first.');
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', prof.id)
        .maybeSingle();

      if (roleRow?.role !== 'partner') {
        setError('This mobile is not registered as an E-Mitra partner.');
        return;
      }

      const approved = await checkPartnerApproved(prof.id!);
      if (!approved) {
        setError('Your partner application is pending approval. You will be notified once approved.');
        return;
      }

      await firebaseOtp.sendOtp(digits);
      toast.success(`Verification code sent to +91 ${digits}`);
      setStep('otp');
      setOtp('');
    } catch (err) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    if (password.length < 6) {
      setError('Enter the password you set during partner registration');
      return;
    }

    setLoading(true);
    const digits = mobile.replace(/\D/g, '');

    try {
      await firebaseOtp.verifyOtp(otp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('phone', digits)
        .maybeSingle();

      const authEmail = prof?.email?.trim() || partnerAuthEmailFromMobile(digits);
      const result = await partnerLogin(authEmail, password, digits);
      if (!result.success) {
        setError(result.error || 'Wrong password. Use the password from registration, or sign in with email.');
        return;
      }

      toast.success('Welcome back!');
      navigate(afterLoginPath(), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
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
    if (!user) {
      setError('Authentication failed');
      setLoading(false);
      return;
    }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRow?.role !== 'partner') {
      await supabase.auth.signOut();
      setError('This account is not an E-Mitra partner account.');
      setLoading(false);
      return;
    }

    const approved = await checkPartnerApproved(user.id);
    if (!approved) {
      await supabase.auth.signOut();
      setError('Your partner application is pending approval.');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate(afterLoginPath(), { replace: true });
    setLoading(false);
  };

  return (
    <AuthSplitLayout audience="partner" variant="login">
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Store className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
            E-Mitra sign in
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Access your E-Mitra partner dashboard. Approved partners only.
        </p>
      </div>

      <Tabs
            value={method}
            onValueChange={(v) => {
              setMethod(v as Method);
              setStep('credentials');
              setError('');
              firebaseOtp.resetRecaptcha();
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
              <TabsTrigger value="mobile" className="gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5" /> Mobile OTP
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5" /> Email
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {method === 'mobile' ? (
            step === 'credentials' ? (
              <form onSubmit={handleMobileOtpRequest} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="partner-mobile">Mobile Number</Label>
                  <Input
                    id="partner-mobile"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="h-11"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send an SMS code via Firebase (+91).
                  </p>
                </div>
                <Button
                  id={WORKER_OTP_RECAPTCHA_BTN_ID}
                  type="submit"
                    className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMobileOtpVerify} className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the SMS OTP sent to{' '}
                  <span className="font-medium text-foreground">+91 {mobile}</span>
                </p>
                <div className="flex justify-center py-1">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-otp-password">Password</Label>
                  <Input
                    id="partner-otp-password"
                    type="password"
                    autoComplete="current-password"
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password from registration"
                  />
                </div>
                <Button
                  type="submit"
                    className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                  disabled={loading || otp.length !== 6 || password.length < 6}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify & Sign In
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Didn&apos;t get the code?{' '}
                  <button
                    id={WORKER_OTP_RECAPTCHA_BTN_ID}
                    type="button"
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                    disabled={loading}
                    onClick={async () => {
                      setError('');
                      setLoading(true);
                      try {
                        const digits = mobile.replace(/\D/g, '');
                        await firebaseOtp.sendOtp(digits);
                        setOtp('');
                        toast.success(`New code sent to +91 ${digits}`);
                      } catch (err) {
                        firebaseOtp.resetRecaptcha();
                        setError(err instanceof Error ? err.message : 'Failed to resend OTP');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resend SMS
                  </button>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setError('');
                    firebaseOtp.resetRecaptcha();
                  }}
                >
                  Change number
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="partner-email">Email Address</Label>
                <Input
                  id="partner-email"
                  type="email"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-password">Password</Label>
                <Input
                  id="partner-password"
                  type="password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <p>
              New E-Mitra partner?{' '}
              <Link to="/emitra/register" className="font-medium text-primary hover:underline">
                Apply here
              </Link>
            </p>
            <p>
              Trade test centre (SSVN)?{' '}
              <Link to="/partner/ssvn/login" className="font-medium text-primary hover:underline">
                Use SSVN login
              </Link>
            </p>
          </div>
    </AuthSplitLayout>
  );
}
