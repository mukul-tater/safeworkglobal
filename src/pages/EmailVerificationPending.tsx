import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailVerificationPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isEmailVerified, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const autoSentRef = useRef(false);

  // If already verified, bounce to dashboard immediately.
  useEffect(() => {
    if (isEmailVerified) navigate('/dashboard', { replace: true });
  }, [isEmailVerified, navigate]);

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResent(true);
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  // Auto-send a verification email when the user lands here from a "Verify Email"
  // CTA (?send=1). Only runs once per mount, only if not already verified.
  useEffect(() => {
    if (autoSentRef.current) return;
    if (!user?.email || isEmailVerified) return;
    if (searchParams.get('send') !== '1') return;
    autoSentRef.current = true;
    handleResendEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, isEmailVerified, searchParams]);

  const handleCheckVerification = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        toast.error('Failed to check verification status');
        return;
      }

      if (data.user?.email_confirmed_at) {
        toast.success('Email verified! Redirecting...');
        // Force refresh the session to get updated user data
        await supabase.auth.refreshSession();
        navigate('/dashboard');
      } else {
        toast.info('Email not yet verified. Please check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to check verification status');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{' '}
            <span className="font-medium text-foreground">{user?.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-muted/50 border-muted">
            <AlertDescription className="text-sm text-muted-foreground">
              Click the link in your email to verify your account and complete your registration. 
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckVerification} 
              className="w-full"
              variant="default"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              I've Verified My Email
            </Button>

            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={resending || resent}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
              {resent ? 'Email Sent!' : 'Resend Verification Email'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Didn't receive the email? Check your spam folder or try a different email address.
            </p>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
