import { Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthIdentifierMethod } from '@/lib/authContinueCore';

type Props = {
  method: AuthIdentifierMethod;
  onMethodChange: (method: AuthIdentifierMethod) => void;
  email: string;
  mobile: string;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  methods?: AuthIdentifierMethod[];
  emailLabel?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
  idPrefix?: string;
};

export default function AuthContinueIdentifier({
  method,
  onMethodChange,
  email,
  mobile,
  onEmailChange,
  onMobileChange,
  onSubmit,
  loading = false,
  disabled = false,
  methods = ['mobile', 'email'],
  emailLabel = 'Email',
  emailPlaceholder = 'you@example.com',
  submitLabel = 'Continue',
  idPrefix = 'auth',
}: Props) {
  const showTabs = methods.length > 1;
  const active = methods.includes(method) ? method : methods[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3.5"
      noValidate
    >
      {showTabs && (
        <div
          role="tablist"
          aria-label="Continue with mobile or email"
          className="grid h-11 w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {methods.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active === item}
              data-inline
              onClick={() => onMethodChange(item)}
              className={`inline-flex h-full min-h-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                active === item
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item === 'mobile' ? <Phone className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
              {item === 'mobile' ? 'Mobile' : 'Email'}
            </button>
          ))}
        </div>
      )}

      {active === 'mobile' ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-mobile`}>Mobile number</Label>
          <div className="flex h-11 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              +91
            </span>
            <Input
              id={`${idPrefix}-mobile`}
              type="tel"
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              className="h-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              autoComplete="tel"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`}>{emailLabel}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${idPrefix}-email`}
              type="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              className="h-11 pl-10"
              autoComplete="email"
            />
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
        disabled={loading || disabled}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
