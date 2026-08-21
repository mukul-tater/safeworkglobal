import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Phone, ShieldCheck, UserPlus, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ApprovedPartnerGate, { useApprovedPartner } from '../components/ApprovedPartnerGate';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import { WORKER_SKILLS } from '../config/constants';
import { indianStates } from '@/lib/validations/partner';
import { isValidIndianMobile } from '@/lib/validations/common';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import { createVerifiedWorkerAccount } from '@/modules/worker-registration/lib/createVerifiedWorkerAccount';
import { WORKER_TERMS_SUMMARY } from '@/modules/worker-verification/constants';
import WorkerTermsDialog from '@/components/WorkerTermsDialog';

type Step = 'form' | 'otp' | 'done';

function Inner() {
  const { partnerId, emitraId } = useApprovedPartner();
  const navigate = useNavigate();
  const firebaseOtp = useFirebasePhoneOtp();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [state, setState] = useState('');
  const [otp, setOtp] = useState('');
  const [createdMobile, setCreatedMobile] = useState('');

  useEffect(() => {
    if (step !== 'otp') return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return 'Enter the worker full name';
    if (!isValidIndianMobile(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    if (!firebaseOtp.isAvailable) {
      return 'Phone SMS verification is not configured. Ask admin to add Firebase Phone Auth keys.';
    }
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!primarySkill) return 'Select a primary skill';
    if (!state) return 'Select state';
    if (!acceptedTerms) return 'Worker must agree to the terms and declarations';
    if (!partnerId) return 'Partner profile not ready';
    return null;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const digits = mobile.replace(/\D/g, '');
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

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit SMS code');
      return;
    }
    if (!partnerId) {
      setError('Partner profile not ready');
      return;
    }

    setLoading(true);
    try {
      await firebaseOtp.verifyOtp(otp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }

      const created = await createVerifiedWorkerAccount({
        fullName: name.trim(),
        mobile,
        password,
        country: 'India',
        source: { type: 'emitra', partnerProfileId: partnerId },
        preserveCallerSession: true,
        profileSeed: {
          primary_work_type: primarySkill,
          state,
        },
      });

      setCreatedMobile(created.mobile);
      setStep('done');
      toast.success(`${name.trim()} can now log in as a worker`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create worker account');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      await firebaseOtp.sendOtp(digits);
      toast.success(`New code sent to +91 ${digits}`);
    } catch (err) {
      firebaseOtp.resetRecaptcha();
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setName('');
    setMobile('');
    setPassword('');
    setConfirmPassword('');
    setPrimarySkill('');
    setState('');
    setOtp('');
    setAcceptedTerms(false);
    setError('');
    setCreatedMobile('');
    firebaseOtp.resetRecaptcha();
  };

  return (
    <DashboardLayout
      navGroups={emitraNavGroups}
      portalLabel="E-Mitra Portal"
      portalName="SafeWork Global"
      profileMenuItems={emitraProfileMenu}
    >
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <UserPlus className="h-6 w-6" /> Register Worker
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Same worker account as self-signup: Firebase SMS OTP, password, then the worker can log in
        anytime. This registration is linked to your center
        {emitraId ? ` (${emitraId})` : ''}.
      </p>

      <Card className="max-w-lg border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'form' && (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="w-name">Full Name</Label>
                <Input
                  id="w-name"
                  className="h-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Worker full name"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="w-mobile"
                    className="h-11 pl-10"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  SMS OTP via Firebase (+91). Worker will use this mobile to log in.
                </p>
                {!firebaseOtp.isAvailable && (
                  <p className="text-xs text-amber-600">
                    SMS OTP needs Firebase Phone Auth keys before registration can continue.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="w-password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-confirm">Confirm Password</Label>
                <Input
                  id="w-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Primary Skill</Label>
                <Select value={primarySkill} onValueChange={setPrimarySkill}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKER_SKILLS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {indianStates.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <span className="text-xs leading-snug">
                    Worker agrees to the terms and declarations.{' '}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsOpen(true);
                      }}
                    >
                      Read full terms
                    </button>
                  </span>
                </label>
              </div>

              <Button
                id={WORKER_OTP_RECAPTCHA_BTN_ID}
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send SMS code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyAndCreate} className="space-y-5">
              <div className="text-center">
                <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Enter the 6-digit SMS code sent to</p>
                <p className="font-semibold mt-0.5">+91 {mobile}</p>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Didn&apos;t get the code?{' '}
                <button
                  id={WORKER_OTP_RECAPTCHA_BTN_ID}
                  type="button"
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                  disabled={loading}
                  onClick={() => void handleResendOtp()}
                >
                  Resend SMS
                </button>
              </p>
              <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify & create worker account
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setError('');
                  firebaseOtp.resetRecaptcha();
                }}
              >
                Change details
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center py-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Worker account ready</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{name}</span> is onboarded and approved.
                  They can sign in at Worker Login with mobile{' '}
                  <span className="font-medium text-foreground">+91 {createdMobile}</span>{' '}
                  and the password you set. Linked to your E-Mitra center.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" className="flex-1" onClick={resetForm}>
                  Register another
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/emitra/my-workers')}
                >
                  View my workers
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkerTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAgree={() => setAcceptedTerms(true)}
        description="Confirm the worker has agreed before continuing."
        agreeLabel="Worker agrees"
      />
    </DashboardLayout>
  );
}

export default function EmitraOnboardWorkerPage() {
  return (
    <ApprovedPartnerGate>
      <Inner />
    </ApprovedPartnerGate>
  );
}
