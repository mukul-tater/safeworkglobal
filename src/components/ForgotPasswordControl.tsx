import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import DevOtpHint from '@/components/DevOtpHint';
import { GENERIC_RESET_SENT_MESSAGE, routePasswordReset } from '@/lib/passwordReset';
import { completeSmsPasswordReset } from '@/lib/passwordResetSms';
import { cn } from '@/lib/utils';
import {
  PASSWORD_HINT,
  passwordSignupIssue,
  sanitizePasswordInput,
} from '@/lib/validations/password';
import { useFirebasePhoneOtp } from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';

const FORGOT_SMS_BTN_ID = 'forgot-password-send-sms-btn';

type Step = 'identify' | 'otp' | 'password';

type Props = {
  loginPath: string;
  /** Prefill from the sign-in form (email only — mobile-only accounts cannot receive reset mail). */
  initialIdentifier?: string;
  title?: string;
  description?: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  identifierType?: 'email' | 'text';
  resolveAuthEmail?: (raw: string) => Promise<string | null>;
  triggerClassName?: string;
  className?: string;
};

export default function ForgotPasswordControl({
  loginPath,
  initialIdentifier = '',
  title = 'Reset password',
  description = "Enter the email you use to sign in. We'll send a secure link to set a new password. Mobile-only accounts get an SMS code instead.",
  identifierLabel = 'Email',
  identifierPlaceholder = 'you@example.com',
  identifierType = 'email',
  resolveAuthEmail,
  triggerClassName,
  className,
}: Props) {
  const firebaseOtp = useFirebasePhoneOtp(FORGOT_SMS_BTN_ID);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('identify');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [smsMobile, setSmsMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [idToken, setIdToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetFlow = () => {
    setStep('identify');
    setSmsMobile('');
    setOtp('');
    setOtpSent(false);
    setIdToken('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    firebaseOtp.resetRecaptcha();
  };

  useEffect(() => {
    if (!open) return;
    setIdentifier(initialIdentifier);
    resetFlow();
    // Reset only when the dialog opens, not when the OTP helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialIdentifier]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await routePasswordReset(identifier, { loginPath, resolveAuthEmail });
    setLoading(false);
    if (result.channel === 'error') {
      setError(result.error);
      return;
    }
    if (result.channel === 'email') {
      toast.success(GENERIC_RESET_SENT_MESSAGE);
      setOpen(false);
      setIdentifier('');
      return;
    }
    setSmsMobile(result.mobile);
    setStep('otp');
  };

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await firebaseOtp.sendOtp(smsMobile);
      setOtpSent(true);
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the SMS code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await firebaseOtp.verifyOtp(otp);
      setIdToken(token);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the SMS code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const strengthError = passwordSignupIssue(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await completeSmsPasswordReset(smsMobile, idToken, password);
    setLoading(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    toast.success('Password updated. Sign in with your new password.');
    setOpen(false);
    setIdentifier('');
  };

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('text-sm text-primary hover:underline', triggerClassName)}
      >
        Forgot password?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {step === 'identify' && description}
              {step === 'otp' && `We'll text a code to +91 ${smsMobile}. This number has no email inbox.`}
              {step === 'password' && `Choose a new password for +91 ${smsMobile}. ${PASSWORD_HINT}.`}
            </DialogDescription>
          </DialogHeader>

          {step === 'identify' && (
            <form onSubmit={handleIdentify} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-password-identifier">{identifierLabel}</Label>
                <Input
                  id="forgot-password-identifier"
                  type={identifierType}
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={identifierPlaceholder}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <DevOtpHint />
              <Button
                id={FORGOT_SMS_BTN_ID}
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => void handleSendOtp()}
              >
                {loading && !otpSent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {otpSent ? 'Resend SMS' : 'Send SMS code'}
              </Button>
              {otpSent && (
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}>
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
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setStep('identify'); setError(''); }}>
                  Back
                </Button>
                <Button type="submit" disabled={loading || !otpSent || otp.length !== 6}>
                  {loading && otpSent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify code
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="forgot-new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(sanitizePasswordInput(e.target.value))}
                    placeholder={PASSWORD_HINT}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgot-confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="forgot-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(sanitizePasswordInput(e.target.value))}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
