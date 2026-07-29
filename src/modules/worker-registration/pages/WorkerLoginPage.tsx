import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import RegistrationLayout from '../components/RegistrationLayout';
import FormField from '../components/FormField';
import GoogleAuthButton, { AuthDivider } from '../components/GoogleAuthButton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerLoginSchema, type WorkerLoginFormValues } from '../validation/registrationSchema';

export default function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useWorkerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerLoginFormValues>({
    resolver: zodResolver(workerLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: WorkerLoginFormValues) => {
    setError('');
    setSubmitting(true);
    const result = await login({
      email: values.email.trim(),
      password: values.password,
    });
    setSubmitting(false);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/home', { replace: true });
    } else {
      const message = result.error || 'Login failed. Check your credentials.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <RegistrationLayout
      centered
      maxWidth="md"
      title="Worker Login"
      subtitle="Sign in with Google or email to access jobs and track your application."
      footer={
        <p className="pt-6 border-t border-border">
          New worker?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register now
          </Link>
        </p>
      }
    >
      <Card className="border-border/60 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-cyan-500" />
        <CardContent className="p-6 md:p-8">
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <GoogleAuthButton label="Sign in with Google" />
          <AuthDivider />

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField label="Email Address" error={errors.email?.message} required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 pl-10"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  className="h-11 pl-10 pr-10"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" className="w-full h-11 font-medium" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Worker Portal'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </RegistrationLayout>
  );
}
