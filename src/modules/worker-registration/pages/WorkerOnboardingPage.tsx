import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Camera, CheckCircle2, ChevronLeft, ChevronRight, Globe, Loader2, MapPin,
  Briefcase, Video, Trash2, User,
} from 'lucide-react';
import RegistrationLayout from '../components/RegistrationLayout';
import FormField from '../components/FormField';
import WorkerOnboardingStageBar from '../components/WorkerOnboardingStageBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerApi } from '../services/workerApi';
import type { District, Skill, State } from '../types/worker.types';
import { EXPERIENCE_OPTIONS } from '../types/worker.types';
import type { OnboardingStage, WorkerOnboardingData, WorkerSkillProof } from '../types/onboarding.types';
import {
  AVAILABILITY_OPTIONS, EDUCATION_OPTIONS, GENDER_OPTIONS,
  GCC_CITIES, GCC_COUNTRIES, LANGUAGE_OPTIONS, ONBOARDING_STEPS, SALARY_CURRENCIES,
} from '../types/onboarding.types';
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  formatZodFieldErrors,
} from '../validation/onboardingSchema';
import { formatWorkerApiError, mapWorkerApiFieldErrors } from '../utils/apiErrors';

const STEP_ICONS = [User, MapPin, Briefcase, CheckCircle2];

export default function WorkerOnboardingPage() {
  const navigate = useNavigate();
  const { token, worker, updateWorker } = useWorkerAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [onboarding, setOnboarding] = useState<WorkerOnboardingData | null>(null);
  const [skillProofs, setSkillProofs] = useState<WorkerSkillProof[]>([]);

  // Step 1
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [educationLevel, setEducationLevel] = useState('');

  // Step 2
  const [primarySkillId, setPrimarySkillId] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [preferredGccCountry, setPreferredGccCountry] = useState('');
  const [preferredGccCity, setPreferredGccCity] = useState('');
  const [availability, setAvailability] = useState('');
  const [openToRelocation, setOpenToRelocation] = useState(true);
  const [expectedSalaryMin, setExpectedSalaryMin] = useState('');
  const [expectedSalaryCurrency, setExpectedSalaryCurrency] = useState('AED');
  const [languages, setLanguages] = useState<string[]>(['Hindi']);
  const [secondarySkillIds, setSecondarySkillIds] = useState<number[]>([]);
  const [previousEmployer, setPreviousEmployer] = useState('');

  // Step 3
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillExperienceYears, setSkillExperienceYears] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [activeProofId, setActiveProofId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !worker) return;

    if (worker.onboardingCompleted) {
      navigate('/home', { replace: true });
      return;
    }

    Promise.all([
      workerApi.getOnboarding(token),
      workerApi.getReferenceData(),
    ])
      .then(([data, ref]) => {
        applyOnboarding(data);
        setStates(ref.states);
        setSkills(ref.skills);
        setStep(Math.min(Math.max(data.currentStep, 1), 4));
      })
      .catch(() => toast.error('Failed to load onboarding data'))
      .finally(() => setLoading(false));
  }, [token, worker, navigate]);

  useEffect(() => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    workerApi.getDistricts(Number(stateId)).then(setDistricts).catch(() => setDistricts([]));
  }, [stateId]);

  useEffect(() => {
    if (!districtId || districts.length === 0) return;
    if (!districts.some((d) => String(d.id) === districtId)) {
      setDistrictId('');
    }
  }, [districts, districtId]);

  const applyOnboarding = (data: WorkerOnboardingData) => {
    setOnboarding(data);
    setSkillProofs(data.skillProofs);
    if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
    if (data.gender) setGender(data.gender);
    if (data.email) setEmail(data.email);
    if (data.address) setAddress(data.address);
    if (data.pincode) setPincode(data.pincode);
    if (data.stateId) setStateId(String(data.stateId));
    if (data.districtId) setDistrictId(String(data.districtId));
    if (data.educationLevel) setEducationLevel(data.educationLevel);
    if (data.primarySkillId) setPrimarySkillId(String(data.primarySkillId));
    if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
    if (data.preferredGccCountry) setPreferredGccCountry(data.preferredGccCountry);
    if (data.preferredGccCity) setPreferredGccCity(data.preferredGccCity);
    if (data.availability) setAvailability(data.availability);
    setOpenToRelocation(data.openToRelocation);
    if (data.expectedSalaryMin) setExpectedSalaryMin(String(data.expectedSalaryMin));
    setExpectedSalaryCurrency(data.expectedSalaryCurrency || 'AED');
    if (data.languages.length) setLanguages(data.languages);
    setSecondarySkillIds(data.secondarySkillIds);
    if (data.previousEmployer) setPreviousEmployer(data.previousEmployer);
  };

  const refreshOnboarding = async () => {
    if (!token) return;
    const data = await workerApi.getOnboarding(token);
    applyOnboarding(data);
    if (worker) {
      const updated = await workerApi.getProfile(worker.id, token);
      updateWorker(updated);
    }
  };

  const gccCities = preferredGccCountry
    ? GCC_CITIES[preferredGccCountry as keyof typeof GCC_CITIES] ?? []
    : [];

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang]
    );
  };

  const toggleSecondarySkill = (id: number) => {
    if (id === Number(primarySkillId)) return;
    setSecondarySkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (districts.length > 0 && districtId && !districts.some((d) => String(d.id) === districtId)) {
        return 'Select a district that matches your state';
      }

      const parsed = onboardingStep1Schema.safeParse({
        step: 1,
        dateOfBirth,
        gender,
        email: email.trim(),
        address,
        pincode: pincode.trim(),
        stateId,
        districtId,
        educationLevel: educationLevel || undefined,
      });

      if (!parsed.success) {
        const errors = formatZodFieldErrors(parsed.error);
        setFieldErrors(errors);
        return Object.values(errors)[0] ?? 'Please fix the highlighted fields';
      }
      setFieldErrors({});
      return null;
    }

    if (step === 2) {
      const parsed = onboardingStep2Schema.safeParse({
        step: 2,
        primarySkillId,
        experienceLevel,
        preferredGccCountry,
        preferredGccCity,
        availability,
        openToRelocation,
        expectedSalaryMin: expectedSalaryMin || undefined,
        expectedSalaryCurrency,
        languages,
        secondarySkillIds,
        previousEmployer: previousEmployer.trim() || undefined,
      });

      if (!parsed.success) {
        const errors = formatZodFieldErrors(parsed.error);
        setFieldErrors(errors);
        return Object.values(errors)[0] ?? 'Please fix the highlighted fields';
      }
      setFieldErrors({});
      return null;
    }

    if (step === 3) {
      const hasMedia = skillProofs.some(
        (p) => p.photoUrls.length > 0 || p.videoUrls.length > 0
      );
      if (!hasMedia) return 'Add at least one skill with a photo or video';
    }
    return null;
  };

  const handleNext = async () => {
    if (!token) return;
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      if (step === 1) {
        const payload = onboardingStep1Schema.parse({
          step: 1,
          dateOfBirth,
          gender,
          email: email.trim(),
          address,
          pincode: pincode.trim(),
          stateId,
          districtId,
          educationLevel: educationLevel || undefined,
        });

        await workerApi.saveOnboardingStep(token, payload);
        await refreshOnboarding();
        setStep(2);
      } else if (step === 2) {
        const payload = onboardingStep2Schema.parse({
          step: 2,
          primarySkillId,
          experienceLevel,
          preferredGccCountry,
          preferredGccCity,
          availability,
          openToRelocation,
          expectedSalaryMin: expectedSalaryMin || undefined,
          expectedSalaryCurrency,
          languages,
          secondarySkillIds,
          previousEmployer: previousEmployer.trim() || undefined,
        });

        await workerApi.saveOnboardingStep(token, payload);
        await refreshOnboarding();
        setStep(3);
      } else if (step === 3) {
        await workerApi.advanceToReview(token);
        await refreshOnboarding();
        setStep(4);
      }
    } catch (err) {
      const apiFieldErrors = mapWorkerApiFieldErrors(err);
      if (apiFieldErrors) setFieldErrors(apiFieldErrors);
      toast.error(formatWorkerApiError(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const result = await workerApi.completeOnboarding(token);
      updateWorker(result.worker);
      toast.success('Profile complete! You can now browse and apply to GCC jobs.');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!token || !selectedSkillId) {
      toast.error('Select a skill first');
      return;
    }
    setSaving(true);
    try {
      const proof = await workerApi.addSkillProof(token, {
        skillId: Number(selectedSkillId),
        experienceYears: skillExperienceYears ? Number(skillExperienceYears) : undefined,
      });
      setSkillProofs((prev) => {
        const exists = prev.find((p) => p.id === proof.id);
        return exists ? prev.map((p) => (p.id === proof.id ? proof : p)) : [...prev, proof];
      });
      setSelectedSkillId('');
      setSkillExperienceYears('');
      await refreshOnboarding();
      toast.success('Skill added — now upload a photo or video');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (proofId: number) => {
    if (!token) return;
    setSaving(true);
    try {
      const data = await workerApi.deleteSkillProof(token, proofId);
      applyOnboarding(data);
      toast.success('Skill removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove skill');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (file: File, type: 'photo' | 'video') => {
    if (!token || !activeProofId) return;
    setUploading(true);
    try {
      const proof =
        type === 'photo'
          ? await workerApi.uploadSkillPhoto(token, activeProofId, file)
          : await workerApi.uploadSkillVideo(token, activeProofId, file);
      setSkillProofs((prev) => prev.map((p) => (p.id === proof.id ? proof : p)));
      await refreshOnboarding();
      toast.success(type === 'photo' ? 'Photo uploaded' : 'Video uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setActiveProofId(null);
    }
  };

  if (loading || !worker) {
    return (
      <RegistrationLayout title="Complete Your Profile" subtitle="Loading..." portalHomePath="/home">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RegistrationLayout>
    );
  }

  const progress = (step / ONBOARDING_STEPS.length) * 100;
  const stage = (onboarding?.onboardingStage ?? 'REGISTERED') as OnboardingStage;
  const skillsWithMedia = skillProofs.filter(
    (p) => p.photoUrls.length > 0 || p.videoUrls.length > 0
  ).length;

  return (
    <RegistrationLayout
      title="Complete Your Profile"
      subtitle="Tell us about yourself to find GCC overseas jobs"
      portalHomePath="/home"
    >
      <WorkerOnboardingStageBar
        currentStep={step}
        onboardingStage={stage}
        skillsWithMediaCount={skillsWithMedia}
        onboardingCompleted={false}
      />

      <div className="mb-4 flex items-center gap-2">
        {ONBOARDING_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.id - 1];
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step > s.id ? 'bg-green-500 text-white' :
                  step === s.id ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {s.id < ONBOARDING_STEPS.length && (
                <div className={`mx-1 h-0.5 flex-1 ${step > s.id ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
      <Progress value={progress} className="mb-6 h-2" />

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>{ONBOARDING_STEPS[step - 1].title}</CardTitle>
          <CardDescription>
            {step === 1 && 'Your basic details and home location in India'}
            {step === 2 && 'Your trade, experience, and preferred GCC job location'}
            {step === 3 && 'Upload photos or videos showing your skills — required to apply'}
            {step === 4 && 'Review your profile before finishing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date of Birth" required error={fieldErrors.dateOfBirth}>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </FormField>
              <FormField label="Gender" required error={fieldErrors.gender}>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="State" required error={fieldErrors.stateId}>
                <Select value={stateId} onValueChange={(v) => { setStateId(v); setDistrictId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="District" required error={fieldErrors.districtId}>
                <Select value={districtId} onValueChange={setDistrictId} disabled={!stateId}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Education (optional)" className="sm:col-span-2" error={fieldErrors.educationLevel}>
                <Select value={educationLevel} onValueChange={setEducationLevel}>
                  <SelectTrigger><SelectValue placeholder="Select if applicable — not required" /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Email (optional)" className="sm:col-span-2" error={fieldErrors.email}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </FormField>
              <FormField label="Full Address" required className="sm:col-span-2" error={fieldErrors.address}>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Village, street, landmark" />
              </FormField>
              <FormField label="Pincode" required error={fieldErrors.pincode}>
                <Input inputMode="numeric" maxLength={6} value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit pincode" />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <>
              <FormField label="Primary Skill / Trade" required>
                <Select value={primarySkillId} onValueChange={setPrimarySkillId}>
                  <SelectTrigger><SelectValue placeholder="Select your main trade" /></SelectTrigger>
                  <SelectContent>
                    {skills.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Experience" required>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Preferred GCC Country" required>
                  <Select value={preferredGccCountry} onValueChange={(v) => { setPreferredGccCountry(v); setPreferredGccCity(''); }}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {GCC_COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Preferred City" required>
                  {gccCities.length > 0 ? (
                    <Select value={preferredGccCity} onValueChange={setPreferredGccCity}>
                      <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {gccCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={preferredGccCity} onChange={(e) => setPreferredGccCity(e.target.value)} placeholder="City name" />
                  )}
                </FormField>
              </div>
              <FormField label="Availability" required>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger><SelectValue placeholder="When can you start?" /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <LabelBlock title="Open to Relocation" subtitle="Willing to work overseas in the GCC" />
                <Switch checked={openToRelocation} onCheckedChange={setOpenToRelocation} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Expected Salary (optional)">
                  <Input type="number" value={expectedSalaryMin} onChange={(e) => setExpectedSalaryMin(e.target.value)} placeholder="e.g. 1500" />
                </FormField>
                <FormField label="Currency">
                  <Select value={expectedSalaryCurrency} onValueChange={setExpectedSalaryCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SALARY_CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Other Skills (optional, max 5)">
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-md border p-3">
                  {skills.filter((s) => String(s.id) !== primarySkillId).map((s) => (
                    <Badge
                      key={s.id}
                      variant={secondarySkillIds.includes(s.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSecondarySkill(s.id)}
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </FormField>
              <FormField label="Previous Employer (optional)">
                <Input value={previousEmployer} onChange={(e) => setPreviousEmployer(e.target.value)} placeholder="Last company or project" />
              </FormField>
              <FormField label="Languages Spoken" required>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <label key={lang} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-muted/50">
                      <Checkbox checked={languages.includes(lang)} onCheckedChange={() => toggleLanguage(lang)} />
                      {lang}
                    </label>
                  ))}
                </div>
              </FormField>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium">Upload proof of your skills</p>
                <p className="text-muted-foreground mt-1">
                  Add at least one skill with a work photo or short skill video. This helps employers trust your profile.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FormField label="Add skill" className="flex-1">
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
                    <SelectContent>
                      {skills.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Years (optional)" className="w-full sm:w-32">
                  <Input type="number" min={0} max={50} value={skillExperienceYears}
                    onChange={(e) => setSkillExperienceYears(e.target.value)} placeholder="Yrs" />
                </FormField>
                <Button type="button" onClick={handleAddSkill} disabled={saving || !selectedSkillId}>
                  Add Skill
                </Button>
              </div>

              <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleMediaUpload(file, 'photo');
                  e.target.value = '';
                }} />
              <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleMediaUpload(file, 'video');
                  e.target.value = '';
                }} />

              <div className="space-y-4">
                {skillProofs.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">No skills added yet</p>
                )}
                {skillProofs.map((proof) => (
                  <Card key={proof.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold">{proof.skillName}</p>
                        {proof.experienceYears != null && (
                          <p className="text-xs text-muted-foreground">{proof.experienceYears} years experience</p>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteSkill(proof.id)} disabled={saving}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proof.photoUrls.map((url) => (
                        <img key={url} src={url} alt="Skill" className="h-16 w-16 rounded-md object-cover border" />
                      ))}
                      {proof.videoUrls.map((url) => (
                        <video key={url} src={url} className="h-16 w-24 rounded-md border object-cover" controls />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={uploading}
                        onClick={() => { setActiveProofId(proof.id); photoInputRef.current?.click(); }}>
                        <Camera className="h-4 w-4 mr-1" /> Add Photo
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={uploading}
                        onClick={() => { setActiveProofId(proof.id); videoInputRef.current?.click(); }}>
                        <Video className="h-4 w-4 mr-1" /> Add Video
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </p>
              )}
            </>
          )}

          {step === 4 && onboarding && (
            <div className="space-y-4 text-sm">
              <ReviewRow label="Name" value={worker.fullName} />
              <ReviewRow label="Location" value={`${onboarding.districtName}, ${onboarding.stateName}`} />
              {onboarding.educationLevel && (
                <ReviewRow label="Education" value={EDUCATION_OPTIONS.find((e) => e.value === onboarding.educationLevel)?.label ?? onboarding.educationLevel} />
              )}
              <ReviewRow label="Primary Skill" value={onboarding.primarySkillName} />
              <ReviewRow label="Experience" value={EXPERIENCE_OPTIONS.find((e) => e.value === onboarding.experienceLevel)?.label ?? onboarding.experienceLevel} />
              <ReviewRow label="GCC Destination" value={`${onboarding.preferredGccCity}, ${onboarding.preferredGccCountry}`} />
              <ReviewRow label="Availability" value={AVAILABILITY_OPTIONS.find((a) => a.value === onboarding.availability)?.label ?? ''} />
              <ReviewRow label="Languages" value={onboarding.languages.join(', ')} />
              <ReviewRow label="Skills with proof" value={`${skillsWithMedia} skill(s) with photos/videos`} />
              {onboarding.canBrowseJobs && (
                <p className="rounded-lg bg-success/10 border border-success/20 p-3 text-success text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" /> You can browse GCC jobs after completing setup
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={saving || uploading}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate('/home')}>Skip for now</Button>
        )}

        {step < 4 ? (
          <Button onClick={handleNext} disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finish & Go to Dashboard
          </Button>
        )}
      </div>
    </RegistrationLayout>
  );
}

function LabelBlock({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
