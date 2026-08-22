import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { partnerAuthEmailFromMobile, displayableEmail } from '@/lib/workerAuthEmail';
import {
  assertUserIsPartnerRole,
  findUserIdByPartnerMobile,
  getPartnerOrgForUser,
  isSsvnPartnerApproved,
} from '../../services/ssvnAuth';
import { lockedPartnerFromPath, LOCKED_PARTNER_PORTALS } from '../../config/partnerPortalRoutes';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import { cn } from '@/lib/utils';
import DevOtpHint from '@/components/DevOtpHint';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';

type Method = 'mobile' | 'email';
type Step = 'credentials' | 'otp';

export default function SsvnLoginPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role, loading: authLoading, profileLoading } = useAuth();
  const firebaseOtp = useFirebasePhoneOtp();
  const nextPath = searchParams.get('next') || '';
  const portal = lockedPartnerFromPath(pathname) ?? LOCKED_PARTNER_PORTALS.SSVN;
  const typeCode = portal.code;
  const typeLabel = portal.typeLabel;
  const defaultDashboard = portal.dashboardPath;
  const registerPath = portal.registerPath;
  const PortalIcon = portal.Icon;

  const afterLoginPath = () => {
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) return nextPath;
    return defaultDashboard;
  };

  const [method, setMethod] = useState<Method>('mobile');
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const ensureSsvnAccess = async (userId: string): Promise<string | null> => {
    const isPartner = await assertUserIsPartnerRole(userId);
    if (!isPartner) return 'This account is not a SafeWork partner account.';

    const org = await getPartnerOrgForUser(userId, typeCode);
    if (!org) {
      return portal.missingOrg;
    }
    if (!isSsvnPartnerApproved(org)) {
      if (org.status === 'pending') {
        return `Your ${typeLabel} application is pending SafeWork approval.`;
      }
      return `Your ${typeLabel} partner account is ${org.status}. Contact SafeWork support.`;
    }
    return null;
  };

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!isAuthenticated || role !== 'partner') return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const block = await ensureSsvnAccess(user.id);
      if (block) {
        // Don't bounce eMitra partners away silently — show pending/wrong-type message
        setError(block);
        return;
      }
      navigate(afterLoginPath(), { replace: true });
    })();
  }, [isAuthenticated, role, navigate, authLoading, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
    if (!firebaseOtp.isAvailable) {
      setError('SMS verification is not available right now. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      const userId = await findUserIdByPartnerMobile(digits);
      if (!userId) {
        setError('No partner account found with this mobile. Please apply first.');
        return;
      }

      const block = await ensureSsvnAccess(userId);
      if (block) {
        setError(block);
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
      setError(`Enter the password you set during ${typeLabel} registration`);
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

      const authEmail =
        displayableEmail(prof?.email)?.trim() ||
        partnerAuthEmailFromMobile(digits);
      const result = await partnerLogin(authEmail, password, digits);
      if (!result.success) {
        setError(
          result.error ||
            'Wrong password. Use the password from registration, or sign in with email.',
        );
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication failed');
        return;
      }
      await supabase.from('profiles').update({ phone: digits, mobile_verified: true }).eq('id', user.id);
      try {
        sessionStorage.setItem(`swg_mobile_verified_${user.id}`, '1');
      } catch {
        /* ignore */
      }
      const block = await ensureSsvnAccess(user.id);
      if (block) {
        await supabase.auth.signOut();
        setError(block);
        return;
      }

      toast.success('Welcome to your trade test centre portal');
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

    const block = await ensureSsvnAccess(user.id);
    if (block) {
      await supabase.auth.signOut();
      setError(block);
      setLoading(false);
      return;
    }

    toast.success('Welcome to your trade test centre portal');
    navigate(afterLoginPath(), { replace: true });
    setLoading(false);
  };

  if (authLoading || (isAuthenticated && profileLoading && !role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthSplitLayout audience="partner" variant="login">
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', portal.accentClass)}>
            <PortalIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
              {portal.loginTitle}
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{portal.loginBlurb}</p>
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
        <TabsList className="mb-5 grid h-11 w-full grid-cols-2">
          <TabsTrigger value="mobile" className="gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5" /> Mobile OTP
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mb-4 py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {method === 'mobile' ? (
        step === 'credentials' ? (
          <form onSubmit={handleMobileOtpRequest} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="ssvn-mobile">Mobile number</Label>
              <Input
                id="ssvn-mobile"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="h-11"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-xs text-muted-foreground">
                Use the mobile from your {typeLabel} registration. We&apos;ll send a 6-digit SMS code to verify your number.
              </p>
            </div>
            <Button
              id={WORKER_OTP_RECAPTCHA_BTN_ID}
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMobileOtpVerify} className="space-y-3.5">
            <p className="text-center text-sm text-muted-foreground">
              Enter the SMS OTP sent to{' '}
              <span className="font-medium text-foreground">+91 {mobile}</span>
            </p>
            <DevOtpHint />
            <div className="flex justify-center py-1">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ssvn-otp-password">Password</Label>
                <ForgotPasswordControl
                  loginPath={portal.loginPath}
                  initialIdentifier={email}
                  title={`Reset ${typeLabel} password`}
                  description="Enter the email from your partner application. We'll send a secure link to set a new password."
                  triggerClassName="text-xs"
                />
              </div>
              <Input
                id="ssvn-otp-password"
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & sign in
            </Button>
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
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="ssvn-email">Email address</Label>
            <Input
              id="ssvn-email"
              type="email"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="centre@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ssvn-password">Password</Label>
              <ForgotPasswordControl
                loginPath={portal.loginPath}
                initialIdentifier={email}
                title={`Reset ${typeLabel} password`}
                description="Enter the email from your partner application. We'll send a secure link to set a new password."
                triggerClassName="text-xs"
              />
            </div>
            <Input
              id="ssvn-password"
              type="password"
              className="h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      )}

      <div className="mt-5 space-y-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
        <p>
          New {portal.applyNoun}?{' '}
          <Link to={registerPath} className="font-medium text-primary hover:underline">
            Apply as {typeLabel} partner
          </Link>
        </p>
        <p>
          E-Mitra partner?{' '}
          <Link to="/emitra/login" className="font-medium text-primary hover:underline">
            Use E-Mitra login
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
