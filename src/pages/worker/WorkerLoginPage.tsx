import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, HardHat, Lock, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isValidIndianMobile } from '@/lib/validations/common';
import {
  workerAuthEmailFromIdentifier,
  workerAuthEmailFromMobile,
} from '@/lib/workerAuthEmail';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '@/lib/workerPortalAccess';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';
import {
  WORKER_TERMS_FULL,
  WORKER_TERMS_SUMMARY,
} from '@/modules/worker-verification/constants';

type LoginMethod = 'mobile' | 'email';

async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  try {
    const { data, error } = await (supabase as any).rpc('resolve_worker_auth_email', {
      p_identifier: trimmed,
    });
    if (!error && data) return String(data);
  } catch {
    /* RPC optional until migration is applied */
  }
  return workerAuthEmailFromIdentifier(trimmed);
}

/**
 * Worker sign-in — Mobile or Email + password + terms acceptance.
 */
export default function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, isMobileVerified, profileLoading } = useAuth();
  const [method, setMethod] = useState<LoginMethod>('mobile');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileLoading) return;
    if (isAuthenticated && role === 'worker') {
      navigate(isMobileVerified ? '/worker/dashboard' : '/worker/bind-mobile', { replace: true });
    }
  }, [isAuthenticated, role, isMobileVerified, profileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('Please agree to the terms and declarations to continue');
      return;
    }

    let authEmail = '';
    if (method === 'mobile') {
      if (!isValidIndianMobile(mobile)) {
        setError('Enter a valid 10-digit Indian mobile number');
        return;
      }
      authEmail = workerAuthEmailFromMobile(mobile);
    } else {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError('Please enter a valid email');
        return;
      }
      const resolved = await resolveAuthEmail(email.trim());
      if (!resolved) {
        setError('No worker account found for this email');
        return;
      }
      authEmail = resolved;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await login(authEmail, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (roleRow?.role && roleRow.role !== 'worker') {
        await supabase.auth.signOut();
        setError(
          `This account is registered as a ${roleRow.role}. Please sign in from the correct portal.`,
        );
        setLoading(false);
        return;
      }

      const reviewBlock = await getEmitraReviewBlockMessage(user.id);
      if (reviewBlock) {
        await supabase.auth.signOut();
        setError(reviewBlock);
        setLoading(false);
        return;
      }

      const ready = await isWorkerGccReady(user.id);
      if (!ready) {
        try {
          await getOrCreateVerification(user.id);
        } catch {
          /* journey row optional for redirect */
        }
        toast.success('Welcome back — continue your verification');
        navigate('/worker/journey', { replace: true });
        setLoading(false);
        return;
      }
    }
    toast.success('Welcome back!');
    navigate('/worker/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-mesh)' }} />
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-4">
            <HardHat className="h-7 w-7 text-success" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Worker Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose mobile or email, enter your password, and continue.
          </p>
        </div>

        <div className="mb-4 mx-auto w-fit flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <HardHat className="h-3.5 w-3.5" />
          Signing in as a Worker
        </div>

        <Card className="shadow-lg border-border/60 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-success via-success/80 to-primary" />
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs
              value={method}
              onValueChange={(v) => {
                setMethod(v as LoginMethod);
                setError('');
              }}
              className="mb-4"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="mobile" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Mobile
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {method === 'mobile' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="worker-mobile">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="worker-mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className="h-11 pl-10"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="worker-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="worker-email"
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
              )}

              <div className="space-y-1.5">
                <Label htmlFor="worker-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="worker-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 pl-10 pr-10"
                    autoComplete="current-password"
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

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{WORKER_TERMS_SUMMARY}</p>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(v) => {
                      const on = !!v;
                      setAcceptedTerms(on);
                      if (on) setTermsOpen(true);
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground leading-snug">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="text-primary font-medium underline-offset-2 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsOpen(true);
                      }}
                    >
                      terms &amp; declarations
                    </button>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading || !acceptedTerms}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground pt-4 mt-4 border-t border-border">
              New worker?{' '}
              <Link to="/worker/quick-signup" className="text-primary font-medium hover:underline">
                Create your profile
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Hiring workers?{' '}
          <Link to="/employer/login" className="text-primary hover:underline">Employer sign in</Link>
          {' · '}
          <Link to="/emitra/login" className="text-primary hover:underline">Partner sign in</Link>
        </p>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker terms &amp; declarations</DialogTitle>
            <DialogDescription>
              Please review these terms before signing in.
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
  );
}
