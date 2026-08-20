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
import type {
  MedicalFitnessDeclaration,
  PreviousOverseasEmploymentDeclaration,
  RecruitmentAgentExperienceDeclaration,
  CandidateAcknowledgements,
  WorkerPreJourneyDeclaration,
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
}

type Step = 1 | 2 | 3 | 4;

export default function WorkerPreJourneyScreeningModal({ userId, isOpen, onCompleted }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [medical, setMedical] = useState<MedicalFitnessDeclaration>(INITIAL_MEDICAL);
  const [overseas, setOverseas] = useState<PreviousOverseasEmploymentDeclaration>(INITIAL_OVERSEAS);
  const [recruitment, setRecruitment] = useState<RecruitmentAgentExperienceDeclaration>(INITIAL_RECRUITMENT);
  const [ack, setAck] = useState<CandidateAcknowledgements>(INITIAL_ACKNOWLEDGEMENTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrors({});
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
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setErrors({});
    const res = validateStep4(ack);
    if (!res.isValid) {
      setErrors(res.errors);
      toast.error('You must accept all 8 mandatory acknowledgements before proceeding.');
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

  const selectAllAcknowledgements = () => {
    setAck({
      noJobGuarantee: true,
      subjectToEmployerReqs: true,
      subjectToVisaClearance: true,
      tradeTestNoGuarantee: true,
      agreeGenuineInfo: true,
      falseDocConsequences: true,
      agreeMedicalAndTesting: true,
      transparentCharges: true,
    });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-md sm:p-6">
      <Card className="relative w-full max-w-3xl border-primary/20 bg-card shadow-2xl shadow-primary/10">
        {/* Header */}
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                  Pre-Journey Validation & Declarations
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">Step {step} of 4</span>
              </div>
              <CardTitle className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Worker Pre-Placement Declarations
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                Before starting your worker journey, please complete these mandatory health, overseas work, recruitment fee, and candidate compliance checks.
              </CardDescription>
            </div>
          </div>

          {/* Stepper bar */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { num: 1, label: 'Medical & Fitness', icon: Stethoscope },
              { num: 2, label: 'Overseas Work', icon: Globe2 },
              { num: 3, label: 'Agent & Fees', icon: UserCheck },
              { num: 4, label: 'Acknowledgements', icon: FileCheck2 },
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
                  className={`flex flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : isPast
                      ? 'bg-primary/15 text-primary hover:bg-primary/20 cursor-pointer'
                      : 'bg-muted/50 text-muted-foreground opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs">
                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Step {s.num}</span>
                  </div>
                  <span className="truncate text-[10px] font-medium sm:text-xs">{s.label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        {/* Content Body */}
        <CardContent className="max-h-[68vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* STEP 1: Medical & Fitness */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  1. Medical & Fitness
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Declare your physical suitability for overseas skilled trade work.
                </p>
              </div>

              {/* Question 1 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  1. Do you consider yourself physically fit to perform the essential duties of the trade/job you are applying for?
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'yes', label: 'Yes' },
                    { val: 'no', label: 'No' },
                    { val: 'not_sure', label: 'Not Sure' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.fitForDuties && (
                  <p className="text-xs font-medium text-destructive">{errors.fitForDuties}</p>
                )}
              </div>

              {/* Question 2 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  2. Do you have any medical condition or physical limitation that you believe may prevent you from safely performing the essential duties of the job?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Please provide relevant information' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-start rounded-lg border p-3 text-sm font-medium transition-all ${
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
                      <span className="ml-1">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.hasMedicalCondition && (
                  <p className="text-xs font-medium text-destructive">{errors.hasMedicalCondition}</p>
                )}

                {medical.hasMedicalCondition === 'yes' && (
                  <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs font-medium text-foreground">Medical Details & Information</Label>
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
                  Medical Fitness Disclaimer
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs leading-relaxed">
                  This declaration does not replace the medical examination required by the employer, destination country or applicable authorities. Final medical fitness will be determined through the applicable medical examination process.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* STEP 2: Previous Overseas Employment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Globe2 className="h-5 w-5 text-primary" />
                  2. Previous Overseas Employment
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tell us about your prior work experience outside India and immigration history.
                </p>
              </div>

              {/* Question 3 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  3. Have you previously worked outside India?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                        onChange={() => setOverseas({ ...overseas, workedOutsideIndia: opt.val as any })}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.workedOutsideIndia && (
                  <p className="text-xs font-medium text-destructive">{errors.workedOutsideIndia}</p>
                )}

                {overseas.workedOutsideIndia === 'yes' && (
                  <div className="mt-4 space-y-3 rounded-lg bg-muted/40 p-3 sm:p-4 border border-border/50 animate-in fade-in">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Details of Previous Overseas Employment
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Country</Label>
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
                        <Label className="text-xs">Employer Name</Label>
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
                        <Label className="text-xs">Job / Trade</Label>
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
                        <Label className="text-xs">Duration & Year</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
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

              {/* Question 4 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  4. Have you previously been deported, removed or repatriated from another country?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Details' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.beenDeported && <p className="text-xs font-medium text-destructive">{errors.beenDeported}</p>}

                {overseas.beenDeported === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Deportation / Repatriation Details</Label>
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

              {/* Question 5 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  5. Have you ever been refused entry, refused a work visa, or had an employment/residence visa cancelled by another country?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Details' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.refusedVisaOrEntry && <p className="text-xs font-medium text-destructive">{errors.refusedVisaOrEntry}</p>}

                {overseas.refusedVisaOrEntry === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Visa Refusal Details</Label>
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

              {/* Question 6 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  6. Have you ever overstayed a visa or violated immigration rules in another country?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Details' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.overstayedVisa && <p className="text-xs font-medium text-destructive">{errors.overstayedVisa}</p>}

                {overseas.overstayedVisa === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Immigration Overstay Details</Label>
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
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <UserCheck className="h-5 w-5 text-primary" />
                  3. Previous Recruitment / Agent Experience
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Help SafeWork protect you against unauthorized agency fees, fraud, or duplicate recruitment.
                </p>
              </div>

              {/* Question 7 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  7. Have you previously registered with another overseas recruitment agency/agent for this job or another overseas job?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.registeredWithOtherAgency && (
                  <p className="text-xs font-medium text-destructive">{errors.registeredWithOtherAgency}</p>
                )}

                {recruitment.registeredWithOtherAgency === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Agency / Agent Details (Optional)</Label>
                    <Input
                      placeholder="e.g. Agency name, location or contact details..."
                      value={recruitment.agencyDetails || ''}
                      onChange={(e) => setRecruitment({ ...recruitment, agencyDetails: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Question 8 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  8. Have you already paid money to any person/agency for an overseas job related to this application?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Amount / Details' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.paidMoneyForJob && <p className="text-xs font-medium text-destructive">{errors.paidMoneyForJob}</p>}

                {recruitment.paidMoneyForJob === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Amount & Payment Details</Label>
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

              {/* Question 9 */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <Label className="text-sm font-semibold text-foreground leading-snug">
                  9. Has anyone promised you a guaranteed overseas job, visa or deployment in exchange for money?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes — Details' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center text-sm font-medium transition-all ${
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
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.promisedGuaranteedJobForMoney && (
                  <p className="text-xs font-medium text-destructive">{errors.promisedGuaranteedJobForMoney}</p>
                )}

                {recruitment.promisedGuaranteedJobForMoney === 'yes' && (
                  <div className="mt-3 space-y-1 animate-in fade-in">
                    <Label className="text-xs font-medium">Promise Details</Label>
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
                  <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    4. Worker Understanding
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Candidate Acknowledgement — Before allowing entry into the next stage, all 8 checkboxes are mandatory.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllAcknowledgements}
                  className="shrink-0 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Select All Declarations
                </Button>
              </div>

              {errors._general && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">Incomplete Declarations</AlertTitle>
                  <AlertDescription className="text-xs">{errors._general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {[
                  {
                    key: 'noJobGuarantee',
                    text: 'I understand that registration with SafeWork Global does not guarantee employment.',
                  },
                  {
                    key: 'subjectToEmployerReqs',
                    text: "I understand that final selection is subject to the employer's requirements and applicable recruitment procedures.",
                  },
                  {
                    key: 'subjectToVisaClearance',
                    text: 'I understand that visa issuance and immigration/emigration clearance are subject to the relevant authorities and applicable requirements.',
                  },
                  {
                    key: 'tradeTestNoGuarantee',
                    text: 'I understand that a trade test or skill verification does not guarantee employment.',
                  },
                  {
                    key: 'agreeGenuineInfo',
                    text: 'I agree to provide genuine and accurate information and documents.',
                  },
                  {
                    key: 'falseDocConsequences',
                    text: 'I understand that submitting false documents or false information may result in cancellation of my application and may have legal consequences.',
                  },
                  {
                    key: 'agreeMedicalAndTesting',
                    text: 'I agree to undergo medical examination, skill testing and other verification required for the relevant job/country.',
                  },
                  {
                    key: 'transparentCharges',
                    text: 'I have been informed that applicable recruitment/service charges will be disclosed transparently and handled through the authorized process.',
                  },
                ].map((item, idx) => {
                  const isChecked = (ack as any)[item.key];
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
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-muted-foreground mr-1">[{idx + 1}]</span>
                        <span className="text-xs sm:text-sm font-medium leading-normal text-foreground">
                          {item.text}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-4">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={saving}
                className="gap-1 text-xs sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold shadow-sm"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Declarations...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Validate & Start Worker Journey
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
