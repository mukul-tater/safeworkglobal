import { useState } from 'react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { isValidContactEmail } from '@/lib/workerAuthEmail';
import StageActionShell from '@/modules/worker-verification/components/journey/StageActionShell';

interface Props {
  initialEmail?: string;
  saving?: boolean;
  onSave: (email: string) => Promise<void>;
}

export default function WorkerEmailGate({ initialEmail = '', saving = false, onSave }: Props) {
  const [value, setValue] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const pending = busy || saving;

  const submit = async () => {
    const email = value.trim().toLowerCase();
    if (!isValidContactEmail(email)) {
      toast.error('Enter a real email address before continuing');
      return;
    }
    setBusy(true);
    try {
      await onSave(email);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StageActionShell
      icon={Mail}
      title="Email required / ईमेल ज़रूरी"
      description="Enter a real email before pre-declaration. We will notify you here as you clear each journey step."
      timeEstimate="Takes less than a minute"
      footer={
        <Button className="w-full sm:w-auto" onClick={() => void submit()} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Continue to pre-declaration <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="journey-contact-email">Email *</Label>
        <Input
          id="journey-contact-email"
          type="email"
          autoComplete="email"
          placeholder="you@gmail.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Do not use a temporary mobile-login address. We send step updates from SafeWork Global.
        </p>
      </div>
    </StageActionShell>
  );
}
