import { useCallback, useEffect, useState } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { Download, FileSignature, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { getFirebaseAuth } from '@/lib/firebase';
import { isValidIndianMobile, normalizeIndianMobile } from '@/lib/validations/common';
import StageActionShell from '@/modules/worker-verification/components/journey/StageActionShell';
import StageWaitingShell from '@/modules/worker-verification/components/journey/StageWaitingShell';
import { useFirebasePhoneOtp } from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import {
  acceptJobOffer,
  declineJobOffer,
  getJobOffer,
  markOfferDownloaded,
  offerDownloaded,
  offerFileReady,
  offerLetterSignedUrl,
  type JobOfferLetter,
} from '@/modules/worker-verification/services/offerLetterService';
import type { WorkerVerification } from '@/modules/worker-verification/types';

const OTP_BUTTON_ID = 'offer-letter-send-otp';

function phoneTail(phone: string | null | undefined): string {
  const digits = normalizeIndianMobile(phone || '');
  return digits.length >= 4 ? digits.slice(-4) : '';
}

interface Props {
  userId: string;
  phone?: string | null;
  onAccepted: (next: WorkerVerification) => void;
}

export default function OfferLetterStage({ userId, phone, onAccepted }: Props) {
  const firebaseOtp = useFirebasePhoneOtp(OTP_BUTTON_ID);
  const [letter, setLetter] = useState<JobOfferLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');

  const load = useCallback(async () => {
    const next = await getJobOffer(userId);
    setLetter(next);
    return next;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await load();
        if (!cancelled) {
          setLetter(next);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Could not load the offer letter';
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const mobile = normalizeIndianMobile(phone || '');
  const mobileOk = isValidIndianMobile(mobile);
  const ready = offerFileReady(letter);
  const downloaded = offerDownloaded(letter);
  const declined = letter?.status === 'declined';

  const onDownload = async () => {
    setBusy(true);
    try {
      const next = await markOfferDownloaded(userId);
      setLetter(next);
      if (next.storage_path) {
        const url = await offerLetterSignedUrl(next.storage_path);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not download the offer letter');
    } finally {
      setBusy(false);
    }
  };

  const onDecline = async () => {
    setBusy(true);
    try {
      const next = await declineJobOffer(userId);
      setLetter(next);
      setOtpStep(false);
      setOtp('');
      toast.success('Offer declined. Payment stays closed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not decline the offer');
    } finally {
      setBusy(false);
    }
  };

  const onSendOtp = async () => {
    if (!mobileOk) {
      toast.error('This account has no mobile number for the acceptance code.');
      return;
    }
    setBusy(true);
    try {
      await firebaseOtp.sendOtp(mobile, { requireRealSms: true });
      setOtpStep(true);
      setOtp('');
      toast.success(`Code sent to the mobile ending ${phoneTail(mobile)}`);
    } catch (e) {
      firebaseOtp.clearVerifierOnly();
      toast.error(e instanceof Error ? e.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      const idToken = await firebaseOtp.verifyOtp(otp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* Firebase only proved the phone */
      }
      const next = await acceptJobOffer(userId, idToken);
      toast.success('Offer letter accepted. You can pay the service fee now.');
      onAccepted(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not accept the offer letter');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading offer letter…
      </div>
    );
  }

  if (loadError) {
    return (
      <StageWaitingShell
        icon={FileSignature}
        title="Offer letter"
        body={loadError}
      />
    );
  }

  if (!letter?.job_id) {
    return (
      <StageWaitingShell
        icon={FileSignature}
        title="Offer letter"
        body="Your current job is not linked yet, so there is no offer letter to download. Payment stays closed."
      />
    );
  }

  if (!ready) {
    return (
      <StageWaitingShell
        icon={FileSignature}
        title="Offer letter is being prepared"
        body={
          <>
            <p>
              Your video interview is cleared
              {letter.job_title ? ` for ${letter.job_title}` : ''}. The offer letter will appear here when it is ready.
            </p>
            <p className="mt-2">The service fee stays closed until you download that letter and accept it.</p>
          </>
        }
        expected="SafeWork or the employer uploads the PDF"
        notifyNote="Refresh this page after you are told the letter is ready. Nothing is payable before you accept it."
        timeline={[
          { label: 'Video interview cleared', status: 'done' },
          { label: 'Offer letter being prepared', status: 'current' },
          { label: 'Download and accept with OTP', status: 'pending' },
          { label: 'Service fee', status: 'pending' },
        ]}
      />
    );
  }

  return (
    <StageActionShell
      icon={FileSignature}
      title="Offer letter"
      description={
        letter.job_title
          ? `Download the offer letter for ${letter.job_title}, then accept it with a code sent to the mobile already on your account.`
          : 'Download the offer letter, then accept it with a code sent to the mobile already on your account.'
      }
      footer={
        <>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void onDownload()}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            Download offer letter
          </Button>
          {letter.status !== 'accepted' && (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onDecline()}>
              Decline
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p>
          File: <span className="font-medium text-foreground">{letter.file_name}</span>
        </p>
        {declined && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            You declined this letter. Payment stays closed. You can still accept this same file with the code.
          </p>
        )}
        {!downloaded && (
          <p className="text-muted-foreground">
            Accept stays off until this version has been downloaded once.
          </p>
        )}
        {downloaded && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
            <p>
              The code goes to the mobile ending{' '}
              <span className="font-medium text-foreground">{phoneTail(mobile) || '—'}</span>.
              A different number cannot be entered here.
            </p>
            {!mobileOk && (
              <p className="text-destructive">This account has no mobile number, so the offer cannot be accepted.</p>
            )}
            {!otpStep ? (
              <Button
                id={OTP_BUTTON_ID}
                type="button"
                disabled={busy || !mobileOk}
                onClick={() => void onSendOtp()}
              >
                {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Accept with OTP
              </Button>
            ) : (
              <div className="space-y-3">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={busy || otp.length !== 6} onClick={() => void onConfirm()}>
                    {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Confirm acceptance
                  </Button>
                  <Button
                    id={OTP_BUTTON_ID}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void onSendOtp()}
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StageActionShell>
  );
}
