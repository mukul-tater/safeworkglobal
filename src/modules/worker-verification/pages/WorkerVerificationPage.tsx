import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Calendar, CreditCard, Stethoscope, FileSignature, Flag,
} from 'lucide-react';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';
import { indianStates } from '@/lib/validations/partner';
import {
  ASSESSMENT_FEE_INR,
  EDUCATION_LEVELS,
  GCC_JOURNEY_NAV_STEPS,
  INTERVIEW_TRADE_TEST_THRESHOLD,
  VERIFICATION_STAGE_LABELS,
  navStepForStage,
  navStepIndex,
  type VerificationStage,
} from '@/modules/worker-verification/constants';
import type { SkillQuizItem, WorkerVerification } from '@/modules/worker-verification/types';
import {
  completeMediaStep,
  getOrCreateVerification,
  loadQuizItems,
  markPaymentPaid,
  markTestsPassed,
  recordInterviewScore,
  saveEssentials,
  submitBond,
  submitQuiz,
} from '@/modules/worker-verification/services/verificationService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const STORAGE_BUCKET = 'worker-videos';

/**
 * Full worker verification wizard:
 * essentials → quiz → media → interview → payment → tests → bond → GCC ready
 */
export default function WorkerVerificationPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
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
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [demoScore, setDemoScore] = useState('75');
  const [bondMethod, setBondMethod] = useState<'estamp' | 'emitra' | 'physical_upload'>('estamp');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const v = await getOrCreateVerification(user.id);
      setRow(v);
      setEmail(v.email || profile?.email || '');
      setCity(v.city || '');
      setState(v.state || '');
      setEducation(v.education_level || '');
      setPrimarySkill(v.primary_skill || '');

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
  }, [user?.id, profile?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const stage: VerificationStage = row?.stage || 'essentials';
  const navId = navStepForStage(stage);
  const progress = ((navStepIndex(navId) + 1) / GCC_JOURNEY_NAV_STEPS.length) * 100;

  const currentQuiz = quizItems[quizIndex];

  const onSaveEssentials = async () => {
    if (!user?.id) return;
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    if (!city.trim() || !state || !education || !primarySkill) {
      toast.error('Fill all essentials fields');
      return;
    }
    setSaving(true);
    try {
      const next = await saveEssentials(user.id, {
        email: email.trim(),
        city: city.trim(),
        state,
        education_level: education,
        primary_skill: primarySkill,
      });
      setRow(next);
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
      toast.success(`Skill check complete — score ${next.quiz_score}%`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Quiz submit failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = async (file: File | null, type: 'photo' | 'video') => {
    if (!file || !user?.id || !skillId) {
      toast.error('Primary skill not ready — go back to essentials');
      return;
    }
    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB');
      return;
    }
    if (type === 'photo' && file.size > 10 * 1024 * 1024) {
      toast.error('Photo must be under 10MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
      const folder = type === 'photo' ? 'photos' : 'videos';
      const filePath = `${user.id}/skills/${skillId}/${folder}/${Date.now()}.${ext}`;
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
      if (type === 'photo') setPhotoCount((c) => c + 1);
      else setVideoCount((c) => c + 1);
      toast.success(type === 'photo' ? 'Photo uploaded' : 'Video uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onCompleteMedia = async () => {
    if (!user?.id) return;
    if (photoCount < 1 || videoCount < 1) {
      toast.error('Upload at least 1 photo and 1 video of your primary skill');
      return;
    }
    setSaving(true);
    try {
      const next = await completeMediaStep(user.id);
      setRow(next);
      toast.success('Test 1 complete — video interview is next');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not continue');
    } finally {
      setSaving(false);
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

  if (stage === 'gcc_ready') {
    return (
      <WorkerPortalLayout>
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Flag className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold font-heading">You are GCC Ready</h1>
            <p className="text-sm text-muted-foreground">
              Verification and bond are complete. Browse jobs and apply when your profile documents are ready.
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/jobs">Go to Job Search</Link>
            </Button>
          </CardContent>
        </Card>
      </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Step {navStepIndex(navId) + 1} of {GCC_JOURNEY_NAV_STEPS.length} — {VERIFICATION_STAGE_LABELS[stage]}
          </p>
          <h1 className="text-2xl font-bold font-heading">Become GCC Ready</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Profile ~{Math.min(40, 15 + navStepIndex(navId) * 5)}% so far — documents can wait until later.
          </p>
          <Progress value={progress} className="h-2 mt-3" />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {GCC_JOURNEY_NAV_STEPS.map((s) => (
              <Badge
                key={s.id}
                variant={
                  s.id === navId
                    ? 'default'
                    : navStepIndex(s.id) < navStepIndex(navId)
                      ? 'secondary'
                      : 'outline'
                }
                className="text-[10px]"
              >
                {s.shortLabel}
              </Badge>
            ))}
          </div>
        </div>

        {stage === 'essentials' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Major details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Name and mobile are already saved. Add email, location, education, and one primary skill.
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
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                <span>Test 1 — Skill quiz (Yes / No)</span>
                <span>{quizIndex + 1} / {quizItems.length}</span>
              </div>
              <h2 className="text-lg font-semibold font-heading leading-snug">{currentQuiz.question}</h2>
              {currentQuiz.youtube_url && (
                <a
                  href={currentQuiz.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Video className="h-4 w-4" /> Watch related short (optional)
                </a>
              )}
              {currentQuiz.image_url && (
                <img src={currentQuiz.image_url} alt="" className="rounded-lg max-h-48 object-cover" />
              )}
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
                {quizIndex < quizItems.length - 1 ? 'Next question' : 'Continue to skill media'}
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'media' && (
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Test 1 — Skill media</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Same test as the quiz — upload at least one photo and one short video of your work as{' '}
                  <span className="font-medium text-foreground">{row.primary_skill}</span>.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="border border-dashed rounded-xl p-5 text-center">
                  <ImagePlus className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Photos ({photoCount})</p>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void uploadMedia(e.target.files?.[0] || null, 'photo')}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploading}
                    onClick={() => photoRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload photo
                  </Button>
                </div>
                <div className="border border-dashed rounded-xl p-5 text-center">
                  <Video className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Videos ({videoCount})</p>
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => void uploadMedia(e.target.files?.[0] || null, 'video')}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploading}
                    onClick={() => videoRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload video
                  </Button>
                </div>
              </div>
              <Button onClick={() => void onCompleteMedia()} disabled={saving || uploading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit & continue
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'awaiting_interview' && (
          <WaitingCard
            icon={Calendar}
            title="Test 2 — Video interview"
            body={`Our team will schedule a video call and ask trade questions. Score ${INTERVIEW_TRADE_TEST_THRESHOLD}+ skips Test 3 (physical trade test).`}
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
                    toast.success(
                      next.trade_test_required
                        ? 'Below threshold — physical trade test required after payment'
                        : 'Above threshold — physical trade test not required',
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
            title="Assessment payment"
            body={`Pay ₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')} to continue${row.trade_test_required ? ' to Test 3 (physical trade test)' : ' to medical clearance and bond'}.`}
          >
            <Button
              disabled={saving}
              onClick={async () => {
                if (!user?.id) return;
                setSaving(true);
                try {
                  const next = await markPaymentPaid(user.id, ASSESSMENT_FEE_INR);
                  setRow(next);
                  toast.success('Payment recorded');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Payment failed');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Mark paid (demo) & continue
            </Button>
          </WaitingCard>
        )}

        {stage === 'tests' && (
          <WaitingCard
            icon={Stethoscope}
            title="Test 3 — Physical trade test"
            body={
              row.trade_test_required
                ? 'Complete your physical trade test at an approved centre / E-Mitra partner (medical fitness is checked as part of this step).'
                : 'Physical trade test is not required for your interview score. Confirm medical fitness, then continue to bond.'
            }
          >
            <Button
              disabled={saving}
              onClick={async () => {
                if (!user?.id) return;
                setSaving(true);
                try {
                  const next = await markTestsPassed(user.id);
                  setRow(next);
                  toast.success('Test 3 complete — continue to bond');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Mark Test 3 passed (demo)
            </Button>
          </WaitingCard>
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
