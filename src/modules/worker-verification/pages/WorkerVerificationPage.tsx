import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WorkerPortalLayout from '@/components/layout/WorkerPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2, ArrowRight, CheckCircle2, Upload, Video, ImagePlus,
  Calendar, CreditCard, Stethoscope, ShieldCheck, Wrench,
  GraduationCap, Plane, Lock, AlertTriangle, UserRound, ClipboardList, Info,
  MapPin, Phone, ExternalLink, Search, Briefcase,
} from 'lucide-react';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';
import { indianStates } from '@/lib/validations/partner';
import { displayableEmail, isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import {
  ASSESSMENT_FEE_INR,
  ASSESSMENT_FEE_INCLUSIONS,
  MEDICAL_TEST_SCREENING_NOTE,
  educationOptionsForTenthPass,
  ecrFromTenthPass,
  gccJourneyNavSteps,
  DEPLOYMENT_CHECKLIST,
  VERIFICATION_STAGE_LABELS,
  isJourneyResetEnabled,
  navStepForStage,
  normalizeVerificationStage,
  QUIZ_PASS_SCORE,
  skillRequiresTradeTest,
  youtubeEmbedUrl,
  type GccNavStepId,
  type VerificationStage,
} from '@/modules/worker-verification/constants';
import type { BondTemplate, SkillQuizItem, WorkerVerification } from '@/modules/worker-verification/types';
import {
  completeMediaStep,
  completeIdentityKyc,
  getOrCreateVerification,
  loadActiveBondTemplate,
  loadQuizItems,
  saveEssentials,
  medicalTestDocumentsComplete,
  submitMedicalResult,
  submitQuiz,
  bookTradeTestCenter,
  payAssessmentFeeWithRazorpay,
  syncAssessmentPaymentAfterCheckout,
  submitTradeTestResult,
  waiveAssessmentInterviewPilot,
  waiveAssessmentPaymentPilot,
} from '@/modules/worker-verification/services/verificationService';
import BondSecurityStage from '@/modules/worker-verification/components/bond-security/BondSecurityStage';
import {
  TRADE_TEST_REPORTING_WINDOW,
  TRADE_TEST_REPORTING_WINDOW_HINT,
  getTradeTestCentersForState,
} from '@/data/tradeTestCenters';
import { getWorkerActiveAssessment } from '@/modules/trade-test/services/assessmentService';
import type { AssessmentRow } from '@/modules/trade-test/types';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import JourneyHero from '@/modules/worker-verification/components/journey/JourneyHero';
import StageActionShell from '@/modules/worker-verification/components/journey/StageActionShell';
import StageWaitingShell from '@/modules/worker-verification/components/journey/StageWaitingShell';
import StageResultShell from '@/modules/worker-verification/components/journey/StageResultShell';
import JourneySupportPanel from '@/modules/worker-verification/components/journey/JourneySupportPanel';
import CompletedStepReview, {
  KycRecordSummary,
  type AssessmentPaymentRecord,
  type KycDocument,
} from '@/modules/worker-verification/components/journey/CompletedStepReview';
import { phaseForStage } from '@/modules/worker-verification/journey/phases';
import WorkerPreJourneyScreeningModal from '@/modules/worker-verification/components/journey/WorkerPreJourneyScreeningModal';
import { CREATED_BY_PARTNER_LABEL, hasParkedPartnerSession } from '@/modules/partner/lib/partnerAssistedWorker';
import EmitraWorkerOnboardingNoticeDialog from '@/modules/emitra/components/EmitraWorkerOnboardingNoticeDialog';
import { hasAckedEmitraOnboardingNotice } from '@/modules/emitra/lib/emitraWorkerOnboarding';
import WorkerDeclarationsSummary from '@/modules/worker-verification/components/journey/WorkerDeclarationsSummary';
import JourneyJobPicker from '@/modules/worker-verification/components/journey/JourneyJobPicker';
import { getWorkerDeclarations } from '@/modules/worker-verification/services/declarationService';
import type { WorkerPreJourneyDeclaration } from '@/modules/worker-verification/types/declarations.types';
import PassportRequirementInfo from '@/components/worker/PassportRequirementInfo';
import InsuranceCoverageInfo from '@/components/worker/InsuranceCoverageInfo';
import { todayDateInputValue } from '@/lib/validations/common';
import {
  isValidPassportNumber,
  normalizePassportNumber,
  passportExpiryIssue,
  passportMinValidityHintEn,
  toDateInputValueFromIso,
} from '@/lib/validations/passport';

const KYC_DOC_TYPES = [
  'pan',
  'aadhaar',
  'aadhaar_front',
  'aadhaar_back',
  'passport',
  'passport_front',
  'passport_last',
  'tenth_marksheet',
  'certificate',
  'id_proof',
];

function hasKycDoc(docs: KycDocument[], types: string[]): boolean {
  return docs.some((d) => types.includes(d.document_type));
}

function kycTypeFallbacks(docType: string): string[] {
  if (docType === 'pan') return ['pan', 'id_proof'];
  if (docType === 'aadhaar_front') return ['aadhaar_front', 'aadhaar', 'id_proof'];
  if (docType === 'aadhaar_back') return ['aadhaar_back', 'aadhaar', 'id_proof'];
  if (docType === 'passport_front') return ['passport_front', 'passport', 'id_proof'];
  if (docType === 'passport_last') return ['passport_last', 'passport', 'id_proof'];
  if (docType === 'tenth_marksheet') return ['tenth_marksheet', 'certificate'];
  if (docType === 'aadhaar' || docType === 'passport') return [docType, 'id_proof'];
  return [docType];
}

const SAFE_UPLOAD_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'pdf']);

/** Camera / WhatsApp / signed-URL picks often put a full URL in File.name. */
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
  base = base.replace(/[^\w.\- ()[\]]+/g, '_').replace(/_+/g, '_') || 'photo.jpg';
  if (base.length <= max) return base;
  const ext = base.match(/\.[a-z0-9]{1,5}$/i)?.[0] || '';
  return `${base.slice(0, Math.max(12, max - ext.length - 1))}…${ext}`;
}

function safeUploadExt(file: File, fallback = 'jpg'): string {
  const fromName = displayFileName(file.name, 80).split('.').pop()?.toLowerCase() || '';
  if (SAFE_UPLOAD_EXTS.has(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  const mime = file.type.split('/')[1]?.toLowerCase() || '';
  if (mime === 'jpeg') return 'jpg';
  if (SAFE_UPLOAD_EXTS.has(mime)) return mime;
  return fallback;
}

function KycPhotoField({
  label,
  required,
  file,
  disabled,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = file ? displayFileName(file.name) : null;
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full min-w-0 justify-start font-normal"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">{shown || 'Choose file'}</span>
      </Button>
      {file && (
        <p className="flex min-w-0 items-start gap-1 text-xs text-success">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-all">{shown}</span>
        </p>
      )}
    </div>
  );
}

function tradeTestAssignmentLabel(a: AssessmentRow): string {
  if (a.status === 'completed') {
    if (a.outcome === 'pass') return 'Passed — SafeWork quality reviewed';
    if (a.outcome === 'conditional_pass') return 'Conditional pass — SafeWork quality reviewed';
    if (a.outcome === 'fail') return 'Failed — you may be re-allocated for a retest';
    return 'Assessment completed';
  }
  if (a.status === 'allocated') return 'Waiting for centre to accept your assignment';
  if (a.status === 'centre_rejected') return 'Centre declined — SafeWork will reassign you';
  if (a.status === 'accepted' || a.status === 'scheduled') {
    return 'Appointment confirmed — report to the centre in the morning window';
  }
  if (a.status === 'checked_in' || a.status === 'kyc_done' || a.status === 'running') {
    return 'Assessment in progress at the centre';
  }
  if (a.status === 'centre_submitted' || a.status === 'under_review') {
    return 'Under SafeWork quality review';
  }
  return `Status: ${a.status}`;
}

const STORAGE_BUCKET = 'worker-videos';
const DOCS_BUCKET = 'worker-documents';

async function uploadJourneyDoc(userId: string, file: File, folder: string): Promise<string> {
  const ext = safeUploadExt(file, 'pdf');
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: urlErr } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(path, 31536000);
  if (urlErr || !signed?.signedUrl) {
    throw new Error(urlErr?.message || 'Could not create file URL');
  }
  return signed.signedUrl;
}

function MedicalFileField({
  label,
  hint,
  accept,
  file,
  existingUrl,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  existingUrl: string | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = file ? displayFileName(file.name) : null;
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>{label} *</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full min-w-0 justify-start font-normal"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">{shown || 'Choose file'}</span>
      </Button>
      {file && (
        <p className="flex min-w-0 items-start gap-1 text-xs text-success">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-all">{shown}</span>
        </p>
      )}
      {!file && existingUrl && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          View uploaded file
        </a>
      )}
    </div>
  );
}

const PHOTO_TARGET_MIN = 8;
const PHOTO_TARGET_MAX = 10;
const VIDEO_TARGET_MIN = 4;
const VIDEO_TARGET_MAX = 5;

/** Short, phase-oriented line shown under the hero heading. */
const HERO_SUBHEADINGS: Record<string, string> = {
  profile: 'Build a strong profile so employers pick you first.',
  verify: 'Verify your identity and skills to unlock the next steps.',
  assess: 'Complete your assessments to become GCC-ready.',
  deploy: 'Final steps before your overseas deployment.',
};

function notifyVerificationUpdated() {
  window.dispatchEvent(new Event('swg-verification-updated'));
}

function gccReadyDate(iso: string | null): string {
  if (!iso) return 'Today';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'Today'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN');
}

function formatAppointmentDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function JourneyShell({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  if (embedded) return <>{children}</>;
  return <WorkerPortalLayout>{children}</WorkerPortalLayout>;
}

/**
 * Full worker verification wizard:
 * essentials → quiz → media → interview → payment → tests → bond → GCC ready
 */
export default function WorkerVerificationPage({
  actingForWorkerId,
  embedded = false,
}: {
  /** Partner kiosk: fill this worker's journey while remaining signed in as partner. */
  actingForWorkerId?: string;
  /** Render without WorkerPortalLayout (partner chrome wraps the page). */
  embedded?: boolean;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const subjectId = actingForWorkerId || user?.id || '';
  const partnerKiosk = Boolean(actingForWorkerId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<WorkerVerification | null>(null);

  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [education, setEducation] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [tenthPass, setTenthPass] = useState<boolean | null>(null);
  const [ecrCategory, setEcrCategory] = useState<string | null>(null);

  const [quizItems, setQuizItems] = useState<SkillQuizItem[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, boolean | undefined>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFailScore, setQuizFailScore] = useState<number | null>(null);

  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<'photo' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const showDevReset = isJourneyResetEnabled();

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOnFile, setAadhaarOnFile] = useState('');
  const [bondTemplate, setBondTemplate] = useState<BondTemplate | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null);
  const [passportLastFile, setPassportLastFile] = useState<File | null>(null);
  const [tenthMarksheetFile, setTenthMarksheetFile] = useState<File | null>(null);
  const [kycConsent, setKycConsent] = useState(false);
  const [forceIdentity, setForceIdentity] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  const [kycStatusValue, setKycStatusValue] = useState('not_started');
  const [kycDocs, setKycDocs] = useState<KycDocument[]>([]);
  const [paymentRecord, setPaymentRecord] = useState<AssessmentPaymentRecord | null>(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [tradeResultFile, setTradeResultFile] = useState<File | null>(null);
  const [selectedTradeCenterId, setSelectedTradeCenterId] = useState('');
  const [tradeAssessment, setTradeAssessment] = useState<AssessmentRow | null>(null);
  const [medicalBloodFile, setMedicalBloodFile] = useState<File | null>(null);
  const [medicalXrayReportFile, setMedicalXrayReportFile] = useState<File | null>(null);
  const [medicalXrayPhotoFile, setMedicalXrayPhotoFile] = useState<File | null>(null);
  const [declaration, setDeclaration] = useState<WorkerPreJourneyDeclaration | null>(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [createdByPartner, setCreatedByPartner] = useState(false);
  const [createdByEmitra, setCreatedByEmitra] = useState(false);
  const [emitraNoticeOpen, setEmitraNoticeOpen] = useState(false);
  const [subjectProfile, setSubjectProfile] = useState<{
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null>(null);
  const loadGen = useRef(0);
  const completedDeclRef = useRef<WorkerPreJourneyDeclaration | null>(null);
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const gen = ++loadGen.current;
    if (!initialLoadDone.current) setLoading(true);
    setLoadError(null);
    try {
      const vRaw = await getOrCreateVerification(subjectId);
      const v: WorkerVerification = {
        ...vRaw,
        stage: normalizeVerificationStage(vRaw.stage, vRaw.trade_test_required),
      };
      if (gen !== loadGen.current) return;
      setRow(v);
      if (
        v.quiz_score != null &&
        !v.quiz_completed_at &&
        Number(v.quiz_score) < QUIZ_PASS_SCORE
      ) {
        setQuizFailScore(Number(v.quiz_score));
      } else if (v.quiz_completed_at) {
        setQuizFailScore(null);
      }
      const { data: subj } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', subjectId)
        .maybeSingle();
      if (gen !== loadGen.current) return;
      if (subj) {
        setSubjectProfile({
          full_name: subj.full_name,
          phone: subj.phone,
          email: subj.email,
        });
      }
      const decl = await getWorkerDeclarations(subjectId);
      if (gen !== loadGen.current) return;
      const completed =
        decl?.completed_at ? decl : completedDeclRef.current?.completed_at ? completedDeclRef.current : null;
      if (completed?.completed_at) {
        completedDeclRef.current = completed;
        setDeclaration(completed);
        setShowDeclarationModal(false);
      } else {
        setDeclaration(null);
        setShowDeclarationModal(true);
      }
      // Never prefill synthetic mobile-auth emails — worker types a real contact email
      setEmail(displayableEmail(v.email) || displayableEmail(subj?.email) || displayableEmail(profile?.email) || '');
      setCity(v.city || '');
      setState(v.state || '');
      setEducation(v.education_level || '');
      setPrimarySkill(v.primary_skill || '');
      const centersForState = getTradeTestCentersForState(v.state);
      setSelectedTradeCenterId(
        v.trade_test_center_id
        || (centersForState.length === 1 ? centersForState[0].id : centersForState[0]?.id || ''),
      );
      try {
        const assessment = await getWorkerActiveAssessment(subjectId);
        setTradeAssessment(assessment);
      } catch {
        setTradeAssessment(null);
      }

      const { data: wp, error: wpErr } = await supabase
        .from('worker_profiles')
        .select('kyc_status, pan_number, aadhaar_number, aadhaar_last4, passport_number, passport_expiry, has_passport, ecr_status, ecr_category, source_type, source_partner_id')
        .eq('user_id', subjectId)
        .maybeSingle();
      if (wpErr) {
        console.warn('Could not load worker KYC profile:', wpErr.message);
      }
      const sourceType = String(wp?.source_type || '');
      const emitraSourced = sourceType === 'emitra' || !!wp?.source_partner_id;
      setCreatedByPartner(
        sourceType === 'partner' || emitraSourced,
      );
      setCreatedByEmitra(emitraSourced);
      if (!partnerKiosk && emitraSourced && hasParkedPartnerSession() && !hasAckedEmitraOnboardingNotice()) {
        setEmitraNoticeOpen(true);
      }
      const kycStatus = String((wp as any)?.kyc_status || 'not_started');
      const savedPassport = String((wp as any)?.passport_number || '');
      const savedExpiry = toDateInputValueFromIso((wp as any)?.passport_expiry);
      setPassportNumber(savedPassport);
      setPassportExpiry(savedExpiry);
      const passportOk = isValidPassportNumber(savedPassport) && !passportExpiryIssue(savedExpiry);
      // Submitted KYC without a 6-month-valid passport is not complete — show the identity form.
      const kycOk =
        kycStatus === 'verified' || (kycStatus === 'submitted' && passportOk);
      setKycDone(kycOk);
      setKycStatusValue(kycStatus);

      const savedCategory = String((wp as any)?.ecr_category || '');
      const savedStatus = String((wp as any)?.ecr_status || '');
      if (savedCategory === 'ECNR' || savedStatus === 'not_required') {
        setTenthPass(true);
        setEcrCategory('ECNR');
      } else if (savedCategory === 'ECR' || savedStatus === 'required') {
        setTenthPass(false);
        setEcrCategory('ECR');
      } else if (v.education_level === 'Below 10th') {
        setTenthPass(false);
        setEcrCategory(null);
      } else if (v.education_level) {
        setTenthPass(true);
        setEcrCategory(null);
      } else {
        setTenthPass(null);
        setEcrCategory(null);
      }

      if (kycOk || kycStatus === 'rejected' || kycStatus === 'submitted') {
        const { data: docs } = await supabase
          .from('worker_documents')
          .select('document_name, document_type, file_url, verification_status, uploaded_at')
          .eq('worker_id', subjectId)
          .in('document_type', KYC_DOC_TYPES)
          .order('uploaded_at', { ascending: false });
        // A rejected re-upload keeps the old row, so show only the newest per document.
        const latest = new Map<string, KycDocument>();
        for (const doc of (docs || []) as KycDocument[]) {
          if (!latest.has(doc.document_name)) latest.set(doc.document_name, doc);
        }
        setKycDocs([...latest.values()]);
      } else {
        setKycDocs([]);
      }
      if ((wp as any)?.pan_number) setPanNumber(String((wp as any).pan_number));
      if ((wp as any)?.aadhaar_number) setAadhaarNumber(String((wp as any).aadhaar_number).replace(/\D/g, '').slice(0, 12));
      if ((wp as any)?.aadhaar_last4) setAadhaarOnFile(String((wp as any).aadhaar_last4));
      if (v.payment_status === 'paid' || v.paid_at) {
        const { data: pay } = await supabase
          .from('worker_assessment_payments')
          .select('id, amount, currency, provider, provider_ref, status, paid_at')
          .eq('user_id', subjectId)
          .order('created_at', { ascending: false })
          .limit(1);
        setPaymentRecord(((pay || [])[0] as AssessmentPaymentRecord) || null);
      } else {
        setPaymentRecord(null);
      }

      if (v.stage === 'bond') {
        try {
          setBondTemplate(await loadActiveBondTemplate());
        } catch {
          setBondTemplate(null);
        }
      }

      // Mandatory for apply: if KYC missing and worker already passed skill proof, show Identity.
      const pastMedia =
        v.stage !== 'essentials' &&
        v.stage !== 'find_jobs' &&
        v.stage !== 'apply_job' &&
        v.stage !== 'quiz' &&
        v.stage !== 'media';
      setForceIdentity(!kycOk && pastMedia && v.stage !== 'identity');

      if (v.primary_skill && (v.stage === 'quiz' || (!v.quiz_completed_at && v.stage !== 'find_jobs' && v.stage !== 'apply_job' && v.stage !== 'essentials'))) {
        const items = await loadQuizItems(v.primary_skill, v.state);
        setQuizItems(items);
      }

      if (v.primary_skill) {
        const { data: skill } = await supabase
          .from('worker_skills')
          .select('id')
          .eq('worker_id', subjectId)
          .eq('skill_name', v.primary_skill)
          .maybeSingle();
        if (skill?.id) {
          setSkillId(skill.id);
          const { data: media } = await supabase
            .from('worker_skill_media')
            .select('media_type')
            .eq('skill_id', skill.id);
          setPhotoCount((media || []).filter((m) => m.media_type === 'photo').length);
          setVideoCount((media || []).filter((m) => m.media_type === 'video').length);
        }
      }
    } catch (e) {
      if (gen !== loadGen.current) return;
      const msg = e instanceof Error ? e.message : 'Failed to load verification';
      setLoadError(msg);
      setRow(null);
      toast.error(msg);
    } finally {
      if (gen === loadGen.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }
  }, [subjectId, profile?.email, partnerKiosk]);

  const displayProfile = subjectProfile || profile;

  useEffect(() => {
    void load();
  }, [load]);

  const rawStage: VerificationStage = row
    ? normalizeVerificationStage(row.stage, row.trade_test_required)
    : 'essentials';
  // Recovery: quiz scored but stage not advanced (guard/lag) → show skill proof.
  const recoveredFromQuiz: VerificationStage =
    rawStage === 'quiz' && row?.quiz_completed_at ? 'media' : rawStage;
  // If KYC is done but stage stuck on identity (constraint lag), treat as interview.
  const effectiveRaw: VerificationStage =
    kycDone && recoveredFromQuiz === 'identity' ? 'awaiting_interview' : recoveredFromQuiz;
  const stage: VerificationStage = forceIdentity ? 'identity' : effectiveRaw;
  const tradeNeeded = row?.trade_test_required ?? skillRequiresTradeTest(row?.primary_skill);
  const needsTenthMarksheet = tenthPass === true;
  const navSteps = gccJourneyNavSteps({ includeAccountDetails: partnerKiosk });
  const currentNav: GccNavStepId = !declaration && showDeclarationModal
    ? 'pre_declaration'
    : navStepForStage(stage);
  const heroSubheading = HERO_SUBHEADINGS[phaseForStage(stage)];

  const journeyParam = searchParams.get('journey') as GccNavStepId | null;
  const validJourneyIds = navSteps.map((s) => s.id);
  const viewingJourney =
    journeyParam && validJourneyIds.includes(journeyParam) ? journeyParam : null;
  const viewingCompletedStep =
    !!viewingJourney &&
    viewingJourney !== currentNav &&
    navSteps.findIndex((s) => s.id === viewingJourney) < navSteps.findIndex((s) => s.id === currentNav);
  const viewingStepMeta = viewingCompletedStep
    ? navSteps.find((s) => s.id === viewingJourney)
    : null;

  const clearJourneyQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('journey');
    setSearchParams(next, { replace: true });
  };

  const currentQuiz = quizItems[quizIndex];

  const onSubmitIdentity = async () => {
    if (!subjectId) return;
    const pan = panNumber.trim().toUpperCase();
    const passport = normalizePassportNumber(passportNumber);
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      toast.error('Enter a valid PAN (e.g. ABCDE1234F)');
      return;
    }
    const aadhaar = aadhaarNumber.replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaar)) {
      toast.error('Enter your full 12-digit Aadhaar number');
      return;
    }
    if (!panFile && !hasKycDoc(kycDocs, ['pan', 'id_proof'])) {
      toast.error('Upload PAN front, Aadhaar front, and Aadhaar back photos');
      return;
    }
    if (!aadhaarFrontFile && !hasKycDoc(kycDocs, ['aadhaar_front', 'aadhaar', 'id_proof'])) {
      toast.error('Upload PAN front, Aadhaar front, and Aadhaar back photos');
      return;
    }
    if (!aadhaarBackFile && !hasKycDoc(kycDocs, ['aadhaar_back', 'aadhaar', 'id_proof'])) {
      toast.error('Upload PAN front, Aadhaar front, and Aadhaar back photos');
      return;
    }
    if (!isValidPassportNumber(passport)) {
      toast.error('Enter a valid passport number (e.g. A1234567)');
      return;
    }
    const expiryIssue = passportExpiryIssue(passportExpiry);
    if (expiryIssue) {
      toast.error(expiryIssue);
      return;
    }
    if (!passportFrontFile && !hasKycDoc(kycDocs, ['passport_front', 'passport', 'id_proof'])) {
      toast.error('Upload passport first page and last page photos');
      return;
    }
    if (!passportLastFile && !hasKycDoc(kycDocs, ['passport_last', 'passport', 'id_proof'])) {
      toast.error('Upload passport first page and last page photos');
      return;
    }
    if (
      needsTenthMarksheet &&
      !tenthMarksheetFile &&
      !hasKycDoc(kycDocs, ['tenth_marksheet', 'certificate'])
    ) {
      toast.error('Upload the Class 10 marksheet photo');
      return;
    }
    if (!kycConsent) {
      toast.error('Please accept the KYC consent');
      return;
    }

    setSaving(true);
    setKycUploading(true);
    try {
      // Ensure worker_profiles exists before document inserts (FK on worker_id).
      const { data: wpRow } = await supabase
        .from('worker_profiles')
        .select('user_id')
        .eq('user_id', subjectId)
        .maybeSingle();
      if (!wpRow) {
        if (partnerKiosk) {
          throw new Error('Worker profile not found. Return to My Workers and re-add this worker.');
        }
        const { error: ensureErr } = await supabase
          .from('worker_profiles')
          .insert({ user_id: subjectId } as any);
        if (ensureErr) throw new Error(ensureErr.message);
      }

      const uploadDoc = async (file: File, docType: string, name: string) => {
        const ext = safeUploadExt(file);
        const path = `${subjectId}/kyc/${docType}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('worker-documents')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(upErr.message || 'Document upload failed');
        const { data: signed, error: urlErr } = await supabase.storage
          .from('worker-documents')
          .createSignedUrl(path, 31536000);
        if (urlErr || !signed?.signedUrl) {
          throw new Error(urlErr?.message || 'Could not create document URL');
        }
        // Prefer typed doc; fall back if DB CHECK is not yet updated.
        const tryTypes = kycTypeFallbacks(docType);
        let lastErr: Error | null = null;
        for (const type of tryTypes) {
          const { error: dbErr } = await supabase.from('worker_documents').insert({
            worker_id: subjectId,
            document_name: name,
            document_type: type,
            file_url: signed.signedUrl,
            file_size: file.size,
            verification_status: 'pending',
          } as any);
          if (!dbErr) {
            lastErr = null;
            break;
          }
          lastErr = new Error(dbErr.message);
        }
        if (lastErr) throw lastErr;
      };

      if (panFile) await uploadDoc(panFile, 'pan', 'PAN Card Front');
      if (aadhaarFrontFile) await uploadDoc(aadhaarFrontFile, 'aadhaar_front', 'Aadhaar Card Front');
      if (aadhaarBackFile) await uploadDoc(aadhaarBackFile, 'aadhaar_back', 'Aadhaar Card Back');
      if (passportFrontFile) await uploadDoc(passportFrontFile, 'passport_front', 'Passport First Page');
      if (passportLastFile) await uploadDoc(passportLastFile, 'passport_last', 'Passport Last Page');
      if (needsTenthMarksheet && tenthMarksheetFile) {
        await uploadDoc(tenthMarksheetFile, 'tenth_marksheet', 'Class 10 Marksheet');
      }

      const next = await completeIdentityKyc(subjectId, {
        panNumber: pan,
        aadhaarNumber: aadhaar,
        passportNumber: passport,
        passportExpiry,
      });
      setRow(next);
      setForceIdentity(false);
      setPanFile(null);
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setPassportFrontFile(null);
      setPassportLastFile(null);
      setTenthMarksheetFile(null);
      notifyVerificationUpdated();
      toast.success('Identity submitted — SafeWork will verify your documents before the video interview');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'KYC submit failed');
    } finally {
      setKycUploading(false);
      setSaving(false);
    }
  };
  const onSaveEssentials = async () => {
    if (!subjectId) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || isWorkerMobileAuthEmail(trimmedEmail)) {
      toast.error('Enter a real email address before continuing');
      return;
    }
    if (!city.trim() || !state || !education || !primarySkill) {
      toast.error('Fill all essentials fields');
      return;
    }
    if (tenthPass === null) {
      toast.error('Select whether you have passed Class 10');
      return;
    }
    setSaving(true);
    try {
      const next = await saveEssentials(subjectId, {
        email: trimmedEmail,
        city: city.trim(),
        state,
        education_level: education,
        primary_skill: primarySkill,
        tenth_pass: tenthPass,
      });
      setRow(next);
      setEcrCategory(ecrFromTenthPass(tenthPass).ecr_category);
      notifyVerificationUpdated();
      await refreshProfile();
      toast.success('Essentials saved — find a job next');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onAnswerQuiz = (answer: boolean) => {
    if (!currentQuiz) return;
    setQuizAnswers((a) => ({ ...a, [currentQuiz.id]: answer }));
  };

  const onQuizContinue = async () => {
    if (!subjectId || !currentQuiz) return;
    if (quizAnswers[currentQuiz.id] === undefined) {
      toast.error('Select Yes or No');
      return;
    }
    if (quizIndex < quizItems.length - 1) {
      setQuizIndex((i) => i + 1);
      return;
    }
    setSaving(true);
    try {
      const answers = quizItems.map((item) => ({
        quiz_item_id: item.id,
        answer: Boolean(quizAnswers[item.id]),
      }));
      const next = await submitQuiz(subjectId, answers);
      const passed = (Number(next.quiz_score) || 0) >= QUIZ_PASS_SCORE;
      if (!passed) {
        setRow(next);
        setQuizIndex(0);
        setQuizAnswers({});
        setQuizFailScore(Number(next.quiz_score) || 0);
        notifyVerificationUpdated();
        toast.error(
          `Score ${next.quiz_score}%. You need ${QUIZ_PASS_SCORE}% to continue — try Test 1 again.`,
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const normalized = normalizeVerificationStage(
        // Prefer media if quiz finished even when DB stage lagged.
        next.quiz_completed_at && next.stage === 'quiz' ? 'media' : next.stage,
        next.trade_test_required,
      );
      // Drop ?journey=test1 so we don't show the "completed step" card instead of skill proof.
      clearJourneyQuery();
      setRow({ ...next, stage: normalized });
      setQuizIndex(0);
      setQuizFailScore(null);
      notifyVerificationUpdated();
      toast.success(
        `Test 1 complete — score ${next.quiz_score}%. Next: upload your skill proof.`,
      );
      // Soft reload — avoid full-page loading flash that can feel like a stuck quiz.
      try {
        const vRaw = await getOrCreateVerification(subjectId);
        const vStage = normalizeVerificationStage(
          vRaw.quiz_completed_at && vRaw.stage === 'quiz' ? 'media' : vRaw.stage,
          vRaw.trade_test_required,
        );
        setRow({ ...vRaw, stage: vStage });
        if (vRaw.primary_skill) {
          const { data: skill } = await supabase
            .from('worker_skills')
            .select('id')
            .eq('worker_id', subjectId)
            .eq('skill_name', vRaw.primary_skill)
            .maybeSingle();
          if (skill?.id) {
            setSkillId(skill.id);
            const { data: media } = await supabase
              .from('worker_skill_media')
              .select('media_type')
              .eq('skill_id', skill.id);
            setPhotoCount((media || []).filter((m) => m.media_type === 'photo').length);
            setVideoCount((media || []).filter((m) => m.media_type === 'video').length);
          } else {
            // Essentials should have created this — create now so uploads work.
            const { data: inserted } = await supabase
              .from('worker_skills')
              .insert({
                worker_id: subjectId,
                skill_name: vRaw.primary_skill,
                proficiency_level: 'intermediate',
                years_of_experience: 0,
              } as any)
              .select('id')
              .maybeSingle();
            if (inserted?.id) setSkillId(inserted.id);
          }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        /* row already set from submit */
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Quiz submit failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadMediaFiles = async (files: FileList | File[] | null, type: 'photo' | 'video') => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    if (!subjectId || !skillId) {
      toast.error('Primary skill not ready — go back to essentials');
      return;
    }

    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const valid: File[] = [];
    for (const file of list) {
      if (file.size > maxSize) {
        toast.error(
          `${file.name} is too large (${type === 'video' ? 'max 50MB' : 'max 10MB'}) — skipped`,
        );
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;

    setUploadingKind(type);
    setUploadProgress({ current: 0, total: valid.length });
    let ok = 0;
    try {
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        setUploadProgress({ current: i + 1, total: valid.length });
        const ext = file.name.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
        const folder = type === 'photo' ? 'photos' : 'videos';
        const filePath = `${subjectId}/skills/${skillId}/${folder}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from('worker_skill_media').insert({
          skill_id: skillId,
          worker_id: subjectId,
          media_type: type,
          file_path: filePath,
        });
        if (insertError) throw insertError;
        ok += 1;
        if (type === 'photo') setPhotoCount((c) => c + 1);
        else setVideoCount((c) => c + 1);
      }
      toast.success(
        type === 'photo'
          ? `${ok} photo${ok === 1 ? '' : 's'} uploaded`
          : `${ok} video${ok === 1 ? '' : 's'} uploaded`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingKind(null);
      setUploadProgress(null);
      if (type === 'photo' && photoRef.current) photoRef.current.value = '';
      if (type === 'video' && videoRef.current) videoRef.current.value = '';
    }
  };

  const onCompleteMedia = async () => {
    if (!subjectId) return;
    if (photoCount < 1 || videoCount < 1) {
      toast.error('Upload at least 1 photo and 1 video of your primary skill');
      return;
    }
    if (photoCount < PHOTO_TARGET_MIN || videoCount < VIDEO_TARGET_MIN) {
      const proceed = window.confirm(
        `Hint: 8–10 photos and 4–5 videos work best (आप अभी ${photoCount} photos, ${videoCount} videos).\nContinue anyway?`,
      );
      if (!proceed) return;
    }
    setSaving(true);
    try {
      const next = await completeMediaStep(subjectId);
      setRow(next);
      notifyVerificationUpdated();
      toast.success('Skill proof saved — next: Identity (KYC)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not continue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <JourneyShell embedded={embedded}>
        <div className="py-16 text-center text-muted-foreground">Loading your journey…</div>
      </JourneyShell>
    );
  }

  if (loadError || !row) {
    return (
      <JourneyShell embedded={embedded}>
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold font-heading">Could not load GCC journey</h1>
            <p className="text-sm text-muted-foreground">
              {loadError ||
                'Verification data is missing. If this keeps happening, run the worker_verification migration in Supabase.'}
            </p>
            <Button type="button" className="rounded-xl" onClick={() => void load()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </JourneyShell>
    );
  }

  if (rawStage === 'gcc_ready' && !forceIdentity) {
    return (
      <JourneyShell embedded={embedded}>
        <div className="mx-auto max-w-lg">
          <StageResultShell
            tone="success"
            title={partnerKiosk ? 'This worker is GCC ready' : "You're GCC ready"}
            body={
              partnerKiosk
                ? 'Their profile is verified. They can sign in and apply to jobs. You can return to My Workers.'
                : 'Your profile is verified and ready for employers. Apply to overseas jobs with priority visibility.'
            }
            stats={[
              { label: 'Ready since', value: gccReadyDate(row.gcc_ready_at) },
              { label: 'Skill', value: row.primary_skill || '—' },
              { label: 'Status', value: 'Verified' },
            ]}
          >
            {partnerKiosk ? (
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/partner/my-workers">Back to My Workers</Link>
              </Button>
            ) : (
              <>
            <Button asChild className="rounded-xl">
              <Link to="/jobs">Browse & apply to jobs</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/worker/dashboard">Go to dashboard</Link>
            </Button>
              </>
            )}
          </StageResultShell>
        </div>
      </JourneyShell>
    );
  }

  return (
    <JourneyShell embedded={embedded}>
      {showDeclarationModal && !emitraNoticeOpen ? (
        <div className="mx-auto max-w-5xl">
          <WorkerPreJourneyScreeningModal
            userId={subjectId || ''}
            isOpen
            variant="inline"
            onCompleted={(decl) => {
              completedDeclRef.current = decl;
              setDeclaration(decl);
              setShowDeclarationModal(false);
              notifyVerificationUpdated();
            }}
          />
        </div>
      ) : (
      <>
      {createdByEmitra && (
        <EmitraWorkerOnboardingNoticeDialog
          open={emitraNoticeOpen}
          onOpenChange={setEmitraNoticeOpen}
        />
      )}
      <div className="mx-auto max-w-5xl space-y-5">
        <JourneyHero
          stage={stage}
          subheading={heroSubheading}
          attributionLabel={
            createdByEmitra
              ? 'Created by eMitra'
              : createdByPartner
                ? CREATED_BY_PARTNER_LABEL
                : null
          }
        />

        {declaration && (
          <WorkerDeclarationsSummary declaration={declaration} />
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="min-w-0 space-y-5">
        {viewingCompletedStep && viewingStepMeta && (
          <CompletedStepReview
            stepId={viewingJourney}
            stepLabel={viewingStepMeta.label}
            currentStepLabel={VERIFICATION_STAGE_LABELS[stage]}
            row={row}
            photoCount={photoCount}
            videoCount={videoCount}
            kycStatus={kycStatusValue}
            kycDocs={kycDocs}
            paymentRecord={paymentRecord}
            identity={{ pan: panNumber, aadhaarLast4: aadhaarOnFile, passport: passportNumber, passportExpiry }}
            ecrCategory={ecrCategory}
            tenthPass={tenthPass}
            tradeAssessment={tradeAssessment}
            onGoToCurrent={clearJourneyQuery}
          >
            {viewingJourney === 'skill_proof' && (
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm font-medium">Add more work proof</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Stronger portfolios get picked faster. You can keep adding photos and videos any
                  time — employers see the latest.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={!!uploadingKind}
                    onChange={(e) => void uploadMediaFiles(e.target.files, 'photo')}
                  />
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    disabled={!!uploadingKind}
                    onChange={(e) => void uploadMediaFiles(e.target.files, 'video')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadingKind}
                    onClick={() => photoRef.current?.click()}
                  >
                    {uploadingKind === 'photo' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Add photos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadingKind}
                    onClick={() => videoRef.current?.click()}
                  >
                    {uploadingKind === 'video' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Video className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Add videos
                  </Button>
                  {uploadingKind && uploadProgress && (
                    <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                      Uploading {uploadProgress.current} of {uploadProgress.total}…
                    </span>
                  )}
                </div>
              </div>
            )}
          </CompletedStepReview>
        )}

        {!viewingCompletedStep && stage === 'essentials' && (
          <StageActionShell
            icon={UserRound}
            title={partnerKiosk ? 'Worker details' : 'Your major details'}
            description={
              partnerKiosk
                ? 'Name and mobile are already saved. Fill email, Class 10 status, location, education, and primary skill for this worker.'
                : 'Name and mobile are already saved. Confirm your email, then add Class 10 status, location, education, and one primary skill.'
            }
            timeEstimate="Takes 2–3 minutes"
            footer={
              <Button className="w-full sm:w-auto" onClick={() => void onSaveEssentials()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Continue to find jobs <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            }
          >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={displayProfile?.full_name || ''} disabled className="bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile</Label>
                  <Input value={displayProfile?.phone || ''} disabled className="bg-muted/40" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Signup used mobile login. Enter a real email so we can reach you for interviews and updates.
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Have you passed Class 10 (matric)? *</Label>
                  <RadioGroup
                    value={tenthPass === null ? '' : tenthPass ? 'yes' : 'no'}
                    onValueChange={(v) => {
                      const passed = v === 'yes';
                      setTenthPass(passed);
                      setEcrCategory(ecrFromTenthPass(passed).ecr_category);
                      if (!passed) setEducation('Below 10th');
                      else if (education === 'Below 10th') setEducation('');
                    }}
                    className="flex flex-wrap gap-6 pt-1"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <RadioGroupItem value="yes" id="tenth-pass-yes" />
                      Yes — 10th pass
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <RadioGroupItem value="no" id="tenth-pass-no" />
                      No — below 10th
                    </label>
                  </RadioGroup>
                  {tenthPass !== null && (
                    <p className="text-xs text-muted-foreground">
                      You will be categorised as{' '}
                      <span className="font-semibold text-foreground">
                        {tenthPass
                          ? 'ECNR — no emigration clearance required'
                          : 'ECR — emigration clearance required'}
                      </span>
                      .
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>City *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State *</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {indianStates.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Education *</Label>
                  <Select
                    value={education}
                    onValueChange={setEducation}
                    disabled={tenthPass === false}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {educationOptionsForTenthPass(tenthPass).map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Primary skill *</Label>
                  <Select value={primarySkill} onValueChange={setPrimarySkill}>
                    <SelectTrigger><SelectValue placeholder="One skill only" /></SelectTrigger>
                    <SelectContent>
                      {WORKER_SKILLS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">You can add secondary skills later on your profile.</p>
                </div>
              </div>
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'find_jobs' && (
          <StageActionShell
            icon={Search}
            title="Find jobs"
            description="Browse overseas openings, favourite the ones that fit, then continue to apply. Test 1 will match the job you apply to."
            timeEstimate="Browse and save favourites"
          >
            <JourneyJobPicker
              workerUserId={subjectId}
              mode="find"
              primarySkill={row.primary_skill}
              onAdvanced={(next) => {
                setRow(next);
                notifyVerificationUpdated();
                clearJourneyQuery();
              }}
            />
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'apply_job' && (
          <StageActionShell
            icon={Briefcase}
            title="Apply to a job"
            description="Apply to one job to unlock Test 1. The work quiz uses that job’s trade."
            timeEstimate="One application required"
          >
            <JourneyJobPicker
              workerUserId={subjectId}
              mode="apply"
              primarySkill={row.primary_skill}
              onAdvanced={async (next) => {
                setRow(next);
                notifyVerificationUpdated();
                clearJourneyQuery();
                if (next.primary_skill) {
                  const items = await loadQuizItems(next.primary_skill, next.state);
                  setQuizItems(items);
                  setQuizIndex(0);
                  setQuizAnswers({});
                }
              }}
            />
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'quiz' && !currentQuiz && (
          <StageActionShell
            icon={ClipboardList}
            title="Test 1 — Do you know this work?"
            description="Loading quiz questions for the job you applied to…"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing Test 1
            </div>
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'quiz' && currentQuiz && (
          <StageActionShell
            icon={ClipboardList}
            title="Test 1 — Do you know this work?"
            description={
              <>
                Watch the example for{' '}
                <span className="font-medium text-foreground">{row.primary_skill || 'your skill'}</span>
                {row.journey_job_id ? ' (from the job you applied to)' : ''}, then
                answer Yes or No. You upload your own photos and videos in the next step. Question {quizIndex + 1} of{' '}
                {quizItems.length}.
              </>
            }
            footer={
              <Button onClick={() => void onQuizContinue()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {quizIndex < quizItems.length - 1 ? 'Next example' : 'Finish Test 1'}
              </Button>
            }
          >
              {quizFailScore !== null && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-foreground">
                    Last score <span className="font-semibold">{quizFailScore}%</span>. Pass mark is{' '}
                    {QUIZ_PASS_SCORE}%. Answer all {quizItems.length} questions again to continue.
                  </p>
                </div>
              )}

              {(() => {
                const embed = youtubeEmbedUrl(currentQuiz.youtube_url);
                if (embed) {
                  return (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                      <iframe
                        title="Skill example video"
                        src={embed}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                if (currentQuiz.youtube_url) {
                  return (
                    <a
                      href={currentQuiz.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Video className="h-4 w-4" /> Open example video
                    </a>
                  );
                }
                return null;
              })()}

              {currentQuiz.image_url && (
                <img
                  src={currentQuiz.image_url}
                  alt="Skill example"
                  className="rounded-xl max-h-64 w-full object-cover border border-border"
                />
              )}

              {!currentQuiz.youtube_url && !currentQuiz.image_url && (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  No example media for this question — answer from your experience as{' '}
                  <span className="font-medium text-foreground">{row.primary_skill}</span>.
                </div>
              )}

              <h2 className="text-lg font-semibold font-heading leading-snug">{currentQuiz.question}</h2>
              {currentQuiz.question_hi ? (
                <p className="text-base text-muted-foreground leading-snug -mt-1" lang="hi">
                  {currentQuiz.question_hi}
                </p>
              ) : null}

              <RadioGroup
                value={
                  quizAnswers[currentQuiz.id] === undefined
                    ? ''
                    : quizAnswers[currentQuiz.id]
                      ? 'yes'
                      : 'no'
                }
                onValueChange={(v) => onAnswerQuiz(v === 'yes')}
                className="flex gap-6"
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value="yes" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value="no" /> No
                </label>
              </RadioGroup>
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'media' && (
          <StageActionShell
            icon={ImagePlus}
            title="Skill proof upload"
            description={
              <>
                Upload photos and short videos of your work as{' '}
                <span className="font-medium text-foreground">{row.primary_skill}</span> before Test 2 (video
                interview).
                <span className="mt-2 block text-foreground" lang="hi">
                  अपने काम करते हुए <span className="font-medium">8 से 10 photos</span> और{' '}
                  <span className="font-medium">4–5 videos</span> डालिए, जिनमें आप साफ दिखें — काम करते हुए।
                </span>
              </>
            }
            timeEstimate="Takes 5–10 minutes"
            footer={
              <Button onClick={() => void onCompleteMedia()} disabled={saving || !!uploadingKind}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save &amp; continue to Identity
              </Button>
            }
          >
              {uploadingKind && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span>
                    Uploading {uploadingKind === 'photo' ? 'photos' : 'videos'}
                    {uploadProgress
                      ? ` ${uploadProgress.current} of ${uploadProgress.total}`
                      : ''}
                    … Please wait.
                  </span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div
                  className={cn(
                    'border border-dashed rounded-xl p-5 text-center transition-opacity',
                    uploadingKind === 'photo' && 'border-primary/50 bg-primary/5',
                    uploadingKind && uploadingKind !== 'photo' && 'opacity-60',
                  )}
                >
                  <ImagePlus className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-0.5">
                    Photos ({photoCount}/{PHOTO_TARGET_MAX})
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Target {PHOTO_TARGET_MIN}–{PHOTO_TARGET_MAX}
                  </p>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={!!uploadingKind}
                    onChange={(e) => void uploadMediaFiles(e.target.files, 'photo')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadingKind}
                    onClick={() => photoRef.current?.click()}
                  >
                    {uploadingKind === 'photo' ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1" />
                    )}
                    {uploadingKind === 'photo' ? 'Uploading…' : 'Select photos'}
                  </Button>
                </div>
                <div
                  className={cn(
                    'border border-dashed rounded-xl p-5 text-center transition-opacity',
                    uploadingKind === 'video' && 'border-primary/50 bg-primary/5',
                    uploadingKind && uploadingKind !== 'video' && 'opacity-60',
                  )}
                >
                  <Video className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-0.5">
                    Videos ({videoCount}/{VIDEO_TARGET_MAX})
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Target {VIDEO_TARGET_MIN}–{VIDEO_TARGET_MAX}
                  </p>
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    disabled={!!uploadingKind}
                    onChange={(e) => void uploadMediaFiles(e.target.files, 'video')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadingKind}
                    onClick={() => videoRef.current?.click()}
                  >
                    {uploadingKind === 'video' ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1" />
                    )}
                    {uploadingKind === 'video' ? 'Uploading…' : 'Select videos'}
                  </Button>
                </div>
              </div>
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'identity' && kycDone && (
          <StageWaitingShell
            icon={ShieldCheck}
            title="We're verifying your identity"
            body={
              needsTenthMarksheet
                ? 'Your PAN, Aadhaar, passport and Class 10 marksheet are submitted. SafeWork reviews them before scheduling your video interview.'
                : 'Your PAN, Aadhaar and passport are submitted. SafeWork reviews them before scheduling your video interview.'
            }
            expected="Usually within a few hours"
            notifyNote="You'll get an SMS and an app notification the moment verification is done — no need to keep this page open."
            timeline={[
              {
                label: 'Identity documents submitted',
                detail: needsTenthMarksheet
                  ? 'PAN, Aadhaar, Passport & Class 10 marksheet uploaded'
                  : 'PAN, Aadhaar & Passport uploaded',
                status: 'done',
              },
              { label: 'SafeWork verifying your documents', status: 'current' },
              { label: 'Video interview scheduled', status: 'pending' },
            ]}
          >
            <div className="w-full space-y-4 rounded-xl border border-border bg-muted/20 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What you submitted
              </p>
              <KycRecordSummary
                identity={{ pan: panNumber, aadhaarLast4: aadhaarOnFile, passport: passportNumber, passportExpiry }}
                kycDocs={kycDocs}
                submittedOn={row.kyc_verified_at || row.updated_at}
                verified={kycStatusValue === 'verified'}
              />
              <div className="flex items-start gap-2 border-t border-border pt-3">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  These records are locked during review. If verification fails, you'll be able to
                  correct and re-upload them here.
                </p>
              </div>
            </div>
          </StageWaitingShell>
        )}

        {!viewingCompletedStep && stage === 'identity' && !kycDone && (
          <StageActionShell
            icon={ShieldCheck}
            title="Identity (KYC)"
            description={
              needsTenthMarksheet
                ? 'Required before applying to jobs. Upload PAN, Aadhaar, a passport valid for at least 6 months, and your Class 10 marksheet. SafeWork verifies these before your video interview is scheduled.'
                : 'Required before applying to jobs. Upload PAN, Aadhaar, and a passport that is valid for at least 6 months. SafeWork verifies these before your video interview is scheduled.'
            }
            timeEstimate="Takes 5–7 minutes"
            footer={
              <Button type="button" onClick={() => void onSubmitIdentity()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit identity &amp; continue
              </Button>
            }
          >
              {(kycStatusValue === 'rejected' || row.kyc_status === 'rejected') && (
                <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="text-xs text-foreground">
                      <p className="font-semibold text-destructive">Your documents need to be re-submitted</p>
                      <p className="mt-0.5">
                        {row.kyc_rejection_reason
                          ? row.kyc_rejection_reason
                          : 'Some details did not match. Please re-check your PAN, Aadhaar and passport photos, then upload clear photos again.'}
                      </p>
                    </div>
                  </div>
                  {kycDocs.length > 0 && (
                    <div className="border-t border-destructive/20 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Previously submitted — review before re-uploading
                      </p>
                      <KycRecordSummary
                        identity={{ pan: panNumber, aadhaarLast4: aadhaarOnFile, passport: passportNumber, passportExpiry }}
                        kycDocs={kycDocs}
                        submittedOn={row.updated_at}
                        verified={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {kycUploading && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  Uploading identity documents… Please wait.
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>PAN Number *</Label>
                  <Input
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    disabled={saving}
                  />
                </div>
                <KycPhotoField
                  label="PAN Card Front Photo"
                  required
                  file={panFile}
                  disabled={saving}
                  onChange={setPanFile}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Aadhaar Number *</Label>
                  <Input
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="123412341234"
                    inputMode="numeric"
                    maxLength={12}
                    disabled={saving}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {aadhaarOnFile
                      ? `On file: XXXX XXXX ${aadhaarOnFile}`
                      : 'Stored securely and used only for emigration paperwork'}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <KycPhotoField
                    label="Aadhaar Card Front Photo"
                    required
                    file={aadhaarFrontFile}
                    disabled={saving}
                    onChange={setAadhaarFrontFile}
                  />
                  <KycPhotoField
                    label="Aadhaar Card Back Photo"
                    required
                    file={aadhaarBackFile}
                    disabled={saving}
                    onChange={setAadhaarBackFile}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                  Passport *
                  <PassportRequirementInfo />
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Passport Number *</Label>
                    <Input
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(normalizePassportNumber(e.target.value))}
                      placeholder="A1234567"
                      maxLength={9}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Passport expiry date *</Label>
                    <Input
                      type="date"
                      className="h-12"
                      value={passportExpiry}
                      min={todayDateInputValue()}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      disabled={saving}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {passportMinValidityHintEn()}
                    </p>
                    {passportExpiry && passportExpiryIssue(passportExpiry) ? (
                      <p className="text-[11px] text-destructive">{passportExpiryIssue(passportExpiry)}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <KycPhotoField
                    label="Passport First Page Photo"
                    required
                    file={passportFrontFile}
                    disabled={saving}
                    onChange={setPassportFrontFile}
                  />
                  <KycPhotoField
                    label="Passport Last Page Photo"
                    required
                    file={passportLastFile}
                    disabled={saving}
                    onChange={setPassportLastFile}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of the first page (photo + expiry) and the last page of your passport.
                </p>
              </div>
              {needsTenthMarksheet && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Class 10 marksheet *</p>
                  <KycPhotoField
                    label="10th marksheet photo"
                    required
                    file={tenthMarksheetFile}
                    disabled={saving}
                    onChange={setTenthMarksheetFile}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required because you confirmed Class 10 pass (ECNR). A clear photo of the original marksheet is enough.
                  </p>
                </div>
              )}
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={kycConsent}
                  disabled={saving}
                  onChange={(e) => setKycConsent(e.target.checked)}
                />
                <span>
                  I consent to SafeWork Global verifying my identity documents for job placement. The information is accurate.
                </span>
              </label>
          </StageActionShell>
        )}

        {!viewingCompletedStep && stage === 'awaiting_interview' && (
          <StageWaitingShell
            icon={Calendar}
            title="Test 2 — Video interview"
            body={
              row.interview_scheduled_at
                ? `Join on time from a quiet place with a good network.${
                    row.interviewer_name ? ` ${row.interviewer_name} will interview you.` : ''
                  }`
                : row.interview_status === 'rejected'
                  ? 'Your last interview was not approved. SafeWork will reschedule a new interview — the new date will appear here.'
                  : 'SafeWork will schedule your video interview and assign an interviewer. The date, time and joining link appear here.'
            }
            expected={row.interview_scheduled_at ? undefined : 'Usually scheduled within 1–2 days'}
            notifyNote="We'll SMS you the date and joining link as soon as your interview is scheduled."
            timeline={[
              { label: 'Identity verified', status: 'done' },
              {
                label: row.interview_scheduled_at ? 'Interview scheduled' : 'SafeWork assigning an interviewer',
                detail: row.interview_scheduled_at
                  ? `${formatWhen(row.interview_scheduled_at)}${
                      row.interviewer_name ? ` · ${row.interviewer_name}` : ''
                    }`
                  : undefined,
                status: 'current',
              },
              { label: 'Attend the video interview', status: 'pending' },
            ]}
          >
            {row.interview_scheduled_at && (
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm space-y-1 text-left">
                {row.interviewer_name && (
                  <p>
                    <span className="text-muted-foreground">Interviewer: </span>
                    <span className="font-medium">{row.interviewer_name}</span>
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">When: </span>
                  <span className="font-medium">{formatWhen(row.interview_scheduled_at)}</span>
                </p>
              </div>
            )}
            {row.interview_meeting_url && (
              <Button asChild>
                <a href={row.interview_meeting_url} target="_blank" rel="noreferrer">
                  <Video className="h-4 w-4 mr-1" />
                  Join interview
                </a>
              </Button>
            )}
            {showDevReset && (
            <Button
              variant="outline"
              disabled={saving}
              onClick={async () => {
                if (!subjectId) return;
                setSaving(true);
                try {
                  const next = await waiveAssessmentInterviewPilot(subjectId);
                  setRow({
                    ...next,
                    stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                  });
                  notifyVerificationUpdated();
                  toast.success('Interview skipped for pilot — continue to payment');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Could not continue');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Calendar className="h-4 w-4 mr-1" />}
              Continue (pilot — interview skipped)
            </Button>
            )}
          </StageWaitingShell>
        )}

        {!viewingCompletedStep && stage === 'awaiting_payment' && (
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-heading leading-tight">Assessment fee</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A one-time ₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')} fee covering visa, flights, documentation, insurance, government fees, and more. Pay securely — you continue automatically once it succeeds.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-3xl font-bold font-heading tabular-nums text-foreground">
                  ₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One-time all-inclusive fee for your overseas job application
                </p>
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">Skill assessment &amp; processing</span>
                    <span className="tabular-nums">₹{Math.round(ASSESSMENT_FEE_INR / 1.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="tabular-nums">
                      ₹{(ASSESSMENT_FEE_INR - Math.round(ASSESSMENT_FEE_INR / 1.18)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-semibold font-heading text-foreground">
                  What you get in this ₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No hidden agent charges — this fee covers:
                </p>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ASSESSMENT_FEE_INCLUSIONS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="inline-flex items-center gap-1.5">
                        {item}
                        {item === 'Insurance' && <InsuranceCoverageInfo />}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <ShieldCheck className="h-4 w-4" /> Safe, secure &amp; trusted
                </p>
                <ul className="mt-2 space-y-1 text-xs text-foreground">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Payment is encrypted and PCI-DSS compliant
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" /> You get an official receipt with an ID
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Processed by Razorpay — UPI, card or netbanking
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-foreground">
                  <span className="font-semibold">Never pay any agent or person.</span> All official payments happen only on this screen. Report anyone asking for cash to SafeWork.
                </p>
              </div>

              <Button
                className="w-full"
                disabled={saving}
                onClick={async () => {
                  if (!subjectId) return;
                  setSaving(true);
                  try {
                    const next = await payAssessmentFeeWithRazorpay({
                      name: displayProfile?.full_name,
                      email: displayableEmail(row?.email) || displayableEmail(displayProfile?.email),
                      contact: displayProfile?.phone,
                      workerUserId: partnerKiosk ? subjectId : undefined,
                    });
                    setRow({
                      ...next,
                      stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                    });
                    notifyVerificationUpdated();
                    toast.success(
                      next.trade_test_required
                        ? 'Payment successful — continue to trade test'
                        : 'Payment successful — continue to medical',
                    );
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Payment failed';
                    if (/cancelled/i.test(msg)) {
                      toast.message('Payment cancelled');
                    } else {
                      toast.error(msg);
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
                Pay ₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')} securely
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                By proceeding you agree to SafeWork Global's terms &amp; conditions.
              </p>

              <Button
                variant="outline"
                className="w-full"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const next = await syncAssessmentPaymentAfterCheckout();
                    setRow({
                      ...next,
                      stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                    });
                    notifyVerificationUpdated();
                    toast.success('Payment synced — journey unlocked');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'No completed payment found yet');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Already paid? Sync payment
              </Button>

              {showDevReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border border-dashed border-amber-500/40 text-muted-foreground"
                  disabled={saving}
                  onClick={async () => {
                    if (!subjectId) return;
                    setSaving(true);
                    try {
                      const next = await waiveAssessmentPaymentPilot(subjectId);
                      setRow({
                        ...next,
                        stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                      });
                      notifyVerificationUpdated();
                      toast.success('Fee waived for pilot (dev)');
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Could not continue');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Dev: continue without payment
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && (stage === 'trade_test' || (stage === 'tests' && tradeNeeded)) && (() => {
          const centers = getTradeTestCentersForState(row.state);
          const centerConfirmed = Boolean(row.trade_test_center_id);
          const hasPartnerAssignment =
            Boolean(tradeAssessment) && tradeAssessment?.status !== 'centre_rejected';
          const showLegacyPilot = !hasPartnerAssignment;
          return (
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Test 3 — Physical trade test</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required for <span className="font-medium text-foreground">{row.primary_skill}</span>.
                    SafeWork assigns you to a trade test centre. Bring your physical Aadhaar card on the day.
                  </p>
                </div>
              </div>

              {tradeAssessment && tradeAssessment.status !== 'centre_rejected' ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {tradeAssessment.reporting_window || TRADE_TEST_REPORTING_WINDOW}
                    </Badge>
                    <Badge variant="outline">{tradeAssessment.status.replace(/_/g, ' ')}</Badge>
                    {tradeAssessment.outcome && (
                      <Badge>{tradeAssessment.outcome.replace(/_/g, ' ')}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {tradeAssessment.center_name || row.trade_test_center_name || 'Trade test centre'}
                  </p>
                  {(tradeAssessment.center_city || tradeAssessment.center_state || tradeAssessment.center_pincode) && (
                    <p className="text-sm text-muted-foreground">
                      {[tradeAssessment.center_city, tradeAssessment.center_state, tradeAssessment.center_pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {tradeAssessment.center_address && (
                    <p className="flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{tradeAssessment.center_address}</span>
                    </p>
                  )}
                  {(tradeAssessment.center_contact_name || tradeAssessment.center_contact_phone) && (
                    <p className="flex items-start gap-2 text-sm text-foreground">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>
                        {[tradeAssessment.center_contact_name, tradeAssessment.center_contact_phone]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </p>
                  )}
                  {(tradeAssessment.appointment_date || tradeAssessment.scheduled_at) && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Appointment: </span>
                      <span className="font-medium">
                        {formatAppointmentDate(
                          tradeAssessment.appointment_date || tradeAssessment.scheduled_at,
                        )}
                      </span>
                    </p>
                  )}
                  {(row.trade_test_instructions || tradeAssessment.center_instructions) && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {row.trade_test_instructions || tradeAssessment.center_instructions}
                    </p>
                  )}
                  {tradeAssessment.center_maps_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={tradeAssessment.center_maps_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Open in Maps
                      </a>
                    </Button>
                  )}
                  <p className="text-sm text-foreground">{tradeTestAssignmentLabel(tradeAssessment)}</p>
                  <p className="text-xs text-muted-foreground">
                    Centre names are location-based. Partner company names are not shown here.
                  </p>
                </div>
              ) : row.trade_test_place || row.trade_test_scheduled_at || row.trade_test_instructions ? (
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm space-y-1">
                  {tradeAssessment?.status === 'centre_rejected' && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Previous centre declined — SafeWork will reassign you.
                    </p>
                  )}
                  {row.trade_test_place && (
                    <p>
                      <span className="text-muted-foreground">Centre: </span>
                      <span className="font-medium">{row.trade_test_place}</span>
                    </p>
                  )}
                  {row.trade_test_scheduled_at && (
                    <p>
                      <span className="text-muted-foreground">When: </span>
                      <span className="font-medium">{formatWhen(row.trade_test_scheduled_at)}</span>
                    </p>
                  )}
                  {row.trade_test_reporting_window && (
                    <p>
                      <span className="text-muted-foreground">Reporting window: </span>
                      <span className="font-medium">{row.trade_test_reporting_window}</span>
                    </p>
                  )}
                  {row.trade_test_instructions && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {row.trade_test_instructions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 space-y-2">
                  <p className="text-sm font-medium">Waiting for SafeWork allocation</p>
                  <p className="text-xs text-muted-foreground">
                    An admin will assign you to a centre near{' '}
                    {row.state || 'your state'}. You will see the full address, appointment date, and
                    reporting window here once allocated.
                  </p>
                  {tradeAssessment?.status === 'centre_rejected' && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Previous centre declined — SafeWork will reassign you.
                    </p>
                  )}
                </div>
              )}

              {showLegacyPilot && (
                <details className="rounded-lg border p-4 space-y-3">
                  <summary className="text-sm font-medium cursor-pointer">
                    Pilot fallback — self-confirm centre &amp; upload (only if not allocated yet)
                  </summary>
                  <div className="pt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Reporting time: {TRADE_TEST_REPORTING_WINDOW}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{TRADE_TEST_REPORTING_WINDOW_HINT}</p>

                    {centers.length === 0 ? (
                      <p className="text-sm text-destructive">
                        No trade test centre is mapped for {row.state || 'your state'} yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Label>Available centre{centers.length > 1 ? 's' : ''} for your state</Label>
                        <RadioGroup
                          value={selectedTradeCenterId}
                          onValueChange={setSelectedTradeCenterId}
                          disabled={saving || (centerConfirmed && Boolean(row.trade_test_result_url))}
                          className="space-y-2"
                        >
                          {centers.map((c) => (
                            <label
                              key={c.id}
                              className={cn(
                                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer',
                                selectedTradeCenterId === c.id && 'border-primary bg-primary/5',
                              )}
                            >
                              <RadioGroupItem value={c.id} id={`tt-center-${c.id}`} className="mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.city}, {c.state}</p>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {centerConfirmed ? (
                      <p className="text-sm text-success">
                        ✓ Centre confirmed: {row.trade_test_center_name}
                      </p>
                    ) : (
                      <Button
                        disabled={saving || !selectedTradeCenterId || centers.length === 0}
                        onClick={async () => {
                          if (!subjectId) return;
                          const center = centers.find((c) => c.id === selectedTradeCenterId);
                          if (!center) {
                            toast.error('Select a trade test centre');
                            return;
                          }
                          setSaving(true);
                          try {
                            const next = await bookTradeTestCenter(subjectId, {
                              centerId: center.id,
                              centerName: center.name,
                              reportingWindow: TRADE_TEST_REPORTING_WINDOW,
                            });
                            setRow({
                              ...next,
                              stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                            });
                            notifyVerificationUpdated();
                            toast.success(`Centre confirmed — report ${TRADE_TEST_REPORTING_WINDOW}`);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Could not confirm centre');
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                        Confirm trade test centre
                      </Button>
                    )}

                    <div className="space-y-1.5">
                      <Label>Trade test result (image or PDF)</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        disabled={saving || !centerConfirmed}
                        onChange={(e) => setTradeResultFile(e.target.files?.[0] || null)}
                      />
                      {tradeResultFile && (
                        <p className="text-xs text-success">✓ {tradeResultFile.name}</p>
                      )}
                    </div>
                    <Button
                      disabled={saving || !centerConfirmed || (!tradeResultFile && !row.trade_test_result_url)}
                      onClick={async () => {
                        if (!subjectId) return;
                        if (!tradeResultFile && !row.trade_test_result_url) {
                          toast.error('Upload your trade test result');
                          return;
                        }
                        setSaving(true);
                        try {
                          let url = row.trade_test_result_url || '';
                          if (tradeResultFile) {
                            const ext = tradeResultFile.name.split('.').pop() || 'pdf';
                            const path = `${subjectId}/trade-test/${Date.now()}.${ext}`;
                            const { error: upErr } = await supabase.storage
                              .from(DOCS_BUCKET)
                              .upload(path, tradeResultFile, { upsert: false });
                            if (upErr) throw new Error(upErr.message);
                            const { data: signed, error: urlErr } = await supabase.storage
                              .from(DOCS_BUCKET)
                              .createSignedUrl(path, 31536000);
                            if (urlErr || !signed?.signedUrl) {
                              throw new Error(urlErr?.message || 'Could not create file URL');
                            }
                            url = signed.signedUrl;
                          }
                          const next = await submitTradeTestResult(subjectId, url);
                          setRow({
                            ...next,
                            stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                          });
                          setTradeResultFile(null);
                          notifyVerificationUpdated();
                          toast.success('Trade test result uploaded — waiting for admin review');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Upload failed');
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      Submit trade test result
                    </Button>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
          );
        })()}

        {!viewingCompletedStep && stage === 'medical' && (() => {
          const bloodUrl = row.medical_blood_report_url || row.medical_result_url;
          const xrayReportUrl = row.medical_xray_report_url;
          const xrayPhotoUrl = row.medical_xray_photo_url;
          const canSubmit =
            (medicalBloodFile || bloodUrl) &&
            (medicalXrayReportFile || xrayReportUrl) &&
            (medicalXrayPhotoFile || xrayPhotoUrl);
          const waitingReview = medicalTestDocumentsComplete(row) && row.medical_status === 'scheduled';

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
                    Upload your blood report, X-ray report, and X-ray photo from any nearest laboratory.
                    {!tradeNeeded && (
                      <> Physical trade test is not required for{' '}
                        <span className="font-medium text-foreground">{row.primary_skill}</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-foreground">{MEDICAL_TEST_SCREENING_NOTE}</p>
              </div>
              {waitingReview && (
                <p className="text-sm rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  All three medical documents are uploaded. SafeWork is reviewing them.
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
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {row.medical_instructions}
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-1">
                <MedicalFileField
                  label="Medical blood report"
                  hint="HIV blood test report from any nearest laboratory (image or PDF)."
                  accept="image/*,.pdf,application/pdf"
                  file={medicalBloodFile}
                  existingUrl={bloodUrl}
                  disabled={saving}
                  onChange={setMedicalBloodFile}
                />
                <MedicalFileField
                  label="X-ray report"
                  hint="TB chest X-ray report from any nearest laboratory (image or PDF)."
                  accept="image/*,.pdf,application/pdf"
                  file={medicalXrayReportFile}
                  existingUrl={xrayReportUrl}
                  disabled={saving}
                  onChange={setMedicalXrayReportFile}
                />
                <MedicalFileField
                  label="X-ray photo"
                  hint="Chest X-ray image for Tuberculosis (TB) screening."
                  accept="image/*"
                  file={medicalXrayPhotoFile}
                  existingUrl={xrayPhotoUrl}
                  disabled={saving}
                  onChange={setMedicalXrayPhotoFile}
                />
              </div>
              <Button
                disabled={saving || !canSubmit}
                onClick={async () => {
                  if (!subjectId) return;
                  if (!medicalBloodFile && !bloodUrl) {
                    toast.error('Upload your medical blood report');
                    return;
                  }
                  if (!medicalXrayReportFile && !xrayReportUrl) {
                    toast.error('Upload your X-ray report');
                    return;
                  }
                  if (!medicalXrayPhotoFile && !xrayPhotoUrl) {
                    toast.error('Upload your X-ray photo');
                    return;
                  }
                  setSaving(true);
                  try {
                    const nextBlood = medicalBloodFile
                      ? await uploadJourneyDoc(subjectId, medicalBloodFile, 'medical/blood-report')
                      : bloodUrl!;
                    const nextXrayReport = medicalXrayReportFile
                      ? await uploadJourneyDoc(subjectId, medicalXrayReportFile, 'medical/xray-report')
                      : xrayReportUrl!;
                    const nextXrayPhoto = medicalXrayPhotoFile
                      ? await uploadJourneyDoc(subjectId, medicalXrayPhotoFile, 'medical/xray-photo')
                      : xrayPhotoUrl!;
                    const next = await submitMedicalResult(subjectId, {
                      bloodReportUrl: nextBlood,
                      xrayReportUrl: nextXrayReport,
                      xrayPhotoUrl: nextXrayPhoto,
                    });
                    setRow(next);
                    setMedicalBloodFile(null);
                    setMedicalXrayReportFile(null);
                    setMedicalXrayPhotoFile(null);
                    notifyVerificationUpdated();
                    toast.success('Medical documents uploaded — waiting for admin review');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Upload failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Submit medical documents
              </Button>
            </CardContent>
          </Card>
          );
        })()}

        {!viewingCompletedStep && stage === 'bond' && subjectId && (
          <BondSecurityStage
            userId={subjectId}
            workerPhone={displayProfile?.phone}
            verification={row}
            template={bondTemplate}
            onChanged={() => {
              notifyVerificationUpdated();
              void load();
            }}
          />
        )}

        {!viewingCompletedStep && stage === 'pdot' && (
          <StageWaitingShell
            icon={GraduationCap}
            title="PDOT — Pre-departure orientation training"
            body={
              row.pdot_scheduled_at
                ? `Your PDOT training is scheduled for ${formatWhen(row.pdot_scheduled_at)}${row.pdot_provider ? ` with ${row.pdot_provider}` : ''}. Attend fully — SafeWork marks you GCC ready after completion.`
                : `SafeWork will confirm your PDOT training batch${row.pdot_provider ? ` with ${row.pdot_provider}` : ''}. Details appear here.`
            }
            expected={row.pdot_scheduled_at ? undefined : 'Batch usually confirmed within a few days'}
            notifyNote="We'll notify you by SMS once your PDOT batch and schedule are confirmed."
            timeline={[
              { label: 'Bond received by SafeWork', status: 'done' },
              {
                label: row.pdot_scheduled_at ? 'PDOT training scheduled' : 'Confirming your PDOT batch',
                detail: row.pdot_scheduled_at ? formatWhen(row.pdot_scheduled_at) : undefined,
                status: 'current',
              },
              { label: 'GCC ready', status: 'pending' },
            ]}
          >
            {row.pdot_training_url && (
              <Button asChild variant="outline">
                <a href={row.pdot_training_url} target="_blank" rel="noreferrer">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Open training
                </a>
              </Button>
            )}
          </StageWaitingShell>
        )}

        {!viewingCompletedStep && stage === 'deployment' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Deployment</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    SafeWork updates each step below as your travel paperwork clears.
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {DEPLOYMENT_CHECKLIST.map((item) => {
                  const value = String((row as any)[item.key] || 'pending');
                  const done = value === 'completed' || value === 'approved' || value === 'issued';
                  return (
                    <li
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2
                          className={cn('h-4 w-4', done ? 'text-success' : 'text-muted-foreground/40')}
                        />
                        {item.label}
                      </span>
                      <Badge variant={done ? 'default' : 'secondary'}>{value.replace(/_/g, ' ')}</Badge>
                    </li>
                  );
                })}
              </ul>
              {row.deployed_at && (
                <p className="text-sm rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  Deployed on {new Date(row.deployed_at).toLocaleDateString('en-IN')} — all the best!
                </p>
              )}
            </CardContent>
          </Card>
        )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <JourneySupportPanel stage={stage} />
          </aside>
        </div>
      </div>
      </>
      )}
    </JourneyShell>
  );
}
