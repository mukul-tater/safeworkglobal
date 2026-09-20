import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Plus, Stethoscope, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  MEDICAL_REQUIRED_TESTS,
  MEDICAL_TEST_INTRO,
} from '@/modules/worker-verification/constants';
import type { MedicalReport, WorkerVerification } from '@/modules/worker-verification/types';
import {
  listMedicalReports,
  medicalTestDocumentsComplete,
  saveMedicalReports,
} from '@/modules/worker-verification/services/verificationService';

const DOCS_BUCKET = 'worker-documents';
const MAX_REPORTS = 15;
const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const SAFE_UPLOAD_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'pdf']);

function displayFileName(name: string, max = 42): string {
  let base = name.trim();
  try {
    if (/^https?:\/\//i.test(base) || base.includes('?') || base.includes('/')) {
      const segment = base.split(/[?#]/)[0].split('/').filter(Boolean).pop() || base;
      base = decodeURIComponent(segment);
    }
  } catch {
    /* keep original */
  }
  base = base.replace(/[^\w.\- ()[\]]+/g, '_').replace(/_+/g, '_') || 'report.pdf';
  if (base.length <= max) return base;
  const ext = base.match(/\.[a-z0-9]{1,5}$/i)?.[0] || '';
  return `${base.slice(0, Math.max(12, max - ext.length - 1))}…${ext}`;
}

function safeUploadExt(file: File, fallback = 'pdf'): string {
  const fromName = displayFileName(file.name, 80).split('.').pop()?.toLowerCase() || '';
  if (SAFE_UPLOAD_EXTS.has(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  const mime = file.type.split('/')[1]?.toLowerCase() || '';
  if (mime === 'jpeg') return 'jpg';
  if (SAFE_UPLOAD_EXTS.has(mime)) return mime;
  return fallback;
}

async function uploadReport(userId: string, file: File, index: number): Promise<MedicalReport> {
  const ext = safeUploadExt(file, 'pdf');
  const path = `${userId}/medical/reports/${Date.now()}-${index}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: urlErr } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(path, 31536000);
  if (urlErr || !signed?.signedUrl) {
    throw new Error(urlErr?.message || 'Could not create file URL');
  }
  return {
    id: crypto.randomUUID(),
    url: signed.signedUrl,
    name: displayFileName(file.name, 80),
    uploaded_at: new Date().toISOString(),
  };
}

export function MedicalRequiredTestsNote() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3.5">
      <p className="text-sm text-foreground">{MEDICAL_TEST_INTRO}</p>
      <ul className="space-y-3">
        {MEDICAL_REQUIRED_TESTS.map((test) => (
          <li key={test.title} className="text-sm">
            <p className="font-semibold text-foreground">{test.title}</p>
            <p className="mt-0.5 text-muted-foreground leading-relaxed">{test.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MedicalTestStage({
  row,
  tradeNeeded,
  subjectId,
  saving,
  onSaving,
  onUpdated,
}: {
  row: WorkerVerification;
  tradeNeeded: boolean;
  subjectId: string;
  saving: boolean;
  onSaving: (value: boolean) => void;
  onUpdated: (next: WorkerVerification) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const saved = listMedicalReports(row);
  const locked = row.medical_status === 'passed';
  const waitingReview = medicalTestDocumentsComplete(row) && row.medical_status === 'scheduled';
  const roomLeft = Math.max(0, MAX_REPORTS - saved.length - pending.length);

  const addFiles = (list: FileList | null) => {
    const incoming = list ? Array.from(list) : [];
    if (!incoming.length) return;
    const next: File[] = [...pending];
    for (const file of incoming) {
      if (next.length + saved.length >= MAX_REPORTS) {
        toast.error(`You can upload up to ${MAX_REPORTS} reports`);
        break;
      }
      if (file.size > MAX_REPORT_BYTES) {
        toast.error(`${displayFileName(file.name)} is larger than 10MB`);
        continue;
      }
      next.push(file);
    }
    setPending(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const saveReports = async () => {
    if (locked) return;
    if (!pending.length && !saved.length) {
      toast.error('Add at least one medical report');
      return;
    }
    if (!pending.length) {
      toast.error('Choose at least one new report to upload');
      return;
    }
    onSaving(true);
    try {
      const uploaded: MedicalReport[] = [];
      for (let i = 0; i < pending.length; i++) {
        uploaded.push(await uploadReport(subjectId, pending[i], i));
      }
      const next = await saveMedicalReports(subjectId, [...saved, ...uploaded]);
      onUpdated(next);
      setPending([]);
      toast.success(
        saved.length
          ? 'Additional reports uploaded — waiting for admin review'
          : 'Medical reports uploaded — waiting for admin review',
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      onSaving(false);
    }
  };

  const removeSaved = async (id: string) => {
    if (locked) return;
    onSaving(true);
    try {
      const next = await saveMedicalReports(
        subjectId,
        saved.filter((r) => r.id !== id),
      );
      onUpdated(next);
      toast.success('Report removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove report');
    } finally {
      onSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3 border-b border-border/60 pb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Medical test</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete the required tests, then upload your reports here.
              {!tradeNeeded && (
                <>
                  {' '}
                  Physical trade test is not required for{' '}
                  <span className="font-medium text-foreground">{row.primary_skill}</span>.
                </>
              )}
            </p>
          </div>
        </div>

        <MedicalRequiredTestsNote />

        {waitingReview && (
          <p className="text-sm rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            Reports are uploaded. SafeWork is reviewing them. You can still add more reports if needed.
          </p>
        )}
        {locked && (
          <p className="text-sm rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-success">
            Medical test passed. Reports on file are locked.
          </p>
        )}

        {(row.medical_place || row.medical_scheduled_at || row.medical_instructions) && (
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm space-y-1">
            {row.medical_place && (
              <p>
                <span className="text-muted-foreground">Centre: </span>
                <span className="font-medium">{row.medical_place}</span>
              </p>
            )}
            {row.medical_scheduled_at && (
              <p>
                <span className="text-muted-foreground">When: </span>
                <span className="font-medium">
                  {new Date(row.medical_scheduled_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
            )}
            {row.medical_instructions && (
              <p className="text-xs text-muted-foreground whitespace-pre-line">{row.medical_instructions}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Upload reports</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF or image, up to 10MB each. Tap + to add another report.
            </p>
          </div>

          {(saved.length > 0 || pending.length > 0) && (
          <ul className="space-y-2">
            {saved.map((report) => (
              <li
                key={report.id}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={report.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-primary underline"
                >
                  {displayFileName(report.name)}
                </a>
                {!locked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={saving}
                    aria-label={`Remove ${report.name}`}
                    onClick={() => void removeSaved(report.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
            {pending.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-sm">{displayFileName(file.name)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={saving}
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setPending((curr) => curr.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            multiple
            className="sr-only"
            disabled={saving || locked || roomLeft === 0}
            onChange={(e) => addFiles(e.target.files)}
          />
          {!locked && roomLeft > 0 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-left transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
              aria-label={saved.length || pending.length ? 'Add another report' : 'Add a report'}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {saved.length || pending.length ? 'Add another report' : 'Add a report'}
                </span>
                <span className="block text-xs text-muted-foreground">
                  PDF or image · tap + to attach more files
                </span>
              </span>
            </button>
          )}
        </div>

        {!locked && (
          <Button disabled={saving || pending.length === 0} onClick={() => void saveReports()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            {saved.length ? 'Save additional reports' : 'Upload reports'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
