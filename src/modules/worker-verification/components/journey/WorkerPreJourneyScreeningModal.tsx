import { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Globe2,
  UserCheck,
  FileCheck2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Info,
  CreditCard,
  Fingerprint,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import HindiText from '@/components/indian-workforce/HindiText';
import {
  CANDIDATE_ACKNOWLEDGEMENT_ITEMS,
  ORIGINAL_DOCS_READY_NOTICE,
  PRE_JOURNEY_COPY,
  type EnHi,
  type MedicalFitnessDeclaration,
  type PreviousOverseasEmploymentDeclaration,
  type RecruitmentAgentExperienceDeclaration,
  type CandidateAcknowledgements,
  type WorkerPreJourneyDeclaration,
} from '@/modules/worker-verification/types/declarations.types';
import {
  INITIAL_MEDICAL,
  INITIAL_OVERSEAS,
  INITIAL_RECRUITMENT,
  INITIAL_ACKNOWLEDGEMENTS,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  saveWorkerDeclarations,
} from '@/modules/worker-verification/services/declarationService';

interface Props {
  userId: string;
  isOpen: boolean;
  onCompleted: (decl: WorkerPreJourneyDeclaration) => void;
  /** Render in the page (keeps the worker portal sidebar visible). */
  variant?: 'modal' | 'inline';
}

type Step = 0 | 1 | 2 | 3 | 4;

function EnHiLine({
  copy,
  enClassName,
  hiClassName,
}: {
  copy: EnHi;
  enClassName?: string;
  hiClassName?: string;
}) {
  return (
    <span className="block min-w-0 max-w-full">
      <span className={cn('block break-words font-semibold leading-snug text-foreground', enClassName)}>
        {copy.en}
      </span>
      <HindiText className={cn('mt-0.5 block break-words text-xs leading-snug text-muted-foreground', hiClassName)}>
        {copy.hi}
      </HindiText>
    </span>
  );
}

function ChoiceLabel({ copy }: { copy: EnHi }) {
  return (
    <span className="flex min-w-0 max-w-full flex-col items-center gap-0.5 text-center leading-tight">
      <span className="break-words">{copy.en}</span>
      <HindiText className="break-words text-[11px] font-medium opacity-80">{copy.hi}</HindiText>
    </span>
  );
}

const QUESTION_CARD =
  'min-w-0 space-y-3 overflow-hidden rounded-lg border border-border/60 bg-card p-3 sm:p-4';
const TWO_CHOICE_GRID = 'grid min-w-0 grid-cols-2 gap-2 sm:gap-3';
const THREE_CHOICE_GRID = 'grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3';
const CHOICE_BTN =
  'flex min-w-0 cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-sm font-medium break-words sm:p-3';
const SECTION_TITLE = 'flex min-w-0 items-start gap-2 break-words text-base font-semibold leading-snug text-foreground';

export default function WorkerPreJourneyScreeningModal({
  userId,
  isOpen,
  onCompleted,
  variant = 'modal',
}: Props) {
  const [step, setStep] = useState<Step>(0);
  const [medical, setMedical] = useState<MedicalFitnessDeclaration>(INITIAL_MEDICAL);
  const [overseas, setOverseas] = useState<PreviousOverseasEmploymentDeclaration>(INITIAL_OVERSEAS);
  const [recruitment, setRecruitment] = useState<RecruitmentAgentExperienceDeclaration>(INITIAL_RECRUITMENT);
  const [ack, setAck] = useState<CandidateAcknowledgements>(INITIAL_ACKNOWLEDGEMENTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrors({});
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      const res = validateStep1(medical);
      if (!res.isValid) {
        setErrors(res.errors);
        toast.error('Please complete all medical declarations.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const res = validateStep2(overseas);
      if (!res.isValid) {
        setErrors(res.errors);
        toast.error('Please complete all overseas employment declarations.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const res = validateStep3(recruitment);
      if (!res.isValid) {
        setErrors(res.errors);
        toast.error('Please complete all recruitment & agent experience declarations.');
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    if (step > 0) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setErrors({});
    const res = validateStep4(ack);
    if (!res.isValid) {
      setErrors(res.errors);
      toast.error(
        `You must accept all ${CANDIDATE_ACKNOWLEDGEMENT_ITEMS.length} mandatory acknowledgements before proceeding.`,
      );
      return;
    }

    setSaving(true);
    try {
      const result = await saveWorkerDeclarations(userId, medical, overseas, recruitment, ack);
      toast.success('Pre-journey screening declarations submitted successfully!');
      onCompleted(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit declarations.');
    } finally {
      setSaving(false);
    }
  };

  const agreeAllAcknowledgements = () => {
    const next = { ...ack };
    for (const item of CANDIDATE_ACKNOWLEDGEMENT_ITEMS) next[item.key] = true;
    setAck(next);
    setErrors({});
  };

  return (
    <div
      className={
        variant === 'inline'
          ? 'w-full min-w-0'
          : 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-md sm:p-6'
      }
    >
      <Card className="relative w-full min-w-0 max-w-3xl overflow-hidden border-primary/20 bg-card shadow-2xl shadow-primary/10">
        {/* Header */}
        <CardHeader className="border-b border-border/60 bg-muted/30 px-3 pb-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {step === 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                      {ORIGINAL_DOCS_READY_NOTICE.badgeEn}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {ORIGINAL_DOCS_READY_NOTICE.badgeHi}
                    </span>
                  </div>
                  <CardTitle className="mt-2 break-words text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {ORIGINAL_DOCS_READY_NOTICE.titleEn}
                  </CardTitle>
                  <HindiText className="mt-1 text-base font-semibold text-muted-foreground">
                    {ORIGINAL_DOCS_READY_NOTICE.titleHi}
                  </HindiText>
                </>
              ) : (
                <>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                      {PRE_JOURNEY_COPY.headerBadge.en}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {step} of 4 · चरण {step} / 4
                    </span>
                  </div>
                  <CardTitle className="mt-2 break-words text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {PRE_JOURNEY_COPY.headerTitle.en}
                  </CardTitle>
                  <HindiText className="mt-1 text-sm font-medium text-muted-foreground">
                    {PRE_JOURNEY_COPY.headerTitle.hi}
                  </HindiText>
                  <CardDescription className="mt-1.5 break-words text-xs text-muted-foreground sm:text-sm">
                    <span className="block">{PRE_JOURNEY_COPY.headerDesc.en}</span>
                    <HindiText className="mt-0.5 text-xs">{PRE_JOURNEY_COPY.headerDesc.hi}</HindiText>
                  </CardDescription>
                </>
              )}
            </div>
          </div>

          {step > 0 && (
            <nav className="mt-4 min-w-0" aria-label="Declaration steps">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
                {[
                  { num: 1, label: PRE_JOURNEY_COPY.nav[0], icon: Stethoscope },
                  { num: 2, label: PRE_JOURNEY_COPY.nav[1], icon: Globe2 },
                  { num: 3, label: PRE_JOURNEY_COPY.nav[2], icon: UserCheck },
                  { num: 4, label: PRE_JOURNEY_COPY.nav[3], icon: FileCheck2 },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = step === s.num;
                  const isPast = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (isPast) setStep(s.num as Step);
                      }}
                      className={cn(
                        'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition-all sm:p-2',
                        isActive
                          ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                          : isPast
                            ? 'cursor-pointer bg-primary/15 text-primary hover:bg-primary/20'
                            : 'bg-muted/50 text-muted-foreground opacity-70',
                      )}
                    >
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {isPast ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="tabular-nums">{s.num}</span>
                      </div>
                      <span className="w-full break-words text-[11px] font-medium leading-tight sm:text-xs">
                        {s.label.en}
                      </span>
                      <HindiText
                        className={cn(
                          'w-full break-words text-[10px] font-medium leading-tight',
                          isActive ? 'text-primary-foreground/80' : '',
                        )}
                      >
                        {s.label.hi}
                      </HindiText>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </CardHeader>

        {/* Content Body */}
        <CardContent
          className={
            variant === 'inline'
              ? 'min-w-0 space-y-6 overflow-x-hidden p-3 sm:p-6'
              : 'max-h-[68vh] min-w-0 space-y-6 overflow-y-auto overflow-x-hidden p-3 sm:p-6'
          }
        >
          {step === 0 && (
            <div className="space-y-5">
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-semibold text-foreground">
                  {ORIGINAL_DOCS_READY_NOTICE.bodyEn}
                </AlertTitle>
                <AlertDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <HindiText>{ORIGINAL_DOCS_READY_NOTICE.bodyHi}</HindiText>
                </AlertDescription>
              </Alert>

              <ul className="space-y-2">
                {[
                  { icon: CreditCard, ...ORIGINAL_DOCS_READY_NOTICE.items[0] },
                  { icon: Fingerprint, ...ORIGINAL_DOCS_READY_NOTICE.items[1] },
                  { icon: BookOpen, ...ORIGINAL_DOCS_READY_NOTICE.items[2] },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.en}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.en}</p>
                        <HindiText className="mt-0.5 text-sm text-muted-foreground">{item.hi}</HindiText>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* STEP 1: Medical & Fitness */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <h3 className={SECTION_TITLE}>
                  <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {PRE_JOURNEY_COPY.medical.title.en}
                </h3>
                <HindiText className="mt-0.5 text-sm text-muted-foreground">
                  {PRE_JOURNEY_COPY.medical.title.hi}
                </HindiText>
                <p className="mt-1 text-xs text-muted-foreground">{PRE_JOURNEY_COPY.medical.desc.en}</p>
                <HindiText className="mt-0.5 text-xs text-muted-foreground">
                  {PRE_JOURNEY_COPY.medical.desc.hi}
                </HindiText>
              </div>

              {/* Question 1 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.medical.q1} enClassName="text-sm" />
                </Label>
                <div className={THREE_CHOICE_GRID}>
                  {[
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'not_sure', copy: PRE_JOURNEY_COPY.notSure },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        medical.fitForDuties === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fitForDuties"
                        value={opt.val}
                        checked={medical.fitForDuties === opt.val}
                        onChange={() => setMedical({ ...medical, fitForDuties: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.fitForDuties && (
                  <p className="text-xs font-medium text-destructive">{errors.fitForDuties}</p>
                )}
              </div>

              {/* Question 2 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.medical.q2} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesMedical },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${
                        medical.hasMedicalCondition === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasMedicalCondition"
                        value={opt.val}
                        checked={medical.hasMedicalCondition === opt.val}
                        onChange={() => setMedical({ ...medical, hasMedicalCondition: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.hasMedicalCondition && (
                  <p className="text-xs font-medium text-destructive">{errors.hasMedicalCondition}</p>
                )}

                {medical.hasMedicalCondition === 'yes' && (
                  <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs font-medium text-foreground">
                      <EnHiLine copy={PRE_JOURNEY_COPY.medical.details} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please specify any medical condition, physical limitation, or ongoing treatment..."
                      value={medical.medicalConditionDetails || ''}
                      onChange={(e) => setMedical({ ...medical, medicalConditionDetails: e.target.value })}
                      className="min-h-[80px] text-sm"
                    />
                    {errors.medicalConditionDetails && (
                      <p className="text-xs font-medium text-destructive">{errors.medicalConditionDetails}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Disclaimer Notice */}
              <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  {PRE_JOURNEY_COPY.medical.disclaimerTitle.en}
                </AlertTitle>
                <HindiText className="mt-0.5 text-[11px] font-medium text-amber-800/80 dark:text-amber-200/80">
                  {PRE_JOURNEY_COPY.medical.disclaimerTitle.hi}
                </HindiText>
                <AlertDescription className="mt-1 text-xs leading-relaxed">
                  <span className="block">{PRE_JOURNEY_COPY.medical.disclaimerBody.en}</span>
                  <HindiText className="mt-1 text-xs">{PRE_JOURNEY_COPY.medical.disclaimerBody.hi}</HindiText>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* STEP 2: Previous Overseas Employment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <h3 className={SECTION_TITLE}>
                  <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {PRE_JOURNEY_COPY.overseas.title.en}
                </h3>
                <HindiText className="mt-0.5 text-sm text-muted-foreground">
                  {PRE_JOURNEY_COPY.overseas.title.hi}
                </HindiText>
                <p className="mt-1 text-xs text-muted-foreground">{PRE_JOURNEY_COPY.overseas.desc.en}</p>
                <HindiText className="mt-0.5 text-xs text-muted-foreground">
                  {PRE_JOURNEY_COPY.overseas.desc.hi}
                </HindiText>
              </div>

              {/* Question 3 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.overseas.q3} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        overseas.workedOutsideIndia === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="workedOutsideIndia"
                        value={opt.val}
                        checked={overseas.workedOutsideIndia === opt.val}
                        onChange={() =>
                          setOverseas({
                            ...overseas,
                            workedOutsideIndia: opt.val as 'yes' | 'no',
                            gccReturn: opt.val === 'no' ? 'no' : overseas.gccReturn,
                          })
                        }
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.workedOutsideIndia && (
                  <p className="text-xs font-medium text-destructive">{errors.workedOutsideIndia}</p>
                )}
              </div>

              {/* Question 4 — GCC return */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.overseas.q4} enClassName="text-sm" />
                </Label>
                <p className="text-xs text-muted-foreground">{PRE_JOURNEY_COPY.overseas.q4Hint.en}</p>
                <HindiText className="text-xs text-muted-foreground">{PRE_JOURNEY_COPY.overseas.q4Hint.hi}</HindiText>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        overseas.gccReturn === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gccReturn"
                        value={opt.val}
                        checked={overseas.gccReturn === opt.val}
                        onChange={() =>
                          setOverseas({
                            ...overseas,
                            gccReturn: opt.val as 'yes' | 'no',
                            workedOutsideIndia:
                              opt.val === 'yes' ? 'yes' : overseas.workedOutsideIndia,
                          })
                        }
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.gccReturn && (
                  <p className="text-xs font-medium text-destructive">{errors.gccReturn}</p>
                )}

                {(overseas.workedOutsideIndia === 'yes' || overseas.gccReturn === 'yes') && (
                  <div className="mt-4 space-y-3 rounded-lg bg-muted/40 p-3 sm:p-4 border border-border/50 animate-in fade-in">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {PRE_JOURNEY_COPY.overseas.details.en}
                    </p>
                    <HindiText className="text-[11px] text-muted-foreground">
                      {PRE_JOURNEY_COPY.overseas.details.hi}
                    </HindiText>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">
                          <EnHiLine copy={PRE_JOURNEY_COPY.overseas.country} enClassName="text-xs" />
                        </Label>
                        <Input
                          placeholder="e.g. UAE, Saudi Arabia, Qatar"
                          value={overseas.overseasDetails?.country || ''}
                          onChange={(e) =>
                            setOverseas({
                              ...overseas,
                              overseasDetails: { ...overseas.overseasDetails!, country: e.target.value },
                            })
                          }
                          className="mt-1 text-sm"
                        />
                        {errors.country && <p className="text-[11px] text-destructive">{errors.country}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">
                          <EnHiLine copy={PRE_JOURNEY_COPY.overseas.employer} enClassName="text-xs" />
                        </Label>
                        <Input
                          placeholder="e.g. Al Habtoor Contracting"
                          value={overseas.overseasDetails?.employer || ''}
                          onChange={(e) =>
                            setOverseas({
                              ...overseas,
                              overseasDetails: { ...overseas.overseasDetails!, employer: e.target.value },
                            })
                          }
                          className="mt-1 text-sm"
                        />
                        {errors.employer && <p className="text-[11px] text-destructive">{errors.employer}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">
                          <EnHiLine copy={PRE_JOURNEY_COPY.overseas.jobTrade} enClassName="text-xs" />
                        </Label>
                        <Input
                          placeholder="e.g. Electrician, Pipe Fitter"
                          value={overseas.overseasDetails?.jobTrade || ''}
                          onChange={(e) =>
                            setOverseas({
                              ...overseas,
                              overseasDetails: { ...overseas.overseasDetails!, jobTrade: e.target.value },
                            })
                          }
                          className="mt-1 text-sm"
                        />
                        {errors.jobTrade && <p className="text-[11px] text-destructive">{errors.jobTrade}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">
                          <EnHiLine copy={PRE_JOURNEY_COPY.overseas.durationYear} enClassName="text-xs" />
                        </Label>
                        <div className="mt-1 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                          <Input
                            placeholder="Duration (e.g. 2 yrs)"
                            value={overseas.overseasDetails?.duration || ''}
                            onChange={(e) =>
                              setOverseas({
                                ...overseas,
                                overseasDetails: { ...overseas.overseasDetails!, duration: e.target.value },
                              })
                            }
                            className="text-sm"
                          />
                          <Input
                            placeholder="Year (e.g. 2022)"
                            value={overseas.overseasDetails?.year || ''}
                            onChange={(e) =>
                              setOverseas({
                                ...overseas,
                                overseasDetails: { ...overseas.overseasDetails!, year: e.target.value },
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                        {(errors.duration || errors.year) && (
                          <p className="text-[11px] text-destructive">Enter duration and year</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Question 5 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.overseas.q5} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesDetails },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        overseas.beenDeported === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="beenDeported"
                        value={opt.val}
                        checked={overseas.beenDeported === opt.val}
                        onChange={() => setOverseas({ ...overseas, beenDeported: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.beenDeported && <p className="text-xs font-medium text-destructive">{errors.beenDeported}</p>}

                {overseas.beenDeported === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.overseas.deportedDetails} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please specify country, year, and reason for deportation or repatriation..."
                      value={overseas.deportedDetails || ''}
                      onChange={(e) => setOverseas({ ...overseas, deportedDetails: e.target.value })}
                      className="min-h-[70px] text-sm"
                    />
                    {errors.deportedDetails && <p className="text-xs font-medium text-destructive">{errors.deportedDetails}</p>}
                  </div>
                )}
              </div>

              {/* Question 6 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.overseas.q6} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesDetails },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        overseas.refusedVisaOrEntry === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="refusedVisaOrEntry"
                        value={opt.val}
                        checked={overseas.refusedVisaOrEntry === opt.val}
                        onChange={() => setOverseas({ ...overseas, refusedVisaOrEntry: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.refusedVisaOrEntry && <p className="text-xs font-medium text-destructive">{errors.refusedVisaOrEntry}</p>}

                {overseas.refusedVisaOrEntry === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.overseas.visaDetails} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please specify country, visa type, and reason for visa refusal or cancellation..."
                      value={overseas.refusedVisaDetails || ''}
                      onChange={(e) => setOverseas({ ...overseas, refusedVisaDetails: e.target.value })}
                      className="min-h-[70px] text-sm"
                    />
                    {errors.refusedVisaDetails && <p className="text-xs font-medium text-destructive">{errors.refusedVisaDetails}</p>}
                  </div>
                )}
              </div>

              {/* Question 7 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.overseas.q7} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesDetails },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        overseas.overstayedVisa === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="overstayedVisa"
                        value={opt.val}
                        checked={overseas.overstayedVisa === opt.val}
                        onChange={() => setOverseas({ ...overseas, overstayedVisa: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.overstayedVisa && <p className="text-xs font-medium text-destructive">{errors.overstayedVisa}</p>}

                {overseas.overstayedVisa === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.overseas.overstayDetails} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please specify country, duration of overstay, and how it was resolved..."
                      value={overseas.overstayedDetails || ''}
                      onChange={(e) => setOverseas({ ...overseas, overstayedDetails: e.target.value })}
                      className="min-h-[70px] text-sm"
                    />
                    {errors.overstayedDetails && <p className="text-xs font-medium text-destructive">{errors.overstayedDetails}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Previous Recruitment / Agent Experience */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <h3 className={SECTION_TITLE}>
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {PRE_JOURNEY_COPY.recruitment.title.en}
                </h3>
                <HindiText className="mt-0.5 text-sm text-muted-foreground">
                  {PRE_JOURNEY_COPY.recruitment.title.hi}
                </HindiText>
                <p className="mt-1 text-xs text-muted-foreground">{PRE_JOURNEY_COPY.recruitment.desc.en}</p>
                <HindiText className="mt-0.5 text-xs text-muted-foreground">
                  {PRE_JOURNEY_COPY.recruitment.desc.hi}
                </HindiText>
              </div>

              {/* Question 8 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.q8} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        recruitment.registeredWithOtherAgency === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="registeredWithOtherAgency"
                        value={opt.val}
                        checked={recruitment.registeredWithOtherAgency === opt.val}
                        onChange={() => setRecruitment({ ...recruitment, registeredWithOtherAgency: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.registeredWithOtherAgency && (
                  <p className="text-xs font-medium text-destructive">{errors.registeredWithOtherAgency}</p>
                )}

                {recruitment.registeredWithOtherAgency === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.agencyDetails} enClassName="text-xs" />
                    </Label>
                    <Input
                      placeholder="e.g. Agency name, location or contact details..."
                      value={recruitment.agencyDetails || ''}
                      onChange={(e) => setRecruitment({ ...recruitment, agencyDetails: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Question 9 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.q9} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesAmount },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        recruitment.paidMoneyForJob === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paidMoneyForJob"
                        value={opt.val}
                        checked={recruitment.paidMoneyForJob === opt.val}
                        onChange={() => setRecruitment({ ...recruitment, paidMoneyForJob: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.paidMoneyForJob && <p className="text-xs font-medium text-destructive">{errors.paidMoneyForJob}</p>}

                {recruitment.paidMoneyForJob === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.paidDetails} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please specify amount paid (in INR), person/agent name, receipt status, and purpose..."
                      value={recruitment.paidAmountDetails || ''}
                      onChange={(e) => setRecruitment({ ...recruitment, paidAmountDetails: e.target.value })}
                      className="min-h-[70px] text-sm"
                    />
                    {errors.paidAmountDetails && <p className="text-xs font-medium text-destructive">{errors.paidAmountDetails}</p>}
                  </div>
                )}
              </div>

              {/* Question 10 */}
              <div className={QUESTION_CARD}>
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.q10} enClassName="text-sm" />
                </Label>
                <div className={TWO_CHOICE_GRID}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yesDetails },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`${CHOICE_BTN} transition-all ${}
                        recruitment.promisedGuaranteedJobForMoney === opt.val
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="promisedGuaranteedJobForMoney"
                        value={opt.val}
                        checked={recruitment.promisedGuaranteedJobForMoney === opt.val}
                        onChange={() => setRecruitment({ ...recruitment, promisedGuaranteedJobForMoney: opt.val as any })}
                        className="sr-only"
                      />
                      <ChoiceLabel copy={opt.copy} />
                    </label>
                  ))}
                </div>
                {errors.promisedGuaranteedJobForMoney && (
                  <p className="text-xs font-medium text-destructive">{errors.promisedGuaranteedJobForMoney}</p>
                )}

                {recruitment.promisedGuaranteedJobForMoney === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">
                      <EnHiLine copy={PRE_JOURNEY_COPY.recruitment.promiseDetails} enClassName="text-xs" />
                    </Label>
                    <Textarea
                      placeholder="Please describe who promised the job/visa, amount requested or paid, and details..."
                      value={recruitment.promisedJobDetails || ''}
                      onChange={(e) => setRecruitment({ ...recruitment, promisedJobDetails: e.target.value })}
                      className="min-h-[70px] text-sm"
                    />
                    {errors.promisedJobDetails && <p className="text-xs font-medium text-destructive">{errors.promisedJobDetails}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Candidate Acknowledgements */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <div>
                  <h3 className={SECTION_TITLE}>
                    <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {PRE_JOURNEY_COPY.ack.title.en}
                  </h3>
                  <HindiText className="mt-0.5 text-sm text-muted-foreground">
                    {PRE_JOURNEY_COPY.ack.title.hi}
                  </HindiText>
                  <p className="mt-1 text-xs text-muted-foreground">{PRE_JOURNEY_COPY.ack.desc.en}</p>
                  <HindiText className="mt-0.5 text-xs text-muted-foreground">{PRE_JOURNEY_COPY.ack.desc.hi}</HindiText>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agreeAllAcknowledgements}
                  className="shrink-0 h-auto flex-col gap-0 text-xs border-primary/40 text-primary hover:bg-primary/10 py-1.5"
                >
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.every((item) => ack[item.key])
                      ? PRE_JOURNEY_COPY.allAccepted.en
                      : PRE_JOURNEY_COPY.selectAll.en}
                  </span>
                  <HindiText className="text-[10px] font-medium opacity-80">
                    {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.every((item) => ack[item.key])
                      ? PRE_JOURNEY_COPY.allAccepted.hi
                      : PRE_JOURNEY_COPY.selectAll.hi}
                  </HindiText>
                </Button>
              </div>

              {errors._general && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">
                    {PRE_JOURNEY_COPY.incomplete.en}
                    <HindiText className="mt-0.5 font-medium">{PRE_JOURNEY_COPY.incomplete.hi}</HindiText>
                  </AlertTitle>
                  <AlertDescription className="text-xs">{errors._general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.map((item, idx) => {
                  const isChecked = ack[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 rounded-lg border p-3.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                          : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <Checkbox
                        id={item.key}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          setAck({ ...ack, [item.key]: Boolean(checked) })
                        }
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <span className="mr-1 text-xs font-bold text-muted-foreground">[{idx + 1}]</span>
                        <span className="break-words text-xs font-medium leading-normal text-foreground sm:text-sm">
                          {item.text}
                        </span>
                        <HindiText className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">
                          {item.textHi}
                        </HindiText>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={saving}
                className="h-auto w-full gap-1 py-2 text-xs sm:w-auto sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="flex flex-col items-start leading-tight">
                  <span>{PRE_JOURNEY_COPY.back.en}</span>
                  <HindiText className="text-[10px] font-medium opacity-80">{PRE_JOURNEY_COPY.back.hi}</HindiText>
                </span>
              </Button>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            {step === 0 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-auto w-full flex-col gap-0.5 bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm sm:w-auto"
              >
                <span className="text-sm">{ORIGINAL_DOCS_READY_NOTICE.continueEn}</span>
                <span className="text-xs font-medium opacity-90">{ORIGINAL_DOCS_READY_NOTICE.continueHi}</span>
              </Button>
            ) : step < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-auto w-full min-w-0 gap-1 bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto sm:text-sm"
              >
                <span className="flex flex-col items-end leading-tight">
                  <span>{PRE_JOURNEY_COPY.next.en}</span>
                  <HindiText className="text-[10px] font-medium opacity-90">{PRE_JOURNEY_COPY.next.hi}</HindiText>
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="h-auto w-full min-w-0 gap-1.5 bg-emerald-600 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 sm:w-auto sm:text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="flex flex-col items-start leading-tight">
                      <span>{PRE_JOURNEY_COPY.saving.en}</span>
                      <HindiText className="text-[10px] font-medium opacity-90">{PRE_JOURNEY_COPY.saving.hi}</HindiText>
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="flex flex-col items-start leading-tight">
                      <span>{PRE_JOURNEY_COPY.submit.en}</span>
                      <HindiText className="text-[10px] font-medium opacity-90">{PRE_JOURNEY_COPY.submit.hi}</HindiText>
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
