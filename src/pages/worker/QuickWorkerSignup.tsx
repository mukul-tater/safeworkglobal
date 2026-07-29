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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, ShieldCheck, CheckCircle2, ArrowLeft, HardHat, Lock, Eye, EyeOff } from 'lucide-react';
import { NATIONALITIES } from '@/lib/constants';
import { lovable } from '@/integrations/lovable/index';

/**
 * Worker signup — Name + Email + Password + Country (or Google).
 * Mobile / synthetic emails removed: auth email must be user-provided.
 */
export default function QuickWorkerSignup() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('India');

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

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return 'Please enter your email';
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return 'Please enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!country) return 'Please select your country';
    return null;
  };

  const createWorkerAccount = async () => {
    const authEmail = email.trim().toLowerCase();
    if (!authEmail) {
      throw new Error('Please enter your email');
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', authEmail)
      .maybeSingle();
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const { error: signupErr } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/worker/trust`,
        data: {
          full_name: name.trim(),
          role: 'worker',
        },
      },
    });

    if (signupErr) {
      if (/already registered|already exists/i.test(signupErr.message)) {
        throw new Error('This email is already registered. Please sign in instead.');
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
          email: authEmail,
          mobile_verified: false,
        })
        .eq('id', user.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      await createWorkerAccount();
      toast.success('Welcome to SafeWorkGlobal! 🎉');
      navigate('/worker/trust', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  <span className="bg-card px-2 text-muted-foreground">OR CONTINUE WITH EMAIL</span>
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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  Worker signup is India-only for now.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create account
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
