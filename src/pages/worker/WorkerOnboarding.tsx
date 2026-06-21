import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, MapPin, Briefcase, Settings2, Upload } from 'lucide-react';
import {
  JOB_CATEGORIES, POPULAR_SKILLS, SKILL_LEVELS, EXPERIENCE_RANGES,
  PROJECT_TYPES, AVAILABILITY_CHOICES, SHIFT_PREFERENCES,
  WORK_PREFERENCES, WAGE_TYPES, DESTINATION_COUNTRIES, NATIONALITIES,
} from '@/lib/constants';
import AutoSaveStatus from '@/components/profile/AutoSaveStatus';
import { useAutoSave } from '@/hooks/useAutoSave';
import { saveWorkerOnboardingPartial } from '@/lib/autoSaveProfiles';
import { validateSchema } from '@/lib/validations/common';
import {
  workerOnboardingStep1Schema,
  workerOnboardingStep2Schema,
} from '@/lib/validations/onboarding';

const STEPS = [
  { id: 1, title: 'Basic Details', icon: MapPin },
  { id: 2, title: 'Work Profile', icon: Briefcase },
  { id: 3, title: 'Availability', icon: Settings2 },
];

export default function WorkerOnboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Step 1 — Basic Details
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [country, setCountry] = useState('');
  const [preferredWorkCity, setPreferredWorkCity] = useState('');

  // Step 2 — Work Profile
  const [primaryWorkType, setPrimaryWorkType] = useState('');
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [projectTypes, setProjectTypes] = useState<string[]>([]);

  // Step 3 — Availability
  const [availability, setAvailability] = useState('');
  const [openToRelocation, setOpenToRelocation] = useState(false);
  const [wageType, setWageType] = useState('');
  const [wageAmount, setWageAmount] = useState('');
  const [preferredShift, setPreferredShift] = useState('');
  const [workPreference, setWorkPreference] = useState('');

  const autoSaveData = useMemo(
    () => ({
      fullName,
      mobile,
      currentCity,
      country,
      preferredWorkCity,
      primaryWorkType,
      secondarySkills,
      experienceRange,
      skillLevel,
      projectTypes,
      availability,
      openToRelocation,
      wageType,
      wageAmount,
      preferredShift,
      workPreference,
    }),
    [
      fullName, mobile, currentCity, country, preferredWorkCity, primaryWorkType,
      secondarySkills, experienceRange, skillLevel, projectTypes, availability,
      openToRelocation, wageType, wageAmount, preferredShift, workPreference,
    ],
  );

  const handleAutoSave = useCallback(
    async (data: typeof autoSaveData) => {
      if (!user) return;
      await saveWorkerOnboardingPartial(user.id, data);
    },
    [user],
  );

  const { status: autoSaveStatus, markReady } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName((prev) => prev || profile.full_name || '');
      setMobile((prev) => prev || profile.phone || '');
      setEmail((prev) => prev || profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        markReady({
          fullName: profile?.full_name || '',
          mobile: profile?.phone || '',
          currentCity: '',
          country: '',
          preferredWorkCity: '',
          primaryWorkType: '',
          secondarySkills: [],
          experienceRange: '',
          skillLevel: '',
          projectTypes: [],
          availability: '',
          openToRelocation: false,
          wageType: '',
          wageAmount: '',
          preferredShift: '',
          workPreference: '',
        });
        return;
      }

      const wp = data as Record<string, unknown>;
      const next = {
        fullName: profile?.full_name || fullName,
        mobile: profile?.phone || mobile,
        currentCity: (wp.current_city as string) || '',
        country: (wp.country as string) || '',
        preferredWorkCity: (wp.preferred_work_city as string) || '',
        primaryWorkType: (wp.primary_work_type as string) || '',
        secondarySkills: (wp.secondary_skills as string[]) || [],
        experienceRange: (wp.experience_range as string) || '',
        skillLevel: (wp.skill_level as string) || '',
        projectTypes: (wp.project_types_worked as string[]) || [],
        availability: (wp.availability as string) || '',
        openToRelocation: Boolean(wp.open_to_relocation),
        wageType: (wp.expected_wage_type as string) || '',
        wageAmount: wp.expected_wage_amount != null ? String(wp.expected_wage_amount) : '',
        preferredShift: (wp.preferred_shift as string) || '',
        workPreference: (wp.work_preference as string) || '',
      };

      setCurrentCity(next.currentCity);
      setCountry(next.country);
      setPreferredWorkCity(next.preferredWorkCity);
      setPrimaryWorkType(next.primaryWorkType);
      setSecondarySkills(next.secondarySkills);
      setExperienceRange(next.experienceRange);
      setSkillLevel(next.skillLevel);
      setProjectTypes(next.projectTypes);
      setAvailability(next.availability);
      setOpenToRelocation(next.openToRelocation);
      setWageType(next.wageType);
      setWageAmount(next.wageAmount);
      setPreferredShift(next.preferredShift);
      setWorkPreference(next.workPreference);
      markReady(next);
    };

    void loadDraft();
  }, [user, profile, markReady]);

  // Check if onboarding already completed
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('worker_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      if ((data as any)?.onboarding_completed) {
        navigate('/worker/dashboard', { replace: true });
      }
    };
    checkOnboarding();
  }, [user, navigate]);

  const toggleSkill = (skill: string) => {
    setSecondarySkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleProjectType = (pt: string) => {
    setProjectTypes(prev =>
      prev.includes(pt) ? prev.filter(p => p !== pt) : [...prev, pt]
    );
  };

  const canProceedStep1 = fullName.trim() && mobile.trim() && currentCity.trim() && country;
  const canProceedStep2 = primaryWorkType && experienceRange && skillLevel;

  const handleNext = () => {
    if (step === 1) {
      const result = validateSchema(workerOnboardingStep1Schema, {
        fullName,
        mobile,
        currentCity,
        country,
        preferredWorkCity,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return;
      }
    } else if (step === 2) {
      const result = validateSchema(workerOnboardingStep2Schema, {
        primaryWorkType,
        experienceRange,
        skillLevel,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return;
      }
    }
    setStepErrors({});
    setStep((s) => s + 1);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profiles
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: mobile })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      // Upsert worker_profiles
      const { error: wpErr } = await supabase
        .from('worker_profiles')
        .upsert({
          user_id: user.id,
          current_city: currentCity || null,
          country: country || null,
          preferred_work_city: preferredWorkCity || currentCity || null,
          primary_work_type: primaryWorkType || null,
          secondary_skills: secondarySkills.length > 0 ? secondarySkills : null,
          experience_range: experienceRange || null,
          skill_level: skillLevel || null,
          project_types_worked: projectTypes.length > 0 ? projectTypes : null,
          availability: availability || null,
          open_to_relocation: openToRelocation,
          expected_wage_type: wageType || null,
          expected_wage_amount: wageAmount ? Number(wageAmount) : null,
          preferred_shift: preferredShift || null,
          work_preference: workPreference || null,
          onboarding_completed: true,
        } as any, { onConflict: 'user_id' });

      if (wpErr) throw wpErr;

      toast.success('Onboarding completed! Welcome aboard 🎉');
      navigate('/worker/dashboard', { replace: true });
    } catch (error) {
      console.error('Onboarding save error:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  const filteredCategories = JOB_CATEGORIES.filter(c => c !== 'All Categories');
  const filteredCountries = NATIONALITIES.filter(c => c !== 'All Nationalities');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of {STEPS.length} — {STEPS[step - 1].title}
          </p>
          <AutoSaveStatus status={autoSaveStatus} className="justify-center mt-2" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                  step > s.id ? 'bg-success text-success-foreground' :
                  step === s.id ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {s.id < STEPS.length && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-success' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />

        <Card>
          <CardContent className="p-6 space-y-5">
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                  {stepErrors.fullName && <p className="text-sm text-destructive">{stepErrors.fullName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">WhatsApp verification will be sent to this number</p>
                  {stepErrors.mobile && <p className="text-sm text-destructive">{stepErrors.mobile}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email (optional)</Label>
                  <Input value={email} disabled className="bg-muted" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Current City *</Label>
                    <Input value={currentCity} onChange={e => setCurrentCity(e.target.value)} placeholder="e.g. Mumbai" />
                    {stepErrors.currentCity && <p className="text-sm text-destructive">{stepErrors.currentCity}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country *</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {filteredCountries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {stepErrors.country && <p className="text-sm text-destructive">{stepErrors.country}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred Work City (optional)</Label>
                  <Input value={preferredWorkCity} onChange={e => setPreferredWorkCity(e.target.value)} placeholder="Same as current city if blank" />
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label>Primary Work Type *</Label>
                  <Select value={primaryWorkType} onValueChange={setPrimaryWorkType}>
                    <SelectTrigger><SelectValue placeholder="Select work type" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stepErrors.primaryWorkType && <p className="text-sm text-destructive">{stepErrors.primaryWorkType}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Secondary Skills (select multiple)</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {POPULAR_SKILLS.map(skill => (
                      <Badge
                        key={skill}
                        variant={secondarySkills.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Experience *</Label>
                    <Select value={experienceRange} onValueChange={setExperienceRange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_RANGES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {stepErrors.experienceRange && <p className="text-sm text-destructive">{stepErrors.experienceRange}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Skill Level *</Label>
                    <Select value={skillLevel} onValueChange={setSkillLevel}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SKILL_LEVELS.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {stepErrors.skillLevel && <p className="text-sm text-destructive">{stepErrors.skillLevel}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Project Types Worked</Label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border rounded-md">
                    {PROJECT_TYPES.map(pt => (
                      <Badge
                        key={pt}
                        variant={projectTypes.includes(pt) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleProjectType(pt)}
                      >
                        {pt}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Video / Certification Upload</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can upload video proof of work or certifications from your profile after onboarding.
                    At least one is recommended for better visibility to employers.
                  </p>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">All fields are optional — you can update these later.</p>

                <div className="space-y-1.5">
                  <Label>Availability</Label>
                  <Select value={availability} onValueChange={setAvailability}>
                    <SelectTrigger><SelectValue placeholder="When can you start?" /></SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_CHOICES.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label className="cursor-pointer">Open to Relocation</Label>
                  <Switch checked={openToRelocation} onCheckedChange={setOpenToRelocation} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Expected Wage Type</Label>
                    <Select value={wageType} onValueChange={setWageType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {WAGE_TYPES.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expected Amount (₹)</Label>
                    <Input type="number" value={wageAmount} onChange={e => setWageAmount(e.target.value)} placeholder="e.g. 800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Preferred Shift</Label>
                    <Select value={preferredShift} onValueChange={setPreferredShift}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SHIFT_PREFERENCES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Work Preference</Label>
                    <Select value={workPreference} onValueChange={setWorkPreference}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {WORK_PREFERENCES.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : step === 2 ? !canProceedStep2 : false}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </div>

        {/* Skip & browse jobs — always available */}
        <p className="text-center mt-3">
          <button
            onClick={() => navigate('/jobs')}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip for now & browse jobs →
          </button>
        </p>
      </div>
    </div>
  );
}
