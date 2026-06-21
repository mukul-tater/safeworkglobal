import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Phone, Mail, ShieldCheck, CheckCircle2, ArrowLeft, HardHat } from 'lucide-react';
import { NATIONALITIES } from '@/lib/constants';
import { lovable } from '@/integrations/lovable/index';

type Method = 'mobile' | 'email';
type Step = 'form' | 'otp';

/**
 * Simplified worker signup — Name + Mobile (or Email) + Country.
 * Mock OTP: any 6-digit code works (demo mode).
 * Creates auth account using a synthetic email when mobile-only.
 */
export default function QuickWorkerSignup() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [method, setMethod] = useState<Method>('mobile');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [otp, setOtp] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    try {
      // Pre-select Worker role so the OAuth callback auto-assigns it
      // — user is NOT asked again on /auth.
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
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (!country) return 'Please select your country';
    if (method === 'mobile') {
      const digits = mobile.replace(/\D/g, '');
      if (digits.length < 8) return 'Please enter a valid mobile number';
    } else {
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email';
    }
    return null;
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    // Mock OTP: simulate sending
    toast.success(
      method === 'mobile'
        ? `Verification code sent to ${mobile}`
        : `Verification code sent to ${email}`,
      { description: 'Demo mode: enter any 6 digits to continue' }
    );
    setStep('otp');
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
      // Synthesize an email if mobile-only (Supabase auth requires email)
      const digits = mobile.replace(/\D/g, '');
      const authEmail = method === 'email'
        ? email.trim()
        : `m${digits}@workers.safeworkglobal.app`;

      // Auto-generate password (user signs in via this device session)
      const password = `SWG-${digits || email}-${Date.now().toString(36)}`;

      // Pre-check: prevent reusing a worker email for employer (and vice versa)
      if (method === 'email') {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', authEmail)
          .maybeSingle();
        if (existing) {
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }
      }

      const { error: signupErr } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/worker/trust`,
          data: {
            full_name: name.trim(),
            phone: method === 'mobile' ? mobile.trim() : '',
            role: 'worker',
          },
        },
      });

      if (signupErr) {
        if (/already registered|already exists/i.test(signupErr.message)) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(signupErr.message);
        }
        setLoading(false);
        return;
      }

      // Try immediate sign-in (works when email auto-confirm is on)
      await supabase.auth.signInWithPassword({ email: authEmail, password });

      // Verify role matches (defends against an existing employer account being reused).
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (roleRow && roleRow.role !== 'worker') {
          await supabase.auth.signOut();
          setError(
            `This account is already registered as a ${roleRow.role}. Please log in with the correct role.`
          );
          setLoading(false);
          return;
        }
        await supabase.from('worker_profiles')
          .upsert({ user_id: user.id, country, nationality: country } as any, { onConflict: 'user_id' });
        await supabase.from('profiles')
          .update({ mobile_verified: method === 'mobile' })
          .eq('id', user.id);
      }

      toast.success('Welcome to SafeWorkGlobal! 🎉');
      navigate('/worker/trust', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        {/* Role indicator — makes it explicit which role you're signing up as */}
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
              <form onSubmit={handleRequestOtp} className="space-y-4">
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
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
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
                  />
                </div>

                <Tabs value={method} onValueChange={(v) => { setMethod(v as Method); setError(''); }}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="mobile" className="gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Mobile
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {method === 'mobile' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send a verification code to confirm it's you
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {NATIONALITIES.filter(c => c !== 'All Nationalities').map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-11 font-semibold">
                  Continue
                </Button>

                <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg p-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Verified jobs only · No upfront fees</span>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-1">
                  Already have an account?{' '}
                  <button type="button" onClick={() => navigate('/auth')} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyAndCreate} className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {method === 'mobile' ? mobile : email}
                  </p>
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
                  Demo mode: any 6 digits will work
                </p>

                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || otp.length !== 6}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verify & create account
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtp(''); setError(''); }}
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
