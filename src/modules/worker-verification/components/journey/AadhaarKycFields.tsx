import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendAadhaarOtp, verifyAadhaarOtp } from '@/modules/worker-verification/services/aadhaarOtpService';

export function AadhaarKycFields({
  partnerSourced,
  partnerKiosk,
  last4,
  verified,
  disabled,
  inPersonConfirmed,
  onLast4Change,
  onVerified,
  onInPersonChange,
}: {
  partnerSourced: boolean;
  partnerKiosk: boolean;
  last4: string;
  verified: boolean;
  disabled?: boolean;
  inPersonConfirmed: boolean;
  onLast4Change: (value: string) => void;
  onVerified: (last4: string) => void;
  onInPersonChange: (value: boolean) => void;
}) {
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockHint, setMockHint] = useState(false);
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    setBusy('send');
    try {
      const res = await sendAadhaarOtp(aadhaar);
      setOtpSent(true);
      setMockHint(res.mock);
      onLast4Change(res.last4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setBusy(null);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setBusy('verify');
    try {
      const res = await verifyAadhaarOtp(otp);
      setAadhaar('');
      setOtp('');
      onVerified(res.last4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify OTP');
    } finally {
      setBusy(null);
    }
  };

  if (partnerSourced) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
        <p className="text-sm font-medium text-foreground">Aadhaar (last 4 digits) *</p>
        <p className="text-xs text-muted-foreground">
          We do not store the full Aadhaar number or a photo of the card. Staff will check the original
          Aadhaar at the centre.
        </p>
        <div className="space-y-1.5 max-w-[12rem]">
          <Label>Last 4 digits *</Label>
          <Input
            value={last4}
            onChange={(e) => onLast4Change(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            disabled={disabled || verified}
          />
        </div>
        {verified ? (
          <p className="text-xs text-success inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified in person{last4 ? ` · XXXX XXXX ${last4}` : ''}
          </p>
        ) : partnerKiosk ? (
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={inPersonConfirmed}
              disabled={disabled}
              onChange={(e) => onInPersonChange(e.target.checked)}
            />
            <span>
              I have seen this worker&apos;s original Aadhaar. The last 4 digits match, and the photo is
              this person. I am not scanning or uploading the card.
            </span>
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            Bring the original Aadhaar to the partner / trade-test centre. Staff will verify it in person.
          </p>
        )}
      </div>
    );
  }

  if (verified) {
    return (
      <div className="space-y-1 rounded-xl border border-border bg-muted/20 p-3">
        <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-success" />
          Aadhaar verified by OTP
        </p>
        <p className="text-xs text-muted-foreground">
          On file: XXXX XXXX {last4 || '••••'}. Full number and card photo are not stored.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-sm font-medium text-foreground">Verify Aadhaar with OTP *</p>
      <p className="text-xs text-muted-foreground">
        OTP is sent to the mobile number linked with Aadhaar (UIDAI). We do not save the 12-digit number
        or a photo of the card — only last 4 digits after a successful OTP.
      </p>
      <div className="space-y-1.5">
        <Label>Aadhaar number *</Label>
        <Input
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="12-digit Aadhaar"
          inputMode="numeric"
          maxLength={12}
          disabled={disabled || otpSent}
          autoComplete="off"
        />
      </div>
      {!otpSent ? (
        <Button type="button" variant="outline" size="sm" disabled={disabled || busy !== null} onClick={() => void sendOtp()}>
          {busy === 'send' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
          Send OTP
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1.5 max-w-[12rem]">
            <Label>OTP *</Label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digits"
              inputMode="numeric"
              maxLength={6}
              disabled={disabled}
            />
          </div>
          {mockHint ? (
            <p className="text-[11px] text-muted-foreground">Test mode: use OTP 123456</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">OTP is valid for about 10 minutes.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={disabled || busy !== null} onClick={() => void verifyOtp()}>
              {busy === 'verify' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy !== null}
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setAadhaar('');
              }}
            >
              Use a different Aadhaar
            </Button>
          </div>
        </div>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
