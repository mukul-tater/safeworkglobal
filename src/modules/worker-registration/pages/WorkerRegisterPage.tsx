import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import RegistrationLayout from '../components/RegistrationLayout';
import FormField from '../components/FormField';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerApi } from '../services/workerApi';
import {
  workerRegisterSchema,
  type WorkerRegisterFormValues,
} from '../validation/registrationSchema';
import GoogleAuthButton, { AuthDivider } from '../components/GoogleAuthButton';
import { useFirebasePhoneOtp } from '../hooks/useFirebasePhoneOtp';
import { getOtpChannel } from '@/lib/otpConfig';

const phoneRegex = /^[6-9]\d{9}$/;

export default function WorkerRegisterPage() {
  const navigate = useNavigate();
  const { register: registerWorker, isAuthenticated } = useWorkerAuth();
  const firebaseOtp = useFirebasePhoneOtp();
  const useFirebase = getOtpChannel() === 'firebase';
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkerRegisterFormValues>({
    resolver: zodResolver(workerRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      otpToken: '',
    },
  });

  const mobileNumber = watch('mobileNumber');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSendOtp = async () => {
    const digits = mobileNumber.replace(/\D/g, '');
    if (!phoneRegex.test(digits)) {
      toast.error('Enter a valid 10-digit mobile number first');
      return;
    }

    setOtpSending(true);
    try {
      setValue('mobileNumber', digits);
      setOtpStep(true);
      setMobileVerified(false);
      setValue('otpToken', '');
      setOtp('');

      if (useFirebase) {
        await firebaseOtp.sendOtp(digits);
        toast.success('OTP sent to your mobile number');
      } else {
        const result = await workerApi.sendOtp(digits);
        toast.success(result.message, {
          description: result.demo ? 'Dev mode: enter any 6 digits' : undefined,
        });
      }
    } catch (err) {
      firebaseOtp.resetRecaptcha();
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const digits = mobileNumber.replace(/\D/g, '');
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setOtpVerifying(true);
    try {
      let result;
      if (useFirebase) {
        const idToken = await firebaseOtp.verifyOtp(otp);
        result = await workerApi.verifyFirebaseOtp(digits, idToken);
      } else {
        result = await workerApi.verifyOtp(digits, otp);
      }
      setValue('otpToken', result.otpToken, { shouldValidate: true });
      setMobileVerified(true);
      setOtpStep(false);
      toast.success('Mobile number verified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const onSubmit = async (values: WorkerRegisterFormValues) => {
    if (!values.otpToken) {
      toast.error('Verify your mobile number with OTP before continuing');
      return;
    }

    setSubmitting(true);
    const result = await registerWorker(values as Parameters<typeof registerWorker>[0]);
    setSubmitting(false);

    if (result.success) {
      toast.success('Account created! Complete your profile next.');
      navigate('/onboarding', { replace: true });
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <RegistrationLayout
      title="Create your worker account"
      subtitle="Sign up in under a minute. Add skills, location, and documents later."
      maxWidth="md"
      footer={
        <p className="pt-6 border-t border-border">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in to your account
          </Link>
        </p>
      }
    >
      <div id="worker-recaptcha" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="border-border/60 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-cyan-500" />
          <CardContent className="p-6 md:p-8 space-y-6">
            <GoogleAuthButton label="Sign up with Google" />
            <AuthDivider />

            <FormField label="Full Name" error={errors.fullName?.message} required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Your full name"
                  className="h-11 pl-10"
                  autoComplete="name"
                  {...register('fullName')}
                />
              </div>
            </FormField>

            <FormField label="Mobile Number" error={errors.mobileNumber?.message} required>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="h-11 pl-10"
                    disabled={mobileVerified}
                    {...register('mobileNumber', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                        if (mobileVerified) {
                          setMobileVerified(false);
                          setValue('otpToken', '');
                        }
                      },
                    })}
                  />
                </div>
                {mobileVerified ? (
                  <Button type="button" variant="secondary" className="h-11 shrink-0 gap-1.5" disabled>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Verified
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 shrink-0 px-4"
                    onClick={handleSendOtp}
                    disabled={otpSending || otpStep}
                  >
                    {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                  </Button>
                )}
              </div>
            </FormField>

            {otpStep && !mobileVerified && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter the OTP sent to <span className="font-medium text-foreground">{mobileNumber}</span>
                </p>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otp.length !== 6}
                  >
                    {otpVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify OTP'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setOtpStep(false);
                      setOtp('');
                    }}
                  >
                    Change number
                  </Button>
                </div>
              </div>
            )}

            <FormField label="Email Address" error={errors.email?.message} required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input type="email" placeholder="you@example.com" className="h-11 pl-10" {...register('email')} />
              </div>
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="h-11 pl-10 pr-10"
                  {...register('password')}
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
            </FormField>

            <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className="h-11 pl-10 pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            {errors.otpToken?.message && (
              <p className="text-sm text-destructive">{errors.otpToken.message}</p>
            )}

            <Button type="submit" className="w-full h-11 font-medium" disabled={submitting || !mobileVerified}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account & continue'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Skills, Aadhaar, and location can be added on the next screen.
            </p>
          </CardContent>
        </Card>
      </form>
    </RegistrationLayout>
  );
}
