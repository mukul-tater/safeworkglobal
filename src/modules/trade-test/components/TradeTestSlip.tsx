import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import type { AssessmentRow } from '@/modules/trade-test/types';
import {
  appliedForLine,
  jobPlaceLine,
  slipIntroLine,
  slipStatusLabel,
  testTodayLine,
  tradeLabel,
  workerReference,
} from '@/modules/trade-test/lib/slipCopy';

export function tradeTestSlipUrl(reference: string): string {
  const next = `/partner/ssvn/checkin?ref=${encodeURIComponent(reference)}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safeworkglobal.com';
  return `${origin}/partner/ssvn/login?next=${encodeURIComponent(next)}`;
}

type Props = {
  assessment: AssessmentRow;
  workerName: string;
  workerPhone?: string | null;
  avatarUrl?: string | null;
};

export default function TradeTestSlip({ assessment, workerName, workerPhone, avatarUrl }: Props) {
  const trade = tradeLabel(assessment.primary_skill, assessment.job_title);
  const reference = assessment.booking_reference || 'Pending';
  const photo = avatarUrl || assessment.worker_avatar_url || null;
  const place = jobPlaceLine({
    location: assessment.job_location,
    country: assessment.job_country,
  });
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!assessment.booking_reference) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(tradeTestSlipUrl(assessment.booking_reference), {
      margin: 1,
      width: 180,
    }).then((url) => {
      if (!cancelled) setQr(url);
    }).catch(() => {
      if (!cancelled) setQr(null);
    });
    return () => {
      cancelled = true;
    };
  }, [assessment.booking_reference]);

  const issued = assessment.slip_issued_at || assessment.created_at;

  return (
    <div id="trade-test-slip" className="rounded-xl border bg-card p-4 space-y-4 print:border-black">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #trade-test-slip, #trade-test-slip * { visibility: visible; }
          #trade-test-slip { position: absolute; inset: 0; width: 100%; background: white; }
        }
      `}</style>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">SafeWork Global</p>
          <h3 className="text-lg font-semibold">Trade test slip</h3>
          <p className="text-sm font-medium mt-2">{appliedForLine(trade)}</p>
          <p className="text-sm font-medium">{testTodayLine(trade)}</p>
          <p className="text-sm text-muted-foreground mt-1">{slipIntroLine(trade)}</p>
        </div>
        {qr ? (
          <img src={qr} alt={`QR code for ${reference}`} className="h-28 w-28 shrink-0" />
        ) : null}
      </div>

      <p className="text-2xl font-bold tracking-wide">{reference}</p>
      <p className="text-sm">
        <span className="text-muted-foreground">Status: </span>
        {slipStatusLabel(assessment.status)}
        {issued ? (
          <span className="text-muted-foreground">
            {' '}
            · Issued {new Date(issued).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </span>
        ) : null}
      </p>

      <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
        {photo ? (
          <img src={photo} alt="" className="h-16 w-16 rounded-md object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-md border bg-muted" />
        )}
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Name: </span>{workerName}</p>
          <p><span className="text-muted-foreground">Mobile: </span>{workerPhone || '—'}</p>
          <p><span className="text-muted-foreground">Worker reference: </span>{workerReference(assessment.worker_id)}</p>
          <p><span className="text-muted-foreground">Test: </span>Test 3 — Physical trade test</p>
          {place ? <p><span className="text-muted-foreground">Job location: </span>{place}</p> : null}
          {assessment.job_experience ? (
            <p><span className="text-muted-foreground">Experience asked: </span>{assessment.job_experience}</p>
          ) : null}
        </div>
      </div>

      <div className="text-sm space-y-1 border-t pt-3">
        <p><span className="text-muted-foreground">Date: </span>{assessment.appointment_date || '—'}</p>
        <p><span className="text-muted-foreground">Reporting window: </span>{assessment.reporting_window || '—'}</p>
        <p><span className="text-muted-foreground">Centre: </span>{assessment.center_name || '—'}</p>
        <p>
          <span className="text-muted-foreground">Address: </span>
          {[assessment.center_address, assessment.center_city, assessment.center_state, assessment.center_pincode]
            .filter(Boolean)
            .join(', ') || '—'}
        </p>
        {(assessment.center_contact_name || assessment.center_contact_phone) && (
          <p>
            <span className="text-muted-foreground">Centre contact: </span>
            {[assessment.center_contact_name, assessment.center_contact_phone].filter(Boolean).join(' · ')}
          </p>
        )}
        {assessment.center_maps_url ? (
          <p>
            <a href={assessment.center_maps_url} className="text-primary underline" target="_blank" rel="noreferrer">
              Open map
            </a>
          </p>
        ) : null}
        <p className="text-muted-foreground">
          Bring this slip on your phone or a printout, and your original Aadhaar card.
          {assessment.center_instructions ? ` ${assessment.center_instructions}` : ''}
        </p>
      </div>

      <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
        Print slip
      </Button>
    </div>
  );
}
