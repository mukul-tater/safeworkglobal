import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EmitraLayout from '../components/EmitraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { isPartnerOperational, getPartnerProfile } from '../services/emitraService';
import GoogleAuthButton, { AuthDivider } from '@/modules/worker-registration/components/GoogleAuthButton';

type Method = 'mobile' | 'email';
type Step = 'credentials' | 'otp';

export default function EmitraLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();
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
      navigate('/emitra/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const checkPartnerApproved = async (userId: string): Promise<boolean> => {
    const profile = await getPartnerProfile(userId);
    return isPartnerOperational(profile);
  };

  const partnerLogin = async (authEmail: string, mobileDigits: string) => {
    const pwd = `SWP-${mobileDigits}`;
    let result = await login(authEmail, pwd);
    if (!result.success && authEmail !== `emitra${mobileDigits}@partners.safeworkglobal.app`) {
      result = await login(`emitra${mobileDigits}@partners.safeworkglobal.app`, pwd);
    }
    return result;
  };

  const handleMobileOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

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

    toast.success(`OTP sent to ${digits}`, { description: 'Demo: enter any 6 digits' });
    setStep('otp');
  };

  const handleMobileOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    const digits = mobile.replace(/\D/g, '');
    const { data: prof } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', digits)
      .maybeSingle();

    if (!prof?.email) {
      setError('Account lookup failed');
      setLoading(false);
      return;
    }

    const result = await partnerLogin(prof.email, digits);
    if (!result.success) {
      setError('Login failed. Use email + password or contact support.');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate('/emitra/dashboard', { replace: true });
    setLoading(false);
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
    navigate('/emitra/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <EmitraLayout
      centered
      maxWidth="md"
      title="Partner Sign In"
      subtitle="Access your E-Mitra partner dashboard. Approved partners only."
    >
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <Tabs
            value={method}
            onValueChange={(v) => {
              setMethod(v as Method);
              setStep('credentials');
              setError('');
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

          <GoogleAuthButton label="Sign in with Google" role="partner" />
          <AuthDivider />

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
                </div>
                <Button type="submit" className="w-full h-11 font-medium">
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMobileOtpVerify} className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the OTP sent to <span className="font-medium text-foreground">{mobile}</span>
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
                <Button type="submit" className="w-full h-11 font-medium" disabled={loading || otp.length !== 6}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify & Sign In
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('credentials')}>
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
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
            New partner?{' '}
            <Link to="/emitra/register" className="text-primary font-medium hover:underline">
              Apply as SafeWork Partner
            </Link>
          </p>
        </CardContent>
      </Card>
    </EmitraLayout>
  );
}
