import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';
import { indianStates } from '@/lib/validations/partner';
import { displayableEmail, isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import {
  clearPendingGmailLink,
  getGoogleEmailFromUser,
  hasPendingGmailLink,
  isGoogleIdentityLinked,
  startGoogleEmailLink,
  syncLinkedGoogleEmail,
} from '@/modules/worker-verification/lib/connectGoogleEmail';
import {
  ASSESSMENT_FEE_INR,
  EDUCATION_LEVELS,
  GCC_JOURNEY_NAV_STEPS,
  VERIFICATION_STAGE_LABELS,
  isJourneyResetEnabled,
  navStepForStage,
  navStepIndex,
  normalizeVerificationStage,
  skillRequiresTradeTest,
  youtubeEmbedUrl,
  type VerificationStage,
} from '@/modules/worker-verification/constants';
import type { SkillQuizItem, WorkerVerification } from '@/modules/worker-verification/types';
import {
  completeMediaStep,
  completeIdentityKyc,
  getOrCreateVerification,
  loadQuizItems,
  markPaymentPaid,
  recordInterviewScore,
  resetVerificationJourney,
  saveEssentials,
  submitBond,
  submitMedicalResult,
  submitQuiz,
  submitTradeTestResult,
} from '@/modules/worker-verification/services/verificationService';
import {
  isRazorpayConfigured,
  openRazorpayCheckout,
} from '@/modules/worker-verification/lib/razorpayCheckout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [row, setRow] = useState<WorkerVerification | null>(null);

  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [education, setEducation] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const googleLinked = isGoogleIdentityLinked(user);
  const googleEmail = getGoogleEmailFromUser(user);
  const emailNeedsConnect = !email.trim() || isWorkerMobileAuthEmail(email);

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

  const [demoScore, setDemoScore] = useState('75');
  const [bondMethod, setBondMethod] = useState<'estamp' | 'emitra' | 'physical_upload'>('estamp');
  const [resetting, setResetting] = useState(false);
  const showDevReset = isJourneyResetEnabled();

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [kycConsent, setKycConsent] = useState(false);
  const [forceIdentity, setForceIdentity] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  const [tradeResultFile, setTradeResultFile] = useState<File | null>(null);
  const [medicalResultFile, setMedicalResultFile] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);

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
      const linked = getGoogleEmailFromUser(user);
      // Never prefill synthetic mobile-auth emails — only Connect Gmail / typed real email
      setEmail(linked || displayableEmail(v.email) || displayableEmail(profile?.email) || '');
      setCity(v.city || '');
      setState(v.state || '');
      setEducation(v.education_level || '');
      setPrimarySkill(v.primary_skill || '');

      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('kyc_status, pan_number, aadhaar_last4, passport_number')
        .eq('user_id', user.id)
        .maybeSingle();
      const kycStatus = String((wp as any)?.kyc_status || 'not_started');
      const kycOk = kycStatus === 'submitted' || kycStatus === 'verified';
      setKycDone(kycOk);
      if ((wp as any)?.pan_number) setPanNumber(String((wp as any).pan_number));
      if ((wp as any)?.aadhaar_last4) setAadhaarLast4(String((wp as any).aadhaar_last4));
      if ((wp as any)?.passport_number) setPassportNumber(String((wp as any).passport_number));

      // Mandatory for apply: if KYC missing and worker already passed skill proof, show Identity.
      const pastMedia =
        v.stage !== 'essentials' &&
        v.stage !== 'quiz' &&
        v.stage !== 'media';
      setForceIdentity(!kycOk && pastMedia && v.stage !== 'identity');

      if (v.primary_skill && (v.stage === 'quiz' || !v.quiz_completed_at)) {
        const items = await loadQuizItems(v.primary_skill);
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

  // After Google OAuth linkIdentity redirect, persist Gmail onto the worker profile.
  useEffect(() => {
    if (!user?.id) return;
    const fromQuery = searchParams.get('connect_email') === '1';
    const pending = hasPendingGmailLink();
    if (!fromQuery && !pending) return;

    let cancelled = false;
    (async () => {
      try {
        const synced = await syncLinkedGoogleEmail(user.id);
        if (cancelled) return;
        clearPendingGmailLink();
        if (synced) {
          setEmail(synced);
          await refreshProfile();
          toast.success(`Gmail connected: ${synced}`);
        } else {
          toast.error('Google connect finished, but no Gmail address was found. Try again.');
        }
      } catch (e) {
        if (!cancelled) {
          clearPendingGmailLink();
          toast.error(e instanceof Error ? e.message : 'Could not save Gmail');
        }
      } finally {
        if (fromQuery) {
          const next = new URLSearchParams(searchParams);
          next.delete('connect_email');
          setSearchParams(next, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on return from OAuth
  }, [user?.id]);

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

  const currentQuiz = quizItems[quizIndex];

  const onSubmitIdentity = async () => {
    if (!user?.id) return;
    const pan = panNumber.trim().toUpperCase();
    const passport = passportNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      toast.error('Enter a valid PAN (e.g. ABCDE1234F)');
      return;
    }
    if (!/^\d{4}$/.test(aadhaarLast4)) {
      toast.error('Enter last 4 digits of Aadhaar');
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
        aadhaarLast4,
        passportNumber: passport,
      });
      setRow(next);
      setForceIdentity(false);
      setPanFile(null);
      setAadhaarFile(null);
      setPassportFile(null);
      notifyVerificationUpdated();
      toast.success(
        next.stage === 'awaiting_interview'
          ? 'Identity submitted — Test 2 (video interview) is next'
          : 'Identity submitted — you can apply to jobs',
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'KYC submit failed');
    } finally {
      setKycUploading(false);
      setSaving(false);
    }
  };
  const onConnectGmail = async () => {
    if (!user?.id) return;
    setGoogleLinking(true);
    try {
      await startGoogleEmailLink(`${window.location.origin}/worker/journey?connect_email=1`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not connect Gmail');
      setGoogleLinking(false);
    }
  };

  const onSaveEssentials = async () => {
    if (!user?.id) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || isWorkerMobileAuthEmail(trimmedEmail)) {
      toast.error('Connect your Gmail (or enter a real email) before continuing');
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
      setDemoScore('75');
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

        {stage === 'essentials' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Major details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Name and mobile are already saved. Connect your Gmail, then add location, education, and one primary skill.
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
                  {(googleLinked || googleEmail || (!emailNeedsConnect && email)) ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="email"
                          value={email || googleEmail || ''}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1"
                        />
                        {googleLinked || googleEmail ? (
                          <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 text-xs font-medium text-success shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Gmail connected
                          </span>
                        ) : null}
                      </div>
                      {!googleLinked && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto h-10 gap-2"
                          onClick={() => void onConnectGmail()}
                          disabled={googleLinking}
                        >
                          {googleLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                          Connect Gmail instead
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 gap-2 font-medium"
                        onClick={() => void onConnectGmail()}
                        disabled={googleLinking}
                      >
                        {googleLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        Connect Gmail
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Signup used a temporary mobile login email. Connect Gmail so we can reach you for interviews and updates.
                      </p>
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                          <span className="bg-card px-2 text-muted-foreground">or type email</span>
                        </div>
                      </div>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
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

        {stage === 'quiz' && currentQuiz && (
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

        {stage === 'media' && (
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

        {stage === 'identity' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Identity (KYC)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required before applying to jobs. Enter PAN, Aadhaar (last 4), and Passport numbers, and upload a photo of each.
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
                  <Label>Aadhaar — Last 4 Digits *</Label>
                  <Input
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={saving}
                  />
                  <p className="text-[11px] text-muted-foreground">We never store your full Aadhaar</p>
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

        {stage === 'awaiting_interview' && (
          <WaitingCard
            icon={Calendar}
            title="Test 2 — Video interview"
            body={`Our team will schedule a video call and ask trade questions. Score is recorded for ops. Physical trade test depends on your skill (e.g. Electrician/Welder require Test 3; Driver/Helper skip to medical).`}
          >
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs">Demo: enter interview score (admin will do this live)</Label>
                <Input value={demoScore} onChange={(e) => setDemoScore(e.target.value)} type="number" min={0} max={100} />
              </div>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!user?.id) return;
                  setSaving(true);
                  try {
                    const next = await recordInterviewScore(user.id, Number(demoScore) || 0, 'Demo score');
                    setRow(next);
      notifyVerificationUpdated();
                    toast.success(
                      next.trade_test_required
                        ? `Trade test required for ${next.primary_skill || 'your skill'} after payment`
                        : `No trade test for ${next.primary_skill || 'your skill'} — medical after payment`,
                    );
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save score & continue
              </Button>
            </div>
          </WaitingCard>
        )}

        {stage === 'awaiting_payment' && (
          <WaitingCard
            icon={CreditCard}
            title="Payment"
            body={`Pay ₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')} to continue${
              tradeNeeded
                ? ' to Test 3 (physical trade test), then medical.'
                : ' to medical clearance (no physical trade test for your skill).'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                disabled={saving || paying}
                onClick={async () => {
                  if (!user?.id) return;
                  if (!isRazorpayConfigured()) {
                    toast.error('Add VITE_RAZORPAY_KEY_ID (rzp_test_…) to enable Razorpay');
                    return;
                  }
                  setPaying(true);
                  try {
                    const res = await openRazorpayCheckout({
                      amountInr: ASSESSMENT_FEE_INR,
                      description: 'SafeWork GCC verification fee',
                      name: profile?.full_name || undefined,
                      email: row.email || profile?.email || undefined,
                      contact: profile?.phone || undefined,
                    });
                    const next = await markPaymentPaid(user.id, ASSESSMENT_FEE_INR, {
                      provider: 'razorpay',
                      razorpayPaymentId: res.razorpay_payment_id,
                      razorpayOrderId: res.razorpay_order_id,
                    });
                    setRow({
                      ...next,
                      stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                    });
                    notifyVerificationUpdated();
                    toast.success('Payment successful');
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Payment failed';
                    if (msg !== 'Payment cancelled') toast.error(msg);
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
                Pay with Razorpay
              </Button>
              {isJourneyResetEnabled() && (
                <Button
                  variant="outline"
                  disabled={saving || paying}
                  onClick={async () => {
                    if (!user?.id) return;
                    setSaving(true);
                    try {
                      const next = await markPaymentPaid(user.id, ASSESSMENT_FEE_INR, {
                        provider: 'manual_demo',
                      });
                      setRow({
                        ...next,
                        stage: normalizeVerificationStage(next.stage, next.trade_test_required),
                      });
                      notifyVerificationUpdated();
                      toast.success('Demo payment recorded');
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Payment failed');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Mark paid (demo)
                </Button>
              )}
            </div>
            {!isRazorpayConfigured() && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Set <code className="text-xs">VITE_RAZORPAY_KEY_ID=rzp_test_…</code> for Checkout. Demo mark-paid is available on preview hosts.
              </p>
            )}
          </WaitingCard>
        )}

        {(stage === 'trade_test' || (stage === 'tests' && tradeNeeded)) && (
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
                    Complete the practical test at an approved centre, then upload your result (image or PDF).
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Trade test result (image or PDF) *</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  disabled={saving}
                  onChange={(e) => setTradeResultFile(e.target.files?.[0] || null)}
                />
                {tradeResultFile && (
                  <p className="text-xs text-success">✓ {tradeResultFile.name}</p>
                )}
                {row.trade_test_result_url && !tradeResultFile && (
                  <p className="text-xs text-muted-foreground">A result was already uploaded.</p>
                )}
              </div>
              <Button
                disabled={saving || (!tradeResultFile && !row.trade_test_result_url)}
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
                    setRow(next);
                    setTradeResultFile(null);
                    notifyVerificationUpdated();
                    toast.success('Trade test result saved — next: Medical');
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
            </CardContent>
          </Card>
        )}

        {stage === 'medical' && (
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
                    toast.success('Medical result saved — next: Bond');
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

        {stage === 'bond' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Candidate bond</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Stamp paper agreement with SafeWork + video recording proof. Choose eStamp online or nearest E-Mitra.
                  </p>
                </div>
              </div>
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
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!user?.id) return;
                  setSaving(true);
                  try {
                    const next = await submitBond(user.id, bondMethod);
                    setRow(next);
      notifyVerificationUpdated();
                    toast.success('Bond submitted — you are GCC ready');
                    navigate('/jobs');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Failed');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Submit bond & finish
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkerPortalLayout>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
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
