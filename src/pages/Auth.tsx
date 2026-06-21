import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { useWorkerAuth } from '@/modules/worker-registration/context/WorkerAuthContext';
import {
  completeWorkerGoogleBridge,
  workerPathAfterGoogleBridge,
} from '@/modules/worker-registration/lib/completeWorkerGoogleBridge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, EyeOff, Loader2, Briefcase, HardHat, Users, ArrowLeft, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { passwordValidation } from '@/components/ValidatedInput';

type AuthView = 'login' | 'signup' | 'forgot' | 'role-select';
type LoginMethod = 'email' | 'mobile';

const roles: { value: AppRole; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { value: 'worker', label: 'Worker', description: 'Find international job opportunities', icon: <HardHat className="h-6 w-6" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400' },
  { value: 'employer', label: 'Employer', description: 'Hire skilled workers globally', icon: <Briefcase className="h-6 w-6" />, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400' },
  { value: 'partner', label: 'Partner (e-Mitra)', description: 'Register workers from your service center', icon: <Users className="h-6 w-6" />, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400' },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleHint = (searchParams.get('role') as AppRole | null) || null;
  const modeHint = searchParams.get('mode'); // "signup" forces signup view
  const { login, signup, isAuthenticated, role, needsRoleSelection, profileLoading, assignRole, profile } = useAuth();
  const { loginWithGoogle, isAuthenticated: isPhase1Worker } = useWorkerAuth();
  const [view, setView] = useState<AuthView>(
    modeHint === 'signup' ? 'role-select' : 'login'
  );
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [assigningRole, setAssigningRole] = useState<AppRole | null>(null);
  // Role chooser modal shown BEFORE triggering Google OAuth so we know which
  // role the user intends to use. The chosen role is stashed in sessionStorage
  // and consumed after the OAuth redirect lands back on /auth.
  const [googleRoleOpen, setGoogleRoleOpen] = useState(false);
  const [googleRoleContext, setGoogleRoleContext] = useState<'login' | 'signup'>('login');

  // Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<AppRole | null>(null);

  // Forgot
  const [resetEmail, setResetEmail] = useState('');

  // If a role hint is provided in the URL (?role=worker|employer), funnel
  // the user straight into that signup flow without showing the role picker.
  useEffect(() => {
    if (!roleHint) return;
    if (isAuthenticated) return; // already logged in — let other effects handle it
    if (roleHint === 'worker' || roleHint === 'employer' || roleHint === 'partner') {
      setSignupRole(roleHint);
      // Redirect to the dedicated quick-signup pages for worker/employer.
      if (roleHint === 'worker') navigate('/register', { replace: true });
      else if (roleHint === 'employer') navigate('/employer/quick-signup', { replace: true });
      else setView('signup');
    }
  }, [roleHint, isAuthenticated, navigate]);

  // If an authenticated user lands here without a role (e.g. fresh Google
  // sign-in), force them into the role-select flow instead of redirecting.
  useEffect(() => {
    if (!isAuthenticated || !needsRoleSelection) return;

    // If the user picked a role BEFORE clicking "Sign in with Google",
    // auto-assign it now so they never see the role-select screen again.
    const pending = sessionStorage.getItem('pending_oauth_role') as AppRole | null;
    if (pending && (pending === 'worker' || pending === 'employer' || pending === 'partner')) {
      sessionStorage.removeItem('pending_oauth_role');
      handleRoleSelect(pending);
      return;
    }

    setView('role-select');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, needsRoleSelection]);

  // If the user picked a role pre-OAuth but already has a DIFFERENT role on
  // their account, sign them out and show a clear mismatch error.
  useEffect(() => {
    if (!isAuthenticated || !role) return;
    const pending = sessionStorage.getItem('pending_oauth_role') as AppRole | null;
    if (!pending) return;
    sessionStorage.removeItem('pending_oauth_role');
    if (pending !== role) {
      const labelMap: Record<AppRole, string> = {
        worker: 'Worker', employer: 'Employer', partner: 'Partner (e-Mitra)', admin: 'Admin',
      };
      (async () => {
        await supabase.auth.signOut();
        setError(
          `This account is already registered as a ${labelMap[role]}. ` +
          `Please sign in with the correct role.`
        );
      })();
    }
  }, [isAuthenticated, role]);

  // Redirect once both auth + role are ready.
  useEffect(() => {
    if (!isAuthenticated || !role || assigningRole) return;

    if (role === 'worker') {
      navigate(isPhase1Worker ? '/home' : '/worker/dashboard', { replace: true });
      return;
    }

    if (role === 'employer') {
      navigate('/employer/dashboard', { replace: true });
      return;
    }
    if (role === 'partner') {
      navigate('/emitra/dashboard', { replace: true });
      return;
    }
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  }, [isAuthenticated, role, navigate, assigningRole, isPhase1Worker, loginWithGoogle]);

  // Step 1 — open the role chooser modal. We do NOT trigger OAuth yet.
  const openGoogleRoleChooser = (context: 'login' | 'signup') => {
    setError('');
    setGoogleRoleContext(context);
    setGoogleRoleOpen(true);
  };

  // Step 2 — user picked a role inside the modal. Persist it and start OAuth.
  const handleGoogleRolePick = async (chosenRole: AppRole) => {
    setGoogleLoading(true);
    setError('');
    try {
      sessionStorage.setItem('pending_oauth_role', chosenRole);
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem('pending_oauth_role');
        setError(result.error instanceof Error ? result.error.message : 'Google sign-in failed');
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return; // Browser will navigate to Google
    } catch {
      sessionStorage.removeItem('pending_oauth_role');
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let emailToUse = loginIdentifier;

    if (loginMethod === 'mobile') {
      const { data, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', loginIdentifier)
        .maybeSingle();

      if (lookupError || !data) {
        setError('No account found with this mobile number');
        setLoading(false);
        return;
      }
      emailToUse = data.email;
    }

    const result = await login(emailToUse, loginPassword);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }

    // Enforce one-role-per-account: if a role hint was supplied, verify the
    // signed-in user actually holds that role. Otherwise sign them out.
    if (roleHint) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        const storedRole = roleRow?.role as AppRole | undefined;
        if (storedRole && storedRole !== roleHint) {
          await supabase.auth.signOut();
          const labelMap: Record<AppRole, string> = {
            worker: 'Worker', employer: 'Employer', partner: 'Partner (e-Mitra)', admin: 'Admin',
          };
          setError(
            `This account is already registered as a ${labelMap[storedRole]}. ` +
            `Please log in with the correct role.`
          );
          setLoading(false);
          return;
        }
      }
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signupRole) { setError('Please select a role'); return; }
    if (!signupName.trim()) { setError('Full name is required'); return; }
    if (!signupPhone.trim()) { setError('Mobile number is required'); return; }
    {
      const pwErr = passwordValidation(signupPassword);
      if (pwErr) { setError(pwErr); return; }
    }
    setLoading(true);

    const result = await signup({
      email: signupEmail,
      password: signupPassword,
      full_name: signupName,
      phone: signupPhone,
      role: signupRole
    });

    if (result.success) {
      toast.success('Account created successfully!');
      if (signupRole === 'worker') {
        navigate('/worker/onboarding');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Signup failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setError(error.message); }
      else {
        toast.success('Reset link sent! Check your inbox.');
        setResetEmail('');
        setView('login');
      }
    } catch { setError('Failed to send reset email'); }
    setLoading(false);
  };

  const handleRoleSelect = async (selectedRole: AppRole) => {
    setSignupRole(selectedRole);
    setError('');

    // Already authenticated (e.g. Google sign-in with no role yet) — assign
    // the role server-side and let the redirect effect take over.
    if (isAuthenticated && needsRoleSelection) {
      setAssigningRole(selectedRole);
      const result = await assignRole(selectedRole);
      setAssigningRole(null);
      if (!result.success) {
        setError(result.error || 'Could not set your role. Please try again.');
        return;
      }
      toast.success(`Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!`);
      if (selectedRole === 'worker') {
        navigate(isPhase1Worker ? '/home' : '/worker/dashboard', { replace: true });
      } else if (selectedRole === 'employer') {
        // Apply any pending company/full-name captured from the
        // QuickEmployerSignup form before the Google OAuth redirect.
        try {
          const pendingCompany = sessionStorage.getItem('pending_employer_company');
          const pendingFullName = sessionStorage.getItem('pending_employer_full_name');
          sessionStorage.removeItem('pending_employer_company');
          sessionStorage.removeItem('pending_employer_full_name');
          const { data: { user: u } } = await supabase.auth.getUser();
          if (u && pendingCompany) {
            await supabase
              .from('employer_profiles')
              .update({ company_name: pendingCompany })
              .eq('user_id', u.id);
          }
          if (u && pendingFullName) {
            await supabase
              .from('profiles')
              .update({ full_name: pendingFullName })
              .eq('id', u.id);
          }
        } catch {
          // Non-fatal — user can edit on the employer profile page.
        }
        navigate('/employer/dashboard', { replace: true });
      } else {
        navigate('/emitra/register', { replace: true });
      }
      return;
    }

    // Not authenticated yet — original signup flow.
    if (selectedRole === 'worker') {
      navigate('/register');
      return;
    }
    if (selectedRole === 'employer') {
      navigate('/employer/quick-signup');
      return;
    }
    setView('signup');
  };

  const GoogleButton = ({ label, context = 'login' }: { label: string; context?: 'login' | 'signup' }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2 font-medium"
      onClick={() => openGoogleRoleChooser(context)}
      disabled={googleLoading}
    >
      {googleLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-mesh)' }} />

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {view === 'login' && 'Welcome back'}
            {view === 'role-select' && (needsRoleSelection ? 'One last step' : 'Join as')}
            {view === 'signup' && 'Create your account'}
            {view === 'forgot' && 'Reset password'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === 'login' && 'Sign in to your SafeWorkGlobal account'}
            {view === 'role-select' && (needsRoleSelection
              ? `Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Choose how you want to use SafeWorkGlobal.`
              : 'Choose how you want to use the platform')}
            {view === 'signup' && `Signing up as ${roles.find(r => r.value === signupRole)?.label}`}
            {view === 'forgot' && "We'll send you a link to reset it"}
          </p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* LOGIN */}
            {view === 'login' && (
              <div className="space-y-4">
                <GoogleButton label="Sign in with Google" />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <Tabs value={loginMethod} onValueChange={(v) => { setLoginMethod(v as LoginMethod); setLoginIdentifier(''); setError(''); }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
                      <TabsTrigger value="mobile" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> Mobile</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-id">{loginMethod === 'email' ? 'Email' : 'Mobile Number'}</Label>
                    <Input
                      id="login-id"
                      type={loginMethod === 'email' ? 'email' : 'tel'}
                      placeholder={loginMethod === 'email' ? 'you@example.com' : '+91 98765 43210'}
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button type="button" onClick={() => { setError(''); setView('forgot'); }} className="text-xs text-primary hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required minLength={6} className="h-11 pr-10" />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setError(''); setView('role-select'); }} className="text-primary font-medium hover:underline">Sign up</button>
                  </p>
                </form>
              </div>
            )}

            {/* ROLE SELECT */}
            {view === 'role-select' && (
              <div className="space-y-3">
                {roles.map(r => {
                  const isAssigningThis = assigningRole === r.value;
                  return (
                    <button
                      key={r.value}
                      onClick={() => handleRoleSelect(r.value)}
                      disabled={!!assigningRole}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left group disabled:opacity-60 disabled:cursor-not-allowed',
                        r.color
                      )}
                    >
                      <div className="shrink-0">
                        {isAssigningThis ? <Loader2 className="h-6 w-6 animate-spin" /> : r.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                    </button>
                  );
                })}
                {!needsRoleSelection && (
                  <p className="text-sm text-center text-muted-foreground pt-2">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setError(''); setView('login'); }} className="text-primary font-medium hover:underline">Sign in</button>
                  </p>
                )}
              </div>
            )}

            {/* SIGNUP FORM */}
            {view === 'signup' && (
              <div className="space-y-4">
                <button type="button" onClick={() => { setError(''); setView('role-select'); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-1 mb-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Change role
                </button>

                <GoogleButton label="Sign up with Google" context="signup" />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or with email</span></div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Full Name *</Label>
                    <Input id="signup-name" placeholder="Your full name" value={signupName} onChange={e => setSignupName(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">Mobile Number *</Label>
                    <Input id="signup-phone" type="tel" placeholder="+91 98765 43210" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email (recommended)</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} className="h-11 pr-10" />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    {signupPassword.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(level => (
                            <div key={level} className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              signupPassword.length >= level * 3 
                                ? level <= 1 ? "bg-destructive" : level <= 2 ? "bg-warning" : "bg-success"
                                : "bg-muted"
                            )} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {signupPassword.length < 6 ? "Too short" : signupPassword.length < 8 ? "Fair" : signupPassword.length < 12 ? "Good" : "Strong"}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                  <p className="text-sm text-center text-muted-foreground pt-1">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setError(''); setView('login'); }} className="text-primary font-medium hover:underline">Sign in</button>
                  </p>
                </form>
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <button type="button" onClick={() => { setError(''); setView('login'); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-1 mb-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
        <p className="text-xs text-center text-muted-foreground/60 mt-3">
          Platform staff?{' '}
          <a href="/admin/login" className="underline hover:text-muted-foreground">Admin Portal</a>
        </p>
      </div>

      {/* Google role chooser — shown BEFORE OAuth so we know the user's
          intended role (Worker vs Employer) up front. */}
      <Dialog open={googleRoleOpen} onOpenChange={(open) => { if (!googleLoading) setGoogleRoleOpen(open); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {googleRoleContext === 'signup' ? 'Sign up with Google as' : 'Continue with Google as'}
            </DialogTitle>
            <DialogDescription>
              Choose how you want to use SafeWorkGlobal. You can only use one role per Google account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleGoogleRolePick(r.value)}
                disabled={googleLoading}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed',
                  r.color
                )}
              >
                <div className="shrink-0">
                  {googleLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : r.icon}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.description}</div>
                </div>
              </button>
            ))}
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Your selection determines which dashboard you'll land on after signing in.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
