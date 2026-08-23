import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureEmitraPartnerAccess, resolveEmitraAuthEmail } from '../lib/emitraAuth';
import EmitraLayout from '../components/EmitraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { hasValidLspSession } from '@/modules/lsp/services/lspSession';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';
import AuthContinueIdentifier from '@/components/auth/AuthContinueIdentifier';
import AuthConflictPanel from '@/components/auth/AuthConflictPanel';
import {
  AUTH_CONTINUE_MESSAGES,
  buildAuthContinueRequest,
  continueAuth,
  type AuthContinueLocationState,
  type AuthIdentifierMethod,
} from '@/lib/authContinue';

type Step = 'identifier' | 'login' | 'conflict';

export default function EmitraLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role, refreshRole, loading: authLoading, profileLoading } = useAuth();
  const [step, setStep] = useState<Step>('identifier');
  const [method, setMethod] = useState<AuthIdentifierMethod>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [conflictMessage, setConflictMessage] = useState('');
  const [wrongPortal, setWrongPortal] = useState<'worker' | 'employer' | 'partner' | null>(null);

  const nextPath = searchParams.get('next') || '';

  const afterLoginPath = () => {
    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) return nextPath;
    if (hasValidLspSession()) return '/lsp/verify';
    return '/emitra/dashboard';
  };

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (isAuthenticated && role === 'partner') {
      navigate(afterLoginPath(), { replace: true });
    }
  }, [isAuthenticated, role, navigate, authLoading, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || (isAuthenticated && (profileLoading || role === 'partner'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const identifierValue = method === 'email' ? email : mobile;

  const handleContinue = async () => {
    setError('');
    const built = buildAuthContinueRequest('partner', method, email, mobile);
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setLoading(true);
    const result = await continueAuth(built.request);
    setLoading(false);
    if (result.nextStep === 'RATE_LIMITED' || result.nextStep === 'ERROR') {
      setError(result.error || AUTH_CONTINUE_MESSAGES.server);
      return;
    }
    if (result.nextStep === 'ACCOUNT_CONFLICT') {
      setConflictMessage(result.error || AUTH_CONTINUE_MESSAGES.conflict);
      setWrongPortal(null);
      setStep('conflict');
      return;
    }
    if (result.nextStep === 'WRONG_PORTAL') {
      setConflictMessage(result.error || AUTH_CONTINUE_MESSAGES.wrong_portal(result.portal));
      setWrongPortal(result.portal ?? null);
      setStep('conflict');
      return;
    }
    if (result.nextStep === 'SIGNUP') {
      const state: AuthContinueLocationState = {
        email: method === 'email' ? email.trim().toLowerCase() : '',
        mobile: method === 'mobile' ? mobile : '',
        method,
      };
      const registerTo = nextPath
        ? `/emitra/register?${searchParams.toString()}`
        : '/emitra/register';
      navigate(registerTo, { state });
      return;
    }
    setStep('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const authEmail = await resolveEmitraAuthEmail(identifierValue);
    if (!authEmail) {
      setError('Enter the email from your partner application, or your 10-digit mobile number.');
      setLoading(false);
      return;
    }

    const result = await login(authEmail, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }

    const access = await ensureEmitraPartnerAccess();
    if (!access.ok) {
      await supabase.auth.signOut();
      setError((access as { error?: string }).error || 'Access denied');
      setLoading(false);
      return;
    }

    await refreshRole();
    toast.success('Welcome back');
    navigate(afterLoginPath(), { replace: true });
    setLoading(false);
  };

  return (
    <EmitraLayout
      centered
      maxWidth="md"
      title="E-Mitra Partner"
      subtitle="Enter your mobile or email. We’ll take you to the next step."
    >
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6 md:p-8">
          {error && step !== 'conflict' && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'conflict' && (
            <AuthConflictPanel
              message={conflictMessage}
              portal={wrongPortal && wrongPortal !== 'partner' ? wrongPortal : null}
              onUseSingleIdentifier={() => {
                setStep('identifier');
                setConflictMessage('');
                setWrongPortal(null);
              }}
            />
          )}

          {step === 'identifier' && (
            <AuthContinueIdentifier
              method={method}
              onMethodChange={(next) => {
                setMethod(next);
                setError('');
              }}
              email={email}
              mobile={mobile}
              onEmailChange={setEmail}
              onMobileChange={setMobile}
              onSubmit={() => void handleContinue()}
              loading={loading}
              emailLabel="Email from your application"
              emailPlaceholder="partner@email.com"
              idPrefix="emitra"
            />
          )}

          {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Welcome back. Enter the password for {method === 'mobile' ? `+91 ${mobile}` : email.trim()}.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="emitra-password">Password</Label>
                  <ForgotPasswordControl
                    loginPath="/emitra/login"
                    initialIdentifier={identifierValue}
                    title="Reset partner password"
                    description="Enter the email from your partner application. We'll send a secure link to set a new password."
                    identifierLabel="Partner email"
                    identifierPlaceholder="partner@email.com"
                    identifierType="text"
                    triggerClassName="text-sm"
                    resolveAuthEmail={async (raw) => {
                      const authEmail = await resolveEmitraAuthEmail(raw);
                      if (!authEmail) {
                        throw new Error(
                          'Enter the email from your partner application, or your 10-digit mobile number.',
                        );
                      }
                      return authEmail;
                    }}
                  />
                </div>
                <Input
                  id="emitra-password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue
              </Button>
              <button
                type="button"
                data-inline
                onClick={() => {
                  setStep('identifier');
                  setPassword('');
                  setError('');
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                ← Use a different mobile or email
              </button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border space-y-2">
            <p>
              Trade test centre (SSVN)?{' '}
              <Link to="/partner/ssvn/login" className="text-primary font-medium hover:underline">
                Continue as SSVN
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </EmitraLayout>
  );
}
