import type { ReactNode } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Star,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { displayableEmail } from '@/lib/workerAuthEmail';
import type { WorkerVerification } from '@/modules/worker-verification/types';
import type { AssessmentRow } from '@/modules/trade-test/types';
import {
  ASSESSMENT_FEE_INCLUSIONS,
  MEDICAL_TEST_SCREENING_NOTE,
  QUIZ_PASS_SCORE,
  type GccNavStepId,
} from '@/modules/worker-verification/constants';

export interface KycDocument {
  document_name: string;
  document_type: string;
  file_url: string;
  verification_status: string | null;
}

/** Ledger row from worker_assessment_payments — the authoritative transaction record. */
export interface AssessmentPaymentRecord {
  id: string;
  amount: number;
  currency: string;
  provider: string | null;
  provider_ref: string | null;
  status: string;
  paid_at: string | null;
}

interface Props {
  stepId: GccNavStepId | null;
  stepLabel: string;
  currentStepLabel: string;
  row: WorkerVerification;
  photoCount: number;
  videoCount: number;
  /** Canonical KYC state from worker_profiles. */
  kycStatus: string;
  kycDocs: KycDocument[];
  paymentRecord: AssessmentPaymentRecord | null;
  identity: { pan: string; aadhaarLast4: string; passport: string; passportExpiry?: string | null };
  ecrCategory?: string | null;
  tenthPass?: boolean | null;
  tradeAssessment?: AssessmentRow | null;
  onGoToCurrent: () => void;
  /** Extra interactive block, e.g. add-more-media uploader. */
  children?: ReactNode;
}

type Tone = 'success' | 'pending' | 'error';

function maskPan(pan: string): string {
  if (!pan || pan.length < 10) return pan || '—';
  return `${pan.slice(0, 5)}****${pan.slice(9)}`;
}

function maskPassport(p: string): string {
  if (!p || p.length < 3) return p || '—';
  return `${p.slice(0, 1)}${'*'.repeat(Math.max(1, p.length - 3))}${p.slice(-2)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? XCircle : Clock;
  return (
    <Badge
      variant="secondary"
      className={cn(
        'shrink-0 gap-1 border-0',
        tone === 'success' && 'bg-success/10 text-success',
        tone === 'pending' && 'bg-warning/15 text-warning',
        tone === 'error' && 'bg-destructive/10 text-destructive',
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function Detail({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5">
        <span
          className={cn(
            'min-w-0 truncate text-sm font-medium text-foreground',
            mono && 'font-mono text-[13px]',
          )}
        >
          {value}
        </span>
        {copyable && value !== '—' && (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

function DocumentTile({ doc }: { doc: KycDocument }) {
  const isImage = !/\.pdf(\?|$)/i.test(doc.file_url);
  return (
    <a
      href={doc.file_url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-xl border border-border bg-muted/20 transition-colors hover:border-primary/40"
    >
      <div className="flex h-24 items-center justify-center overflow-hidden bg-muted/40">
        {isImage ? (
          <img
            src={doc.file_url}
            alt={doc.document_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center justify-between gap-1 px-2.5 py-2">
        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {doc.document_name}
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </a>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}

/**
 * Read-only view of the identity records SafeWork holds. Shared by the completed-step
 * review and the "verifying your identity" wait screen so the worker always sees
 * exactly what was submitted.
 */
export function KycRecordSummary({
  identity,
  kycDocs,
  submittedOn,
  verified,
}: {
  identity: { pan: string; aadhaarLast4: string; passport: string; passportExpiry?: string | null };
  kycDocs: KycDocument[];
  submittedOn: string | null | undefined;
  verified: boolean;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Detail label="PAN number" value={maskPan(identity.pan)} mono />
        <Detail
          label="Aadhaar number"
          value={identity.aadhaarLast4 ? `XXXX XXXX ${identity.aadhaarLast4}` : '—'}
          mono
        />
        <Detail
          label="Passport number"
          value={identity.passport ? maskPassport(identity.passport) : 'Not provided'}
          mono={Boolean(identity.passport)}
        />
        <Detail
          label="Passport expiry"
          value={identity.passportExpiry ? formatDate(identity.passportExpiry) : '—'}
        />
        <Detail label={verified ? 'Verified on' : 'Submitted on'} value={formatDate(submittedOn)} />
      </dl>

      {kycDocs.length > 0 && (
        <div>
          <SectionLabel>Documents on file</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kycDocs.map((doc) => (
              <DocumentTile key={`${doc.document_type}-${doc.file_url}`} doc={doc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Read-only review of a finished journey step.
 * Records stay locked unless SafeWork rejected the submission.
 */
export default function CompletedStepReview({
  stepId,
  stepLabel,
  currentStepLabel,
  row,
  photoCount,
  videoCount,
  kycStatus,
  kycDocs,
  paymentRecord,
  identity,
  ecrCategory,
  tenthPass,
  tradeAssessment,
  onGoToCurrent,
  children,
}: Props) {
  const kycTone: Tone =
    kycStatus === 'verified' ? 'success' : kycStatus === 'rejected' ? 'error' : 'pending';
  const kycLabel =
    kycStatus === 'verified'
      ? 'Verified'
      : kycStatus === 'rejected'
        ? 'Rejected'
        : 'Under review';

  // Only completed steps reach this screen, and a rejected interview holds the worker
  // on the interview step — so anything not explicitly rejected has been cleared.
  const interviewRejected = row.interview_status === 'rejected';
  const interviewTone: Tone = interviewRejected ? 'error' : 'success';
  const interviewLabel = interviewRejected ? 'Not cleared' : 'Cleared';

  const headerTone: Tone =
    stepId === 'identity' ? kycTone : stepId === 'test2' ? interviewTone : 'success';
  const headerLabel =
    stepId === 'identity' ? kycLabel : stepId === 'test2' ? interviewLabel : 'Done';
  const HeaderIcon =
    headerTone === 'success' ? CheckCircle2 : headerTone === 'error' ? XCircle : Clock;

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                headerTone === 'success' && 'bg-success/10 text-success',
                headerTone === 'pending' && 'bg-warning/15 text-warning',
                headerTone === 'error' && 'bg-destructive/10 text-destructive',
              )}
            >
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Completed step
              </p>
              <h2 className="font-heading text-lg font-semibold leading-tight">{stepLabel}</h2>
            </div>
          </div>
          <StatusPill tone={headerTone} label={headerLabel} />
        </div>

        {stepId === 'essentials' && (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Email" value={displayableEmail(row.email) || '—'} />
            <Detail
              label="Location"
              value={[row.city, row.state].filter(Boolean).join(', ') || '—'}
            />
            <Detail label="Education" value={row.education_level || '—'} />
            <Detail
              label="Class 10"
              value={tenthPass === true ? 'Passed' : tenthPass === false ? 'Not passed' : '—'}
            />
            <Detail
              label="ECR category"
              value={ecrCategory === 'ECNR' ? 'ECNR (no clearance required)' : ecrCategory === 'ECR' ? 'ECR (clearance required)' : '—'}
            />
            <Detail label="Primary skill" value={row.primary_skill || '—'} />
          </dl>
        )}

        {stepId === 'test1' && (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <SectionLabel>Your score</SectionLabel>
                <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-foreground">
                  {row.quiz_score ?? '—'}
                  <span className="text-lg text-muted-foreground">%</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pass mark {QUIZ_PASS_SCORE}%
                </p>
              </div>
              <StatusPill
                tone={(row.quiz_score ?? 0) >= QUIZ_PASS_SCORE ? 'success' : 'pending'}
                label={(row.quiz_score ?? 0) >= QUIZ_PASS_SCORE ? 'Passed' : 'Recorded'}
              />
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail label="Skill tested" value={row.primary_skill || '—'} />
              <Detail label="Completed on" value={formatDate(row.quiz_completed_at)} />
            </dl>
          </div>
        )}

        {stepId === 'skill_proof' && (
          <div className="space-y-4">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <Detail label="Photos uploaded" value={String(photoCount)} />
              <Detail label="Videos uploaded" value={String(videoCount)} />
              <Detail label="Submitted on" value={formatDate(row.media_submitted_at)} />
            </dl>
            {children}
          </div>
        )}

        {stepId === 'identity' && (
          <div className="space-y-4">
            <KycRecordSummary
              identity={identity}
              kycDocs={kycDocs}
              submittedOn={row.kyc_verified_at || row.updated_at}
              verified={kycStatus === 'verified'}
            />

            {kycStatus === 'rejected' ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                  <XCircle className="h-4 w-4" /> SafeWork could not verify these documents
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {row.kyc_rejection_reason ||
                    'Some details did not match. Re-check your PAN, Aadhaar and passport photos, then upload clear photos again.'}
                </p>
                <Button size="sm" className="mt-3" onClick={onGoToCurrent}>
                  Re-submit documents
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {kycStatus === 'verified'
                    ? 'These records are verified and locked. Contact SafeWork support if something needs to change.'
                    : 'Locked while SafeWork reviews your documents. You can edit them only if verification fails.'}
                </p>
              </div>
            )}
          </div>
        )}

        {stepId === 'test2' && (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <SectionLabel>Interviewer score</SectionLabel>
                {row.interview_score != null ? (
                  <p className="mt-1 flex items-center gap-1.5 font-heading text-3xl font-bold tabular-nums text-foreground">
                    {row.interview_score}
                    <span className="text-lg text-muted-foreground">/100</span>
                    {row.interview_score >= 70 && (
                      <Star className="h-4 w-4 fill-warning text-warning" />
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Not scored — cleared on SafeWork review
                  </p>
                )}
              </div>
              <StatusPill tone={interviewTone} label={interviewLabel} />
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail
                label="Interviewed on"
                value={formatDate(row.interview_rated_at || row.interview_scheduled_at)}
              />
              <Detail label="Interviewer" value={row.interviewer_name || '—'} />
              <Detail label="Attempt" value={String(row.interview_attempts ?? 1)} />
            </dl>
            {row.interview_notes && (
              <div>
                <SectionLabel>Interviewer notes</SectionLabel>
                <p className="mt-1.5 rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground">
                  {row.interview_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {stepId === 'test3' && (() => {
          const centreName =
            tradeAssessment?.center_name ||
            row.trade_test_center_name ||
            row.trade_test_place ||
            '—';
          const address =
            tradeAssessment?.center_address ||
            (row.trade_test_place && row.trade_test_place !== centreName
              ? row.trade_test_place
              : null);
          return (
          <div className="space-y-4">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail label="Centre" value={centreName} />
              <Detail
                label="Appointment"
                value={formatDate(
                  tradeAssessment?.appointment_date ||
                    tradeAssessment?.scheduled_at ||
                    row.trade_test_scheduled_at,
                )}
              />
              <Detail
                label="Reporting window"
                value={
                  tradeAssessment?.reporting_window ||
                  row.trade_test_reporting_window ||
                  '—'
                }
              />
              <Detail
                label="City / state"
                value={
                  [tradeAssessment?.center_city, tradeAssessment?.center_state, tradeAssessment?.center_pincode]
                    .filter(Boolean)
                    .join(', ') || row.state || '—'
                }
              />
            </dl>
            {address && (
              <div>
                <SectionLabel>Address</SectionLabel>
                <p className="mt-1.5 text-sm text-foreground">{address}</p>
              </div>
            )}
            {(tradeAssessment?.center_contact_name || tradeAssessment?.center_contact_phone) && (
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Detail
                  label="Contact"
                  value={
                    [tradeAssessment?.center_contact_name, tradeAssessment?.center_contact_phone]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  }
                />
              </dl>
            )}
            {(row.trade_test_instructions || tradeAssessment?.center_instructions) && (
              <div>
                <SectionLabel>Instructions</SectionLabel>
                <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">
                  {row.trade_test_instructions || tradeAssessment?.center_instructions}
                </p>
              </div>
            )}
            {tradeAssessment?.center_maps_url && (
              <Button asChild variant="outline" size="sm">
                <a href={tradeAssessment.center_maps_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Open in Maps
                </a>
              </Button>
            )}
          </div>
          );
        })()}

        {stepId === 'medical' && (() => {
          const docs = [
            {
              document_name: 'Blood report',
              document_type: 'medical_blood_report',
              file_url: row.medical_blood_report_url || row.medical_result_url || '',
              verification_status: row.medical_status,
            },
            {
              document_name: 'X-ray report',
              document_type: 'medical_xray_report',
              file_url: row.medical_xray_report_url || '',
              verification_status: row.medical_status,
            },
            {
              document_name: 'X-ray photo',
              document_type: 'medical_xray_photo',
              file_url: row.medical_xray_photo_url || '',
              verification_status: row.medical_status,
            },
          ].filter((d) => d.file_url);
          const passed = row.medical_status === 'passed';
          return (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-foreground">{MEDICAL_TEST_SCREENING_NOTE}</p>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Detail label="Medical status" value={passed ? 'Passed' : row.medical_status || 'Submitted'} />
                <Detail label="Centre" value={row.medical_place || '—'} />
              </dl>
              {docs.length > 0 && (
                <div>
                  <SectionLabel>Documents on file</SectionLabel>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {docs.map((doc) => (
                      <DocumentTile key={`${doc.document_type}-${doc.file_url}`} doc={doc} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {stepId === 'payment' && (() => {
          const waived = !row.razorpay_payment_id && paymentRecord?.provider === 'pilot_waive';
          return (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex items-start justify-between gap-3 bg-muted/20 p-4">
                  <div>
                    <SectionLabel>Assessment fee</SectionLabel>
                    <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-foreground">
                      ₹{(row.payment_amount ?? paymentRecord?.amount ?? 0).toLocaleString('en-IN')}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {waived
                        ? 'Cleared by SafeWork — no amount was collected'
                        : `Paid via ${paymentRecord?.provider === 'razorpay' || row.razorpay_payment_id ? 'Razorpay' : paymentRecord?.provider || 'Razorpay'}`}
                    </p>
                  </div>
                  <StatusPill tone="success" label={waived ? 'Waived' : 'Paid'} />
                </div>
                <dl className="grid gap-x-6 gap-y-3 border-t border-border p-4 sm:grid-cols-2">
                  <Detail label="Paid on" value={formatDate(row.paid_at || paymentRecord?.paid_at)} />
                  <Detail label="Currency" value={paymentRecord?.currency || 'INR'} />
                  {row.razorpay_payment_id && (
                    <Detail label="Payment ID" value={row.razorpay_payment_id} mono copyable />
                  )}
                  {row.razorpay_order_id && (
                    <Detail label="Order ID" value={row.razorpay_order_id} mono copyable />
                  )}
                  {paymentRecord?.provider_ref && paymentRecord.provider_ref !== row.razorpay_payment_id && (
                    <Detail label="Provider reference" value={paymentRecord.provider_ref} mono copyable />
                  )}
                  {paymentRecord?.id && (
                    <Detail label="SafeWork receipt ID" value={paymentRecord.id} mono copyable />
                  )}
                </dl>
              </div>
              <div>
                <SectionLabel>What this fee covers</SectionLabel>
                <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {ASSESSMENT_FEE_INCLUSIONS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                {waived
                  ? 'This fee was cleared by SafeWork during the pilot. No card or UPI was charged.'
                  : 'Keep these IDs — quote them if you contact SafeWork support about this payment.'}
              </p>
            </div>
          );
        })()}

        {!stepId ||
        !['essentials', 'test1', 'skill_proof', 'identity', 'test2', 'payment', 'medical'].includes(stepId) ? (
          <p className="text-sm text-muted-foreground">
            You've finished this step. SafeWork has everything it needs here.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Current step: <span className="font-medium text-foreground">{currentStepLabel}</span>
          </p>
          <Button type="button" className="shrink-0" onClick={onGoToCurrent}>
            Go to current step
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
