import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { GENERIC_RESET_SENT_MESSAGE, requestPasswordReset } from '@/lib/passwordReset';
import { cn } from '@/lib/utils';

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
  description = "Enter the email you use to sign in. We'll send a secure link to set a new password.",
  identifierLabel = 'Email',
  identifierPlaceholder = 'you@example.com',
  identifierType = 'email',
  resolveAuthEmail,
  triggerClassName,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setIdentifier(initialIdentifier);
    setError('');
  }, [open, initialIdentifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await requestPasswordReset(identifier, { loginPath, resolveAuthEmail });
    setLoading(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    toast.success(GENERIC_RESET_SENT_MESSAGE);
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
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                Send reset link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
