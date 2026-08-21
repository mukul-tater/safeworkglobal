import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileSignature, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeIndianMobile } from '@/lib/validations/common';
import type { BondTemplate, WorkerVerification } from '@/modules/worker-verification/types';
import { BOND_SECURITY_COPY, type EnHi } from '@/modules/worker-verification/bond-security/copy';
import { formatStampInr } from '@/modules/worker-verification/bond-security/stampPaper';
import { bondChecklist, checklistComplete, displayBondStatus, isBondLockedForEdit } from '@/modules/worker-verification/bond-security/status';
import type { BondFileKind, BondSecurityDraftPayload, BondSecurityRow, StampPaperValue } from '@/modules/worker-verification/bond-security/types';
import {
  BOND_SECURITY_ACCEPT,
  confirmGuarantorOtp,
  listStampPaperValues,
  loadBondSecurity,
  previewBondSecurityFile,
  sendGuarantorOtp,
  stampForRegisteredState,
  submitBondSecurity,
  uploadBondSecurityFile,
  upsertBondSecurity,
  verifyGuarantorOtpApi,
} from '@/modules/worker-verification/services/bondSecurityService';

const C = BOND_SECURITY_COPY;

function Dual({ copy, className, as: Tag = 'p' }: { copy: EnHi; className?: string; as?: 'p' | 'h2' | 'h3' | 'span' }) {
  return (
    <Tag className={className}>
      <span className="block">{copy.en}</span>
      <span className="mt-0.5 block text-[0.92em] font-normal opacity-80">{copy.hi}</span>
    </Tag>
  );
}

function FieldLabel({ en, hi, required }: { en: string; hi: string; required?: boolean }) {
  return (
    <Label className="text-sm font-medium leading-snug">
      {en}{required ? ' *' : ''}
      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hi}</span>
    </Label>
  );
}

function StatusBanner({
  kind,
  title,
  reason,
}: {
  kind: 'info' | 'warn' | 'ok';
  title: EnHi;
  reason?: string | null;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        kind === 'ok' && 'border-success/30 bg-success/5',
        kind === 'warn' && 'border-amber-500/40 bg-amber-50 text-amber-950',
        kind === 'info' && 'border-border bg-muted/30',
      )}
    >
      <p className="font-medium">🟡 {title.en}</p>
      <p className="mt-0.5 text-xs opacity-80">{title.hi}</p>
      {reason ? <p className="mt-2 text-sm">{reason}</p> : null}
    </div>
  );
}

function FileMeta({
  name,
  uploadedAt,
  status,
  path,
}: {
  name?: string | null;
  uploadedAt?: string | null;
  status?: string | null;
  path?: string | null;
}) {
  if (!name && !path) return null;
  return (
    <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
      <p className="flex items-center gap-1.5 font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> {C.uploaded.en} · {C.uploaded.hi}
      </p>
      {name ? <p className="mt-1 truncate text-xs">{name}</p> : null}
      {uploadedAt ? (
        <p className="text-xs text-muted-foreground">
          {new Date(uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      ) : null}
      {status ? <p className="text-xs capitalize text-muted-foreground">Status: {status}</p> : null}
      {path ? (
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-xs"
          onClick={async () => {
            try {
              const url = await previewBondSecurityFile(path);
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Could not open file');
            }
          }}
        >
          View
        </Button>
      ) : null}
    </div>
  );
}

function UploadField({
  label,
  button,
  disabled,
  onFile,
  existing,
}: {
  label: EnHi;
  button: EnHi;
  disabled?: boolean;
  onFile: (file: File) => Promise<void>;
  existing?: { name?: string | null; uploadedAt?: string | null; status?: string | null; path?: string | null };
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Dual copy={label} className="text-sm font-medium" />
      <p className="text-xs text-muted-foreground">{C.formats.en}</p>
      <label
        className={cn(
          'flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium',
          disabled ? 'pointer-events-none opacity-60' : 'border-primary/40 bg-primary/5',
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>
          {button.en}
          <span className="mt-0.5 block text-xs font-normal opacity-80">{button.hi}</span>
        </span>
        <input
          type="file"
          accept={BOND_SECURITY_ACCEPT}
          className="sr-only"
          disabled={disabled || busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            try {
              await onFile(file);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <FileMeta
        name={existing?.name}
        uploadedAt={existing?.uploadedAt}
        status={existing?.status}
        path={existing?.path}
      />
    </div>
  );
}

const CHECKLIST_KEYS = [
  'stampBondUploaded',
  'originalPrepared',
  'courierReceiptUploaded',
  'workerChequeUploaded',
  'guarantorDetailsSubmitted',
  'guarantorChequeUploaded',
  'guarantorDeclarationAccepted',
  'guarantorOtpVerified',
] as const;

interface Props {
  userId: string;
  workerPhone?: string | null;
  verification: WorkerVerification;
  template: BondTemplate | null;
  onChanged: () => void;
}

export default function BondSecurityStage({
  userId,
  workerPhone,
  verification,
  template,
  onChanged,
}: Props) {
  const [row, setRow] = useState<BondSecurityRow | null>(null);
  const [catalog, setCatalog] = useState<StampPaperValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stateConfirmed, setStateConfirmed] = useState(false);
  const [courierCompany, setCourierCompany] = useState('');
  const [tracking, setTracking] = useState('');
  const [courierDate, setCourierDate] = useState('');
  const [wHolder, setWHolder] = useState('');
  const [wBank, setWBank] = useState('');
  const [wNumber, setWNumber] = useState('');
  const [wDate, setWDate] = useState('');
  const [wAmount, setWAmount] = useState('');
  const [gName, setGName] = useState('');
  const [gRel, setGRel] = useState('');
  const [gMobile, setGMobile] = useState('');
  const [gAddress, setGAddress] = useState('');
  const [gBank, setGBank] = useState('');
  const [gHolder, setGHolder] = useState('');
  const [gNumber, setGNumber] = useState('');
  const [gDate, setGDate] = useState('');
  const [gAmount, setGAmount] = useState('');
  const [gDecl, setGDecl] = useState(false);
  const [d1, setD1] = useState(false);
  const [d2, setD2] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const hydrate = useCallback((next: BondSecurityRow | null) => {
    setRow(next);
    if (!next) return;
    setStateConfirmed(Boolean(next.state_confirmed));
    setCourierCompany(next.courier_company || '');
    setTracking(next.tracking_number || '');
    setCourierDate(next.courier_date || '');
    setWHolder(next.worker_cheque_holder_name || '');
    setWBank(next.worker_cheque_bank_name || '');
    setWNumber(next.worker_cheque_number || '');
    setWDate(next.worker_cheque_date || '');
    setWAmount(next.worker_cheque_amount != null ? String(next.worker_cheque_amount) : '');
    setGName(next.guarantor_full_name || '');
    setGRel(next.guarantor_relationship || '');
    setGMobile(next.guarantor_mobile || '');
    setGAddress(next.guarantor_address || '');
    setGBank(next.guarantor_bank_name || '');
    setGHolder(next.guarantor_cheque_holder_name || '');
    setGNumber(next.guarantor_cheque_number || '');
    setGDate(next.guarantor_cheque_date || '');
    setGAmount(next.guarantor_cheque_amount != null ? String(next.guarantor_cheque_amount) : '');
    setGDecl(Boolean(next.guarantor_declaration_accepted_at));
    setD1(Boolean(next.authenticity_declared_at));
    setD2(Boolean(next.no_guarantee_declared_at));
  }, []);

  const refresh = useCallback(async () => {
    const [pack, stamps] = await Promise.all([loadBondSecurity(userId), listStampPaperValues()]);
    hydrate(pack);
    setCatalog(stamps);
  }, [hydrate, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Could not load bond details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const stamp = useMemo(
    () => stampForRegisteredState(verification.state, catalog),
    [catalog, verification.state],
  );
  const locked = isBondLockedForEdit(row?.status);
  const display = displayBondStatus({
    journeyStage: verification.stage,
    bondStatus: verification.bond_status,
    packStatus: row?.status ?? null,
    originalReceived: Boolean(verification.bond_received_at),
  });
  const list = bondChecklist(row);
  const configuredWorkerAmt = template?.worker_cheque_amount ?? null;
  const configuredGuarantorAmt = template?.guarantor_cheque_amount ?? null;
  const workerPhoneNorm = workerPhone ? normalizeIndianMobile(workerPhone) : '';

  const draft = (): BondSecurityDraftPayload => ({
    state_confirmed: stateConfirmed,
    courier_company: courierCompany,
    tracking_number: tracking,
    courier_date: courierDate || null,
    worker_cheque_holder_name: wHolder,
    worker_cheque_bank_name: wBank,
    worker_cheque_number: wNumber,
    worker_cheque_date: wDate || null,
    worker_cheque_amount: configuredWorkerAmt ?? (wAmount ? Number(wAmount) : null),
    guarantor_full_name: gName,
    guarantor_relationship: gRel,
    guarantor_mobile: gMobile,
    guarantor_address: gAddress,
    guarantor_bank_name: gBank,
    guarantor_cheque_holder_name: gHolder,
    guarantor_cheque_number: gNumber,
    guarantor_cheque_date: gDate || null,
    guarantor_cheque_amount: configuredGuarantorAmt ?? (gAmount ? Number(gAmount) : null),
    guarantor_declaration: gDecl,
    authenticity_declared: d1,
    no_guarantee_declared: d2,
  });

  const saveDraft = async () => {
    const next = await upsertBondSecurity(draft());
    hydrate(next);
    onChanged();
    return next;
  };

  const onUpload = async (kind: BondFileKind, file: File) => {
    try {
      if (!locked) await saveDraft();
      const next = await uploadBondSecurityFile(userId, kind, file);
      hydrate(next);
      onChanged();
      toast.success(`${C.uploaded.en}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const onSubmit = async () => {
    if (!stateConfirmed || !stamp) {
      toast.error(C.confirmState.en);
      return;
    }
    if (!d1 || !d2) {
      toast.error('Accept both declarations before submitting');
      return;
    }
    setSaving(true);
    try {
      await saveDraft();
      const next = await submitBondSecurity();
      hydrate(next);
      onChanged();
      toast.success(C.submittedBanner.en);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  const onSendOtp = async () => {
    const mobile = normalizeIndianMobile(gMobile);
    if (workerPhoneNorm && mobile === workerPhoneNorm) {
      toast.error(C.samePhoneBlocked.en);
      return;
    }
    setSaving(true);
    try {
      await saveDraft();
      const result = await sendGuarantorOtp(mobile);
      setOtpSent(true);
      toast.success(result.demo ? `${result.message}` : C.sendOtp.en);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setSaving(false);
    }
  };

  const onVerifyOtp = async () => {
    const mobile = normalizeIndianMobile(gMobile);
    setSaving(true);
    try {
      await saveDraft();
      await verifyGuarantorOtpApi(mobile, otp);
      const next = await confirmGuarantorOtp(mobile);
      hydrate(next);
      onChanged();
      toast.success(C.otpVerified.en);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'OTP verification failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="space-y-3 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <Dual copy={C.title} as="h2" className="font-heading text-xl font-bold leading-tight" />
              <Dual copy={C.intro} className="mt-2 text-sm text-muted-foreground" />
            </div>
          </div>
          {display === 'UNDER_VERIFICATION' || display === 'DOCUMENTS_SUBMITTED' ? (
            <StatusBanner kind="info" title={C.submittedBanner} />
          ) : null}
          {display === 'RESUBMISSION_REQUIRED' ? (
            <StatusBanner kind="warn" title={C.resubmission} reason={row?.rejection_reason || verification.bond_rejection_reason} />
          ) : null}
          {display === 'APPROVED' ? <StatusBanner kind="ok" title={C.approvedWaitingOriginal} /> : null}
          {display === 'ORIGINAL_RECEIVED' ? <StatusBanner kind="ok" title={C.originalReceived} /> : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[1] Your State', hi: '[1] आपका राज्य' }} as="h3" className="font-semibold" />
          <Dual copy={C.registeredState} className="text-sm text-muted-foreground" />
          <p className="text-2xl font-bold">{verification.state || '—'}</p>
          {stamp ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <Dual copy={C.stampValueLabel} className="text-sm text-muted-foreground" />
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatStampInr(stamp.minimum_stamp_value)}</p>
              <p className="mt-1 text-sm">
                {stamp.state_name}
                {stamp.name_hi ? <span className="ml-2 text-muted-foreground">{stamp.name_hi}</span> : null}
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-800">{C.missingState.en}</p>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox
              className="mt-0.5 h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6"
              checked={stateConfirmed}
              disabled={locked || !stamp}
              onCheckedChange={(v) => setStateConfirmed(v === true)}
            />
            <Dual copy={C.confirmState} className="text-sm" />
          </label>
          <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
            <Link to="/worker/profile?from=bond">{C.updateProfile.en} · {C.updateProfile.hi}</Link>
          </Button>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <Dual copy={C.stampBoxTitle} as="h3" className="font-semibold" />
            <Dual copy={C.stampBoxBody} className="mt-2 text-sm text-muted-foreground" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {C.compliance.en}
            <span className="mt-1 block">{C.compliance.hi}</span>
          </p>
        </CardContent>
      </Card>

      {template ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5 sm:p-6">
            <Button asChild variant="outline" className="h-11">
              <a href={template.file_url} target="_blank" rel="noreferrer">
                {C.downloadTemplate.en} ({template.version})
              </a>
            </Button>
            <div className="whitespace-pre-line text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{C.courierTo.en}</p>
              {template.courier_address}
              {template.instructions ? `\n\n${template.instructions}` : ''}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[2] Upload Bond', hi: '[2] बॉन्ड अपलोड' }} as="h3" className="font-semibold" />
          <Dual copy={C.uploadTitle} className="text-sm" />
          <Dual copy={C.uploadRequired} className="text-sm text-muted-foreground" />
          <Dual copy={C.uploadHint} className="text-sm text-muted-foreground" />
          <UploadField
            label={C.uploadBond}
            button={C.uploadBond}
            disabled={locked}
            onFile={(file) => onUpload('bond', file)}
            existing={{
              name: row?.bond_file_name,
              uploadedAt: row?.bond_uploaded_at,
              status: row?.bond_doc_status,
              path: row?.bond_file_path,
            }}
          />
        </CardContent>
      </Card>

      {row?.bond_file_path ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <Dual copy={{ en: '[3] Courier Original', hi: '[3] मूल दस्तावेज़ कूरियर' }} as="h3" className="font-semibold" />
            <Dual copy={C.courierTitle} />
            <Dual copy={C.courierBody} className="text-sm text-muted-foreground" />
            <Badge variant="outline" className="capitalize">{row.courier_status}</Badge>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel en={C.courierCompany.en} hi={C.courierCompany.hi} required />
                <Input className="h-12" value={courierCompany} disabled={locked} onChange={(e) => setCourierCompany(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel en={C.trackingNumber.en} hi={C.trackingNumber.hi} required />
                <Input className="h-12 uppercase" value={tracking} disabled={locked} onChange={(e) => setTracking(e.target.value.toUpperCase().slice(0, 40))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel en={C.courierDate.en} hi={C.courierDate.hi} required />
                <Input type="date" className="h-12" value={courierDate} disabled={locked} onChange={(e) => setCourierDate(e.target.value)} />
              </div>
            </div>
            <UploadField
              label={C.uploadReceipt}
              button={C.uploadReceipt}
              disabled={locked}
              onFile={(file) => onUpload('courier_receipt', file)}
              existing={{ name: row.courier_receipt_name, path: row.courier_receipt_path }}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[4] Worker Security Cheque', hi: '[4] Worker का Security Cheque' }} as="h3" className="font-semibold" />
          <Dual copy={C.workerChequeBody} className="text-sm text-muted-foreground" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel en={C.chequeHolder.en} hi={C.chequeHolder.hi} required />
              <Input className="h-12" value={wHolder} disabled={locked} onChange={(e) => setWHolder(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.bankName.en} hi={C.bankName.hi} required />
              <Input className="h-12" value={wBank} disabled={locked} onChange={(e) => setWBank(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.chequeNumber.en} hi={C.chequeNumber.hi} required />
              <Input className="h-12" value={wNumber} disabled={locked} onChange={(e) => setWNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.chequeDate.en} hi={C.chequeDate.hi} />
              <Input type="date" className="h-12" value={wDate} disabled={locked} onChange={(e) => setWDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={configuredWorkerAmt != null ? C.configuredAmount.en : C.chequeAmount.en} hi={configuredWorkerAmt != null ? C.configuredAmount.hi : C.chequeAmount.hi} />
              {configuredWorkerAmt != null ? (
                <Input className="h-12 bg-muted" value={formatStampInr(Number(configuredWorkerAmt))} disabled />
              ) : (
                <Input className="h-12" inputMode="numeric" value={wAmount} disabled={locked} onChange={(e) => setWAmount(e.target.value.replace(/[^\d.]/g, ''))} />
              )}
            </div>
          </div>
          <UploadField
            label={C.uploadCheque}
            button={C.uploadCheque}
            disabled={locked}
            onFile={(file) => onUpload('worker_cheque', file)}
            existing={{ name: row?.worker_cheque_name, path: row?.worker_cheque_path }}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[5] Guarantor Details', hi: '[5] गारंटर विवरण' }} as="h3" className="font-semibold" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel en={C.guarantorName.en} hi={C.guarantorName.hi} required />
              <Input className="h-12" value={gName} disabled={locked} onChange={(e) => setGName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.relationship.en} hi={C.relationship.hi} required />
              <Input className="h-12" value={gRel} disabled={locked} onChange={(e) => setGRel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.mobile.en} hi={C.mobile.hi} required />
              <Input className="h-12" inputMode="numeric" maxLength={10} value={gMobile} disabled={locked} onChange={(e) => setGMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel en={C.address.en} hi={C.address.hi} required />
              <Input className="h-12" value={gAddress} disabled={locked} onChange={(e) => setGAddress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-4">
            <Dual copy={{ en: 'Guarantor OTP Verification', hi: 'गारंटर OTP सत्यापन' }} className="font-medium" />
            {row?.guarantor_otp_verified ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> {C.otpVerified.en}
              </p>
            ) : (
              <>
                <Button type="button" variant="outline" className="h-11" disabled={locked || saving || gMobile.length !== 10} onClick={() => void onSendOtp()}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  {C.sendOtp.en}
                </Button>
                {otpSent ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input className="h-12" inputMode="numeric" maxLength={6} placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                    <Button type="button" className="h-12" disabled={locked || saving || otp.length !== 6} onClick={() => void onVerifyOtp()}>
                      {C.verifyOtp.en}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[6] Guarantor Security Cheque', hi: '[6] गारंटर का Security Cheque' }} as="h3" className="font-semibold" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel en={C.bankName.en} hi={C.bankName.hi} required />
              <Input className="h-12" value={gBank} disabled={locked} onChange={(e) => setGBank(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.chequeHolder.en} hi={C.chequeHolder.hi} required />
              <Input className="h-12" value={gHolder} disabled={locked} onChange={(e) => setGHolder(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.chequeNumber.en} hi={C.chequeNumber.hi} required />
              <Input className="h-12" value={gNumber} disabled={locked} onChange={(e) => setGNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={C.chequeDate.en} hi={C.chequeDate.hi} />
              <Input type="date" className="h-12" value={gDate} disabled={locked} onChange={(e) => setGDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel en={configuredGuarantorAmt != null ? C.configuredAmount.en : C.chequeAmount.en} hi={configuredGuarantorAmt != null ? C.configuredAmount.hi : C.chequeAmount.hi} />
              {configuredGuarantorAmt != null ? (
                <Input className="h-12 bg-muted" value={formatStampInr(Number(configuredGuarantorAmt))} disabled />
              ) : (
                <Input className="h-12" inputMode="numeric" value={gAmount} disabled={locked} onChange={(e) => setGAmount(e.target.value.replace(/[^\d.]/g, ''))} />
              )}
            </div>
          </div>
          <UploadField
            label={C.uploadCheque}
            button={C.uploadCheque}
            disabled={locked}
            onFile={(file) => onUpload('guarantor_cheque', file)}
            existing={{ name: row?.guarantor_cheque_name, path: row?.guarantor_cheque_path }}
          />
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox className="mt-0.5 h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6" checked={gDecl} disabled={locked} onCheckedChange={(v) => setGDecl(v === true)} />
            <Dual copy={C.guarantorDeclaration} className="text-sm" />
          </label>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5 sm:p-6">
          <Dual copy={C.checklistTitle} as="h3" className="font-semibold" />
          <ul className="space-y-2">
            {CHECKLIST_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm">
                <span className={cn('mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border', list[key] ? 'border-success bg-success/15 text-success' : 'border-border')}>
                  {list[key] ? '✓' : ''}
                </span>
                <span>
                  <span className="block">{C.checklist[key].en}</span>
                  <span className="block text-xs text-muted-foreground">{C.checklist[key].hi}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Dual copy={{ en: '[7] Final Declaration', hi: '[7] अंतिम घोषणा' }} as="h3" className="font-semibold" />
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox className="mt-0.5 h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6" checked={d1} disabled={locked} onCheckedChange={(v) => setD1(v === true)} />
            <Dual copy={C.declaration1} className="text-sm" />
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-border p-4">
            <Checkbox className="mt-0.5 h-6 w-6 min-h-6 min-w-6 max-h-6 max-w-6" checked={d2} disabled={locked} onCheckedChange={(v) => setD2(v === true)} />
            <Dual copy={C.declaration2} className="text-sm" />
          </label>
          <Button
            className="h-14 w-full text-base"
            disabled={locked || saving || !stateConfirmed || !d1 || !d2 || !checklistComplete(list)}
            onClick={() => void onSubmit()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            <span>
              <span className="block">{C.submit.en}</span>
              <span className="block text-xs font-normal opacity-90">{C.submit.hi}</span>
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
