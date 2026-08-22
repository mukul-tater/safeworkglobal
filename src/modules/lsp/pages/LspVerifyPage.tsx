import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getPartnerProfile } from '@/modules/emitra/services/emitraService';
import { getLspSession, clearLspSession } from '../services/lspSession';
import { LSP_DENY_REASONS } from '../types/lsp.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';

type Step = 'emitra' | 'otp' | 'done';

export default function LspVerifyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, loading: authLoading } = useAuth();
  const session = getLspSession();
  const firebaseOtp = useFirebasePhoneOtp();

  const [step, setStep] = useState<Step>('emitra');
  const [emitraId, setEmitraId] = useState(session?.emitraId || '');
  const [mobile, setMobile] = useState(session?.mobile || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      navigate(`/lsp/denied?reason=${encodeURIComponent('no_session')}`, { replace: true });
      return;
    }

    if (!isAuthenticated) {
      navigate('/emitra/login?next=/lsp/verify', { replace: true });
      return;
    }

    if (role && role !== 'partner') {
      setError('This LSP entry is for E-Mitra partners only.');
    }
  }, [authLoading, isAuthenticated, role, session, navigate]);

  useEffect(() => {
    if (session?.emitraId) setEmitraId(session.emitraId);
    if (session?.mobile) setMobile(session.mobile);
  }, [session?.emitraId, session?.mobile]);

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (!emitraId.trim()) {
      setError('Enter your E-Mitra ID');
      return;
    }
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

  const completeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    if (!user || !session) return;

    setLoading(true);
    try {
      await firebaseOtp.verifyOtp(otp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore — Firebase session only used for OTP */
      }

      const profile = await getPartnerProfile(user.id);

      if (!profile) {
        toast.message('No partner profile yet — complete registration');
        navigate(`/emitra/register?source_lsp=${encodeURIComponent(session.code)}`, { replace: true });
        return;
      }

      if (profile.emitra_id && profile.emitra_id.trim().toLowerCase() !== emitraId.trim().toLowerCase()) {
        setError('E-Mitra ID does not match your partner profile.');
        return;
      }

      const digits = mobile.replace(/\D/g, '');
      if (profile.mobile && profile.mobile.replace(/\D/g, '') !== digits) {
        setError('Mobile number does not match your partner profile.');
        return;
      }

      const { data: bind, error: bindErr } = await (supabase as any).rpc('bind_partner_to_lsp', {
        p_lsp_id: session.lspId,
        p_emitra_id: emitraId.trim(),
      });

      if (bindErr) {
        setError(bindErr.message);
        return;
      }
      if (!bind?.ok) {
        const reason = bind?.reason || 'partner_not_approved';
        setError(
          reason === 'emitra_mismatch'
            ? 'E-Mitra ID does not match your partner profile.'
            : reason === 'partner_not_approved'
              ? 'Your partner application is not approved yet.'
              : reason === 'no_profile'
                ? 'No partner profile found.'
                : 'Could not bind LSP session.',
        );
        return;
      }

      toast.success(`Verified via ${session.name}`);
      setStep('done');
      navigate('/emitra/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md w-full border-border/60 shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Confirm partner identity</h1>
              <p className="text-sm text-muted-foreground mt-1">
                You opened SafeWork via <span className="font-medium text-foreground">{session.name}</span>
                {' '}({session.code}). Verify your E-Mitra ID and mobile to continue.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'emitra' && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emitra-id">E-Mitra ID</Label>
                <Input
                  id="emitra-id"
                  value={emitraId}
                  onChange={(e) => setEmitraId(e.target.value)}
                  placeholder="Your E-Mitra ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verify-mobile">Mobile</Label>
                <Input
                  id="verify-mobile"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send a 6-digit SMS code to verify your number.
                </p>
              </div>
              <Button
                id={WORKER_OTP_RECAPTCHA_BTN_ID}
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                New partner?{' '}
                <Link
                  className="text-primary underline"
                  to={`/emitra/register?source_lsp=${encodeURIComponent(session.code)}`}
                >
                  Apply here
                </Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={completeVerify} className="space-y-4">
              <div className="space-y-2">
                <Label>Enter SMS OTP</Label>
                <p className="text-sm text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">+91 {mobile}</span>
                </p>
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
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
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
                  setStep('emitra');
                  setOtp('');
                  setError('');
                  firebaseOtp.resetRecaptcha();
                }}
              >
                Back
              </Button>
            </form>
          )}

          <button
            type="button"
            className="text-xs text-muted-foreground underline w-full"
            onClick={() => {
              clearLspSession();
              navigate(`/lsp/denied?reason=${encodeURIComponent('no_session')}`);
            }}
          >
            Clear LSP session ({LSP_DENY_REASONS.no_session})
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
