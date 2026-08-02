import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WorkerPortalLayout from '@/components/layout/WorkerPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2, ArrowRight, CheckCircle2, Upload, Video, ImagePlus,
  Calendar, CreditCard, Stethoscope, FileSignature, Flag, RotateCcw, ShieldCheck, Wrench,
  GraduationCap, Plane, Download, Truck,
} from 'lucide-react';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';
import { indianStates } from '@/lib/validations/partner';
import { displayableEmail, isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import {
  ASSESSMENT_FEE_INR,
  EDUCATION_LEVELS,
  GCC_JOURNEY_NAV_STEPS,
  DEPLOYMENT_CHECKLIST,
  VERIFICATION_STAGE_LABELS,
  isJourneyResetEnabled,
  navStepForStage,
  navStepIndex,
  normalizeVerificationStage,
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
  resetVerificationJourney,
  saveEssentials,
  submitBond,
  submitBondTracking,
  submitMedicalResult,
  submitQuiz,
  bookTradeTestCenter,
  payAssessmentFeeWithRazorpay,
  submitTradeTestResult,
  waiveAssessmentInterviewPilot,
  waiveAssessmentPaymentPilot,
} from '@/modules/worker-verification/services/verificationService';
import {
  TRADE_TEST_REPORTING_WINDOW,
  TRADE_TEST_REPORTING_WINDOW_HINT,
  getTradeTestCentersForState,
} from '@/data/tradeTestCenters';
import { getWorkerActiveAssessment } from '@/modules/trade-test/services/assessmentService';
import type { AssessmentRow } from '@/modules/trade-test/types';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
const PHOTO_TARGET_MIN = 8;
const PHOTO_TARGET_MAX = 10;
const VIDEO_TARGET_MIN = 4;
const VIDEO_TARGET_MAX = 5;

function notifyVerificationUpdated() {
  window.dispatchEvent(new Event('swg-verification-updated'));
}

/**
 * Full worker verification wizard:
 * essentials → quiz → media → interview → payment → tests → bond → GCC ready
 */
export default function WorkerVerificationPage() {
  const { user, profile, refreshProfile } = useAuth();
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

  const [quizItems, setQuizItems] = useState<SkillQuizItem[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, boolean | undefined>>({});
  const [quizIndex, setQuizIndex] = useState(0);

  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<'photo' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [bondMethod, setBondMethod] = useState<'estamp' | 'emitra' | 'physical_upload'>('estamp');
  const [bondStampFile, setBondStampFile] = useState<File | null>(null);
  const [bondVideoFile, setBondVideoFile] = useState<File | null>(null);
  const [resetting, setResetting] = useState(false);
  const showDevReset = isJourneyResetEnabled();

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOnFile, setAadhaarOnFile] = useState('');
  const [bondTracking, setBondTracking] = useState('');
  const [bondTemplate, setBondTemplate] = useState<BondTemplate | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [kycConsent, setKycConsent] = useState(false);
  const [forceIdentity, setForceIdentity] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  const [kycUploading, setKycUploading] = useState(false);
  const [tradeResultFile, setTradeResultFile] = useState<File | null>(null);
  const [selectedTradeCenterId, setSelectedTradeCenterId] = useState('');
  const [tradeAssessment, setTradeAssessment] = useState<AssessmentRow | null>(null);
  const [medicalResultFile, setMedicalResultFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const vRaw = await getOrCreateVerification(user.id);
      const v: WorkerVerification = {
        ...vRaw,
        stage: normalizeVerificationStage(vRaw.stage, vRaw.trade_test_required),
      };
      setRow(v);
      // Never prefill synthetic mobile-auth emails — worker types a real contact email
      setEmail(displayableEmail(v.email) || displayableEmail(profile?.email) || '');
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
        const assessment = await getWorkerActiveAssessment(user.id);
        setTradeAssessment(assessment);
      } catch {
        setTradeAssessment(null);
      }

      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('kyc_status, pan_number, aadhaar_last4, passport_number')
        .eq('user_id', user.id)
        .maybeSingle();
      const kycStatus = String((wp as any)?.kyc_status || 'not_started');
      const kycOk = kycStatus === 'submitted' || kycStatus === 'verified';
      setKycDone(kycOk);
      if ((wp as any)?.pan_number) setPanNumber(String((wp as any).pan_number));
      if ((wp as any)?.aadhaar_last4) setAadhaarOnFile(String((wp as any).aadhaar_last4));
      if ((wp as any)?.passport_number) setPassportNumber(String((wp as any).passport_number));
      if (v.bond_courier_tracking) setBondTracking(String(v.bond_courier_tracking));
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
        v.stage !== 'quiz' &&
        v.stage !== 'media';
      setForceIdentity(!kycOk && pastMedia && v.stage !== 'identity');

      if (v.primary_skill && (v.stage === 'quiz' || !v.quiz_completed_at)) {
        const items = await loadQuizItems(v.primary_skill, v.state);
        setQuizItems(items);
      }

      if (v.primary_skill) {
        const { data: skill } = await supabase
          .from('worker_skills')
          .select('id')
          .eq('worker_id', user.id)
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
      const msg = e instanceof Error ? e.message : 'Failed to load verification';
      setLoadError(msg);
      setRow(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user, profile?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const rawStage: VerificationStage = row
    ? normalizeVerificationStage(row.stage, row.trade_test_required)
    : 'essentials';
  // If KYC is done but stage stuck on identity (constraint lag), treat as interview.
  const effectiveRaw: VerificationStage =
    kycDone && rawStage === 'identity' ? 'awaiting_interview' : rawStage;
  const stage: VerificationStage = forceIdentity ? 'identity' : effectiveRaw;
  const tradeNeeded = row?.trade_test_required ?? skillRequiresTradeTest(row?.primary_skill);
  const navId = navStepForStage(stage);
  const progress = ((navStepIndex(navId) + 1) / GCC_JOURNEY_NAV_STEPS.length) * 100;

  const journeyParam = searchParams.get('journey') as GccNavStepId | null;
  const validJourneyIds = GCC_JOURNEY_NAV_STEPS.map((s) => s.id);
  const viewingJourney =
    journeyParam && validJourneyIds.includes(journeyParam) ? journeyParam : null;
  const viewingCompletedStep =
    !!viewingJourney &&
    viewingJourney !== navId &&
    navStepIndex(viewingJourney) < navStepIndex(navId);
  const viewingStepMeta = viewingCompletedStep
    ? GCC_JOURNEY_NAV_STEPS.find((s) => s.id === viewingJourney)
    : null;

  const clearJourneyQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('journey');
    setSearchParams(next, { replace: true });
  };

  const currentQuiz = quizItems[quizIndex];

  const onSubmitIdentity = async () => {
    if (!user?.id) return;
    const pan = panNumber.trim().toUpperCase();
    const passport = passportNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      toast.error('Enter a valid PAN (e.g. ABCDE1234F)');
      return;
    }
    const aadhaar = aadhaarNumber.replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaar)) {
      toast.error('Enter your full 12-digit Aadhaar number');
      return;
    }
    if (!/^[A-Z0-9]{6,9}$/.test(passport)) {
      toast.error('Enter a valid passport number');
      return;
    }
    if (!panFile || !aadhaarFile || !passportFile) {
      toast.error('Upload PAN, Aadhaar, and Passport photos');
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
        .eq('user_id', user.id)
        .maybeSingle();
      if (!wpRow) {
        const { error: ensureErr } = await supabase
          .from('worker_profiles')
          .insert({ user_id: user.id } as any);
        if (ensureErr) throw new Error(ensureErr.message);
      }

      const uploadDoc = async (file: File, docType: string, name: string) => {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/kyc/${docType}-${Date.now()}.${ext}`;
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
        // Prefer typed doc; fall back to id_proof if DB CHECK not yet updated.
        const tryTypes =
          docType === 'pan' || docType === 'aadhaar' || docType === 'passport'
            ? [docType, 'id_proof']
            : [docType];
        let lastErr: Error | null = null;
        for (const type of tryTypes) {
          const { error: dbErr } = await supabase.from('worker_documents').insert({
            worker_id: user.id,
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

      await uploadDoc(panFile, 'pan', 'PAN Card');
      await uploadDoc(aadhaarFile, 'aadhaar', 'Aadhaar Card');
      await uploadDoc(passportFile, 'passport', 'Passport');

      const next = await completeIdentityKyc(user.id, {
        panNumber: pan,
        aadhaarNumber: aadhaar,
        passportNumber: passport,
      });
      setRow(next);
      setForceIdentity(false);
      setPanFile(null);
      setAadhaarFile(null);
      setPassportFile(null);
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
    if (!user?.id) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || isWorkerMobileAuthEmail(trimmedEmail)) {
      toast.error('Enter a real email address before continuing');
      return;
    }
    if (!city.trim() || !state || !education || !primarySkill) {
      toast.error('Fill all essentials fields');
      return;
    }
    setSaving(true);
    try {
      const next = await saveEssentials(user.id, {
        email: trimmedEmail,
        city: city.trim(),
        state,
        education_level: education,
        primary_skill: primarySkill,
      });
      setRow(next);
      notifyVerificationUpdated();
      await refreshProfile();
      const items = await loadQuizItems(primarySkill);
      setQuizItems(items);
      setQuizIndex(0);
      setQuizAnswers({});
      toast.success('Essentials saved — start your skill check');
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
    if (!user?.id || !currentQuiz) return;
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
        expected: item.expected_answer,
      }));
      const next = await submitQuiz(user.id, answers);
      setRow(next);
      notifyVerificationUpdated();
      toast.success(`Test 1 complete — score ${next.quiz_score}%. Next: upload your skill proof.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Quiz submit failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadMediaFiles = async (files: FileList | File[] | null, type: 'photo' | 'video') => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    if (!user?.id || !skillId) {
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
        const filePath = `${user.id}/skills/${skillId}/${folder}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from('worker_skill_media').insert({
          skill_id: skillId,
          worker_id: user.id,
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
    if (!user?.id) return;
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
      const next = await completeMediaStep(user.id);
      setRow(next);
      notifyVerificationUpdated();
      toast.success('Skill proof saved — next: Identity (KYC)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not continue');
    } finally {
      setSaving(false);
    }
  };

  const onDevResetJourney = async () => {
    if (!user?.id || !showDevReset) return;
    if (!window.confirm('DEV ONLY: Reset GCC journey to Essentials and clear quiz/payment/bond progress?')) {
      return;
    }
    setResetting(true);
    try {
      const next = await resetVerificationJourney(user.id);
      setRow(next);
      setEmail('');
      setCity('');
      setState('');
      setEducation('');
      setPrimarySkill('');
      setQuizItems([]);
      setQuizAnswers({});
      setQuizIndex(0);
      setPhotoCount(0);
      setVideoCount(0);
      setSkillId(null);
      notifyVerificationUpdated();
      toast.success('Journey reset to Essentials (dev)');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <WorkerPortalLayout>
        <div className="py-16 text-center text-muted-foreground">Loading your journey…</div>
      </WorkerPortalLayout>
    );
  }

  if (loadError || !row) {
    return (
      <WorkerPortalLayout>
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
      </WorkerPortalLayout>
    );
  }

  if (rawStage === 'gcc_ready' && !forceIdentity) {
    return (
      <WorkerPortalLayout>
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Flag className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold font-heading">Profile complete</h1>
            <p className="text-sm text-muted-foreground">
              Your profile is ready for employers. Browse jobs and apply with priority visibility.
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/jobs">Go to Job Search</Link>
            </Button>
            {showDevReset && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-amber-500/50 text-amber-700"
                disabled={resetting}
                onClick={() => void onDevResetJourney()}
              >
                {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Dev: reset journey
              </Button>
            )}
          </CardContent>
        </Card>
      </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {showDevReset && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2">
            <p className="text-[11px] text-amber-800 dark:text-amber-200">
              Dev / preview only — not shown on safeworkglobal.com
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 shrink-0 border-amber-500/40 text-amber-800"
              disabled={resetting}
              onClick={() => void onDevResetJourney()}
            >
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
              Reset journey
            </Button>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Step {navStepIndex(navId) + 1} of {GCC_JOURNEY_NAV_STEPS.length} — {VERIFICATION_STAGE_LABELS[stage]}
          </p>
          <h1 className="text-2xl font-bold font-heading">Create profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your profile as best as possible so employers can select you on priority.
          </p>
          <Progress value={progress} className="h-2 mt-3" />
          <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Journey progress">
            {GCC_JOURNEY_NAV_STEPS.map((s) => {
              const done = navStepIndex(s.id) < navStepIndex(navId);
              const current = s.id === navId;
              const locked = navStepIndex(s.id) > navStepIndex(navId);
              return (
                <Badge
                  key={s.id}
                  variant={current ? 'default' : done ? 'secondary' : 'outline'}
                  className={cn(
                    'text-[10px]',
                    locked && 'opacity-40 cursor-not-allowed',
                  )}
                  title={locked ? 'Complete the previous step first' : s.label}
                >
                  {s.shortLabel}
                </Badge>
              );
            })}
          </div>
        </div>

        {viewingCompletedStep && viewingStepMeta && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{viewingStepMeta.label}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    This step is done. Continue with your current step: {VERIFICATION_STAGE_LABELS[stage]}.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={clearJourneyQuery}>
                Back to current step
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'essentials' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Major details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Name and mobile are already saved. Add your email, location, education, and one primary skill.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={profile?.full_name || ''} disabled className="bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile</Label>
                  <Input value={profile?.phone || ''} disabled className="bg-muted/40" />
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
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((e) => (
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
              <Button className="w-full sm:w-auto" onClick={() => void onSaveEssentials()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Continue to Test 1 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'quiz' && currentQuiz && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Test 1 — Do you know this type of work?</span>
                <span>{quizIndex + 1} / {quizItems.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Watch / view the example for{' '}
                <span className="font-medium text-foreground">{row.primary_skill || 'your skill'}</span>
                , then answer Yes or No. You upload your own photos and videos in the next step.
              </p>

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
              <Button onClick={() => void onQuizContinue()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {quizIndex < quizItems.length - 1 ? 'Next example' : 'Finish Test 1'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'media' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Skill proof upload</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Profile completion after Test 1 — upload photos and short videos of your work as{' '}
                  <span className="font-medium text-foreground">{row.primary_skill}</span>
                  {' '}before Test 2 (video interview).
                </p>
                <p className="text-sm text-foreground mt-2 leading-snug" lang="hi">
                  अपने काम करते हुए <span className="font-medium">8 से 10 photos</span> और{' '}
                  <span className="font-medium">4–5 videos</span> डालिए, जिनमें आप साफ दिखें — काम करते हुए।
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tip: select multiple files at once. You should be clearly visible while working.
                </p>
              </div>

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
              <Button onClick={() => void onCompleteMedia()} disabled={saving || !!uploadingKind}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save & continue to Identity
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'identity' && kycDone && (
          <WaitingCard
            icon={ShieldCheck}
            title="Identity under review"
            body="Your PAN, Aadhaar and passport documents are submitted. SafeWork is verifying them — your video interview is scheduled right after approval."
          />
        )}

        {!viewingCompletedStep && stage === 'identity' && !kycDone && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Identity (KYC)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                     Required before applying to jobs. Enter PAN, your full Aadhaar number, and Passport number, and upload a photo of each. SafeWork verifies these before your video interview is scheduled.
                  </p>
                </div>
              </div>

              {kycUploading && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  Uploading identity documents… Please wait.
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-3">
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
                <div className="space-y-1.5">
                  <Label>Passport Number *</Label>
                  <Input
                    value={passportNumber}
                    onChange={(e) =>
                      setPassportNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))
                    }
                    placeholder="A1234567"
                    maxLength={9}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>PAN Card Photo *</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={saving}
                    onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                  />
                  {panFile && <p className="text-xs text-success">✓ {panFile.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Aadhaar Card Photo *</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={saving}
                    onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                  />
                  {aadhaarFile && <p className="text-xs text-success">✓ {aadhaarFile.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Passport Photo *</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={saving}
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                  />
                  {passportFile && <p className="text-xs text-success">✓ {passportFile.name}</p>}
                </div>
              </div>
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
              <Button onClick={() => void onSubmitIdentity()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit identity & continue
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'awaiting_interview' && (
          <WaitingCard
            icon={Calendar}
            title="Test 2 — Video interview"
            body={
              row.interview_scheduled_at
                ? `Your video interview is scheduled for ${new Date(row.interview_scheduled_at).toLocaleString('en-IN')}. Join on time from a quiet place with good network.`
                : row.interview_status === 'rejected'
                  ? 'Your last interview was not approved. SafeWork will reschedule a new interview — you will see the new date here.'
                  : 'SafeWork will schedule your video interview and assign an interviewer. The date, time and joining link appear here.'
            }
          >
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
                if (!user?.id) return;
                setSaving(true);
                try {
                  const next = await waiveAssessmentInterviewPilot(user.id);
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
          </WaitingCard>
        )}

        {!viewingCompletedStep && stage === 'awaiting_payment' && (
          <WaitingCard
            icon={CreditCard}
            title="Payment"
            body={`Assessment fee: ₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')}. Pay securely with Razorpay (UPI, card, or netbanking). After payment succeeds you continue to the next GCC step.`}
          >
            <Button
              disabled={saving}
              onClick={async () => {
                if (!user?.id) return;
                setSaving(true);
                try {
                  const next = await payAssessmentFeeWithRazorpay({
                    name: profile?.full_name,
                    email: displayableEmail(row?.email) || displayableEmail(profile?.email),
                    contact: profile?.phone,
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
              Pay ₹{ASSESSMENT_FEE_INR.toLocaleString('en-IN')} with Razorpay
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={saving}
              onClick={async () => {
                if (!user?.id) return;
                setSaving(true);
                try {
                  const next = await waiveAssessmentPaymentPilot(user.id);
                  setRow({
                    ...next,
                    stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                  });
                  notifyVerificationUpdated();
                  toast.success('Fee waived for pilot');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Could not continue');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Continue without payment (pilot)
            </Button>
          </WaitingCard>
        )}

        {!viewingCompletedStep && (stage === 'trade_test' || (stage === 'tests' && tradeNeeded)) && (() => {
          const centers = getTradeTestCentersForState(row.state);
          const centerConfirmed = Boolean(row.trade_test_center_id);
          const hasPartnerAssignment =
            Boolean(tradeAssessment) && tradeAssessment?.status !== 'centre_rejected';
          const showLegacyPilot = !hasPartnerAssignment;
          return (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
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
                  {(tradeAssessment.appointment_date || tradeAssessment.scheduled_at) && (
                    <p className="text-sm text-muted-foreground">
                      Appointment:{' '}
                      {tradeAssessment.appointment_date ||
                        (tradeAssessment.scheduled_at
                          ? new Date(tradeAssessment.scheduled_at).toLocaleDateString()
                          : '')}
                    </p>
                  )}
                  <p className="text-sm text-foreground">{tradeTestAssignmentLabel(tradeAssessment)}</p>
                  <p className="text-xs text-muted-foreground">
                    Centre names are location-based. Partner company names are not shown here.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 space-y-2">
                  <p className="text-sm font-medium">Waiting for SafeWork allocation</p>
                  <p className="text-xs text-muted-foreground">
                    An admin will assign you to a centre near{' '}
                    {row.state || 'your state'}. You will see the location, appointment date, and
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
                          if (!user?.id) return;
                          const center = centers.find((c) => c.id === selectedTradeCenterId);
                          if (!center) {
                            toast.error('Select a trade test centre');
                            return;
                          }
                          setSaving(true);
                          try {
                            const next = await bookTradeTestCenter(user.id, {
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
                        if (!user?.id) return;
                        if (!tradeResultFile && !row.trade_test_result_url) {
                          toast.error('Upload your trade test result');
                          return;
                        }
                        setSaving(true);
                        try {
                          let url = row.trade_test_result_url || '';
                          if (tradeResultFile) {
                            const ext = tradeResultFile.name.split('.').pop() || 'pdf';
                            const path = `${user.id}/trade-test/${Date.now()}.${ext}`;
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
                          const next = await submitTradeTestResult(user.id, url);
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

        {!viewingCompletedStep && stage === 'medical' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Medical</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload your medical fitness report (image or PDF) from an approved centre.
                    {!tradeNeeded && (
                      <> Physical trade test is not required for{' '}
                        <span className="font-medium text-foreground">{row.primary_skill}</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Medical result (image or PDF) *</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  disabled={saving}
                  onChange={(e) => setMedicalResultFile(e.target.files?.[0] || null)}
                />
                {medicalResultFile && (
                  <p className="text-xs text-success">✓ {medicalResultFile.name}</p>
                )}
                {row.medical_result_url && !medicalResultFile && (
                  <p className="text-xs text-muted-foreground">A medical result was already uploaded.</p>
                )}
              </div>
              <Button
                disabled={saving || (!medicalResultFile && !row.medical_result_url)}
                onClick={async () => {
                  if (!user?.id) return;
                  if (!medicalResultFile && !row.medical_result_url) {
                    toast.error('Upload your medical result');
                    return;
                  }
                  setSaving(true);
                  try {
                    let url = row.medical_result_url || '';
                    if (medicalResultFile) {
                      const ext = medicalResultFile.name.split('.').pop() || 'pdf';
                      const path = `${user.id}/medical/${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from(DOCS_BUCKET)
                        .upload(path, medicalResultFile, { upsert: false });
                      if (upErr) throw new Error(upErr.message);
                      const { data: signed, error: urlErr } = await supabase.storage
                        .from(DOCS_BUCKET)
                        .createSignedUrl(path, 31536000);
                      if (urlErr || !signed?.signedUrl) {
                        throw new Error(urlErr?.message || 'Could not create file URL');
                      }
                      url = signed.signedUrl;
                    }
                    const next = await submitMedicalResult(user.id, url);
                    setRow(next);
                    setMedicalResultFile(null);
                    notifyVerificationUpdated();
                    toast.success('Medical result uploaded — waiting for admin review');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Upload failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Submit medical result
              </Button>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'bond' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Candidate bond</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Download the bond, print it, sign it, and courier the original to SafeWork. Then enter your courier tracking number below.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                {bondTemplate ? (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <a href={bondTemplate.file_url} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download bond ({bondTemplate.version})
                      </a>
                    </Button>
                    <div className="text-xs text-muted-foreground whitespace-pre-line">
                      <p className="font-medium text-foreground">Courier the signed original to:</p>
                      {bondTemplate.courier_address}
                      {bondTemplate.instructions ? `\n\n${bondTemplate.instructions}` : ''}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    SafeWork is preparing your bond document — it will appear here for download shortly.
                  </p>
                )}
              </div>

              {row.bond_received_at ? (
                <p className="text-sm rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  Bond original received by SafeWork. Next: PDOT training.
                </p>
              ) : row.bond_courier_tracking ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                  Tracking submitted ({row.bond_courier_tracking}) — SafeWork will confirm once the original arrives.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label>Courier tracking number *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={bondTracking}
                      onChange={(e) => setBondTracking(e.target.value.toUpperCase().slice(0, 40))}
                      placeholder="e.g. AWB123456789"
                      disabled={saving}
                    />
                    <Button
                      disabled={saving || bondTracking.trim().length < 5}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await submitBondTracking(bondTracking.trim());
                          notifyVerificationUpdated();
                          toast.success('Tracking number submitted');
                          await load();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Could not submit tracking');
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Truck className="h-4 w-4 mr-1" />}
                      Submit tracking
                    </Button>
                  </div>
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Optional — upload a scan of the signed bond
                </summary>
                <div className="pt-3 space-y-3">
              <RadioGroup
                value={bondMethod}
                onValueChange={(v) => setBondMethod(v as typeof bondMethod)}
                className="space-y-2"
              >
                {(
                  [
                    { id: 'estamp', label: 'eStamp online' },
                    { id: 'emitra', label: 'Nearest E-Mitra partner' },
                    { id: 'physical_upload', label: 'Upload signed stamp paper' },
                  ] as const
                ).map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
                      bondMethod === m.id ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                  >
                    <RadioGroupItem value={m.id} />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {row.bond_status === 'submitted' ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                  Bond submitted — SafeWork will review and mark you GCC ready.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Stamp paper / agreement PDF or photo *</Label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setBondStampFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Video recording proof *</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setBondVideoFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button
                    disabled={saving}
                    onClick={async () => {
                      if (!user?.id) return;
                      if (!bondStampFile || !bondVideoFile) {
                        toast.error('Upload stamp paper and video proof before submitting');
                        return;
                      }
                      setSaving(true);
                      try {
                        const stampPath = `${user.id}/bond/stamp-${Date.now()}-${bondStampFile.name}`;
                        const videoPath = `${user.id}/bond/video-${Date.now()}-${bondVideoFile.name}`;
                        const { error: stampErr } = await supabase.storage
                          .from(DOCS_BUCKET)
                          .upload(stampPath, bondStampFile, { upsert: true });
                        if (stampErr) throw stampErr;
                        const { error: videoErr } = await supabase.storage
                          .from(STORAGE_BUCKET)
                          .upload(videoPath, bondVideoFile, { upsert: true });
                        if (videoErr) throw videoErr;
                        const { data: stampPub } = supabase.storage.from(DOCS_BUCKET).getPublicUrl(stampPath);
                        const { data: videoPub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(videoPath);
                        const next = await submitBond(
                          user.id,
                          bondMethod,
                          stampPub.publicUrl,
                          videoPub.publicUrl,
                        );
                        setRow(next);
                        setBondStampFile(null);
                        setBondVideoFile(null);
                        notifyVerificationUpdated();
                        toast.success('Bond submitted — waiting for admin approval');
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    Submit bond for review
                  </Button>
                </div>
              )}
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {!viewingCompletedStep && stage === 'pdot' && (
          <WaitingCard
            icon={GraduationCap}
            title="PDOT — Pre-departure orientation training"
            body={
              row.pdot_scheduled_at
                ? `Your PDOT training is scheduled for ${new Date(row.pdot_scheduled_at).toLocaleString('en-IN')}${row.pdot_provider ? ` with ${row.pdot_provider}` : ''}. Attend fully — SafeWork marks you GCC ready after completion.`
                : `SafeWork will confirm your PDOT training batch${row.pdot_provider ? ` with ${row.pdot_provider}` : ''}. Details appear here.`
            }
          >
            {row.pdot_training_url && (
              <Button asChild variant="outline">
                <a href={row.pdot_training_url} target="_blank" rel="noreferrer">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Open training
                </a>
              </Button>
            )}
          </WaitingCard>
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
    </WorkerPortalLayout>
  );
}

function WaitingCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
