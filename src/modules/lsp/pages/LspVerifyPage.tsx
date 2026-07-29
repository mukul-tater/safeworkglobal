import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

type Step = 'emitra' | 'otp' | 'done';

export default function LspVerifyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, loading: authLoading } = useAuth();
  const session = getLspSession();

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

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobile.replace(/\D/g, '');
    if (!emitraId.trim()) {
      setError('Enter your E-Mitra ID');
      return;
    }
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    // Demo OTP path (same as /emitra/login until production SMS is wired on this route)
    toast.success(`OTP sent to ${digits}`, { description: 'Demo: enter any 6 digits' });
    setStep('otp');
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
      const profile = await getPartnerProfile(user.id);

      if (!profile) {
        toast.message('No partner profile yet — complete registration');
        navigate(`/emitra/register?source_lsp=${encodeURIComponent(session.code)}`, { replace: true });
        return;
      }

      if (profile.emitra_id && profile.emitra_id.trim().toLowerCase() !== emitraId.trim().toLowerCase()) {
        setError('E-Mitra ID does not match your partner profile.');
        setLoading(false);
        return;
      }

      const { data: bind, error: bindErr } = await (supabase as any).rpc('bind_partner_to_lsp', {
        p_lsp_id: session.lspId,
        p_emitra_id: emitraId.trim(),
      });

      if (bindErr) {
        setError(bindErr.message);
        setLoading(false);
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
        setLoading(false);
        return;
      }

      toast.success(`Verified via ${session.name}`);
      setStep('done');
      navigate('/emitra/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
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
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Send OTP</Button>
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
                <Label>Enter OTP</Label>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('emitra')}>
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
