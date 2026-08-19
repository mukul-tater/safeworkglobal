import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail, Home } from 'lucide-react';
import { toast } from 'sonner';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
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
import { ThemeToggle } from '@/components/ThemeToggle';
import AboutLanguageToggle from '@/components/AboutLanguageToggle';
import { lockedPartnerFromPath, LOCKED_PARTNER_PORTALS } from '../../config/partnerPortalRoutes';

type Method = 'mobile' | 'email';
type Step = 'credentials' | 'otp';

export default function SsvnLoginPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role } = useAuth();
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
  }, [isAuthenticated, role, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!isFirebaseConfigured()) {
      setError('SMS verification is not configured. Ask admin to add Firebase Phone Auth keys.');
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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a
            href="https://safeworkglobal.com"
            className="flex items-center gap-2 hover:opacity-80"
          >
            <img src="/safework-global-logo.png" alt="SafeWork Global" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-sm sm:text-base">SafeWork Global</span>
          </a>
          <div className="flex items-center gap-1">
            <AboutLanguageToggle compact />
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2 mb-2">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${portal.accentClass}`}>
              <PortalIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {portal.loginTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {portal.loginBlurb}
            </p>
          </div>

          <Card className="border-border/60 shadow-lg">
            <CardContent className="p-6 md:p-8">
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
                      <Label htmlFor="ssvn-mobile">Mobile Number</Label>
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
                        Use the mobile from your {typeLabel} registration. SMS via Firebase (+91).
                      </p>
                    </div>
                    <Button
                      id={WORKER_OTP_RECAPTCHA_BTN_ID}
                      type="submit"
                      className="w-full h-11 font-medium"
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
                      <Label htmlFor="ssvn-otp-password">Password</Label>
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
                      className="w-full h-11 font-medium"
                      disabled={loading || otp.length !== 6 || password.length < 6}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Verify & Sign In
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
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="ssvn-email">Email Address</Label>
                    <Input
                      id="ssvn-email"
                      type="email"
                      className="h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="centre@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssvn-password">Password</Label>
                    <Input
                      id="ssvn-password"
                      type="password"
                      className="h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              )}

              <div className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border space-y-2">
                <p>
                  New {portal.applyNoun}?{' '}
                  <Link
                    to={registerPath}
                    className="text-primary font-medium hover:underline"
                  >
                    Apply as {typeLabel} partner
                  </Link>
                </p>
                <p>
                  E-Mitra partner?{' '}
                  <Link to="/emitra/login" className="text-primary font-medium hover:underline">
                    Use E-Mitra login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
