import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable';
import type { AppRole } from '@/contexts/AuthContext';

interface Props {
  label?: string;
  /** Role assigned after OAuth when the account has no role yet. */
  role?: AppRole;
  /** Called before redirecting to Google (e.g. stash partial form fields). */
  onBeforeOAuth?: () => void;
}

/** Lovable Google OAuth — same flow as /auth and QuickWorkerSignup. */
export default function GoogleAuthButton({
  label = 'Continue with Google',
  role = 'worker',
  onBeforeOAuth,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      onBeforeOAuth?.();
      sessionStorage.setItem('pending_oauth_role', role);
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem('pending_oauth_role');
        toast.error('Google sign-in failed');
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem('pending_oauth_role');
      toast.error('Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2 font-medium"
      onClick={handleGoogle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {label}
    </Button>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">OR</span>
      </div>
    </div>
  );
}
