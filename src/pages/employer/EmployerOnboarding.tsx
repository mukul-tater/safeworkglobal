import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, ChevronRight, ChevronLeft, CheckCircle2,
  Building2, Briefcase, Users, ShieldCheck, CreditCard,
} from 'lucide-react';
import {
  JOB_CATEGORIES, POPULAR_SKILLS, DESTINATION_COUNTRIES, NATIONALITIES, WORK_PREFERENCES, WAGE_TYPES,
} from '@/lib/constants';
import AutoSaveStatus from '@/components/profile/AutoSaveStatus';
import { useAutoSave } from '@/hooks/useAutoSave';
import { saveEmployerOnboardingPartial } from '@/lib/autoSaveProfiles';
import { validateSchema } from '@/lib/validations/common';
import {
  employerOnboardingStep1Schema,
  employerOnboardingStep2Schema,
  employerOnboardingStep3Schema,
} from '@/lib/validations/onboarding';

const EMPLOYER_ROLES = ['Owner', 'HR', 'Supervisor', 'Contractor'];
const BUSINESS_TYPES = ['Construction', 'Industrial', 'Contractor', 'Vendor', 'Other'];
const COMPANY_SIZES = ['1-10', '10-50', '50-200', '200+'];
const WORKER_TYPES = ['Helper', 'Skilled', 'Supervisor'];
const ID_TYPES = ['PAN', 'GST', 'Company Registration', 'Aadhaar'];
const PAYMENT_METHODS = ['Bank Transfer', 'UPI', 'Cash'];
const SAFETY_LEVELS = ['Basic', 'Moderate', 'High'];

const STEPS = [
  { id: 1, title: 'Basic Details', icon: Building2 },
  { id: 2, title: 'Business Info', icon: Briefcase },
  { id: 3, title: 'Hiring Needs', icon: Users },
  { id: 4, title: 'Verification', icon: ShieldCheck },
  { id: 5, title: 'Payment & Safety', icon: CreditCard },
];

export default function EmployerOnboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [employerRole, setEmployerRole] = useState('');

  // Step 2
  const [businessType, setBusinessType] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [workLocations, setWorkLocations] = useState<string[]>([]);
  const [officeAddress, setOfficeAddress] = useState('');
  const [officeState, setOfficeState] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [taxInfoNumber, setTaxInfoNumber] = useState('');

  // Step 3
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);
  const [workerTypeNeeded, setWorkerTypeNeeded] = useState('');
  const [workersRequired, setWorkersRequired] = useState('');
  const [jobType, setJobType] = useState('');
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [salaryType, setSalaryType] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');

  // Step 4
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // Step 5
  const [paymentMethod, setPaymentMethod] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [followsSafety, setFollowsSafety] = useState(false);
  const [providesPPE, setProvidesPPE] = useState('');
  const [safetyLevel, setSafetyLevel] = useState('');

  const autoSaveData = useMemo(
    () => ({
      fullName,
      mobile,
      companyName,
      country,
      employerRole,
      businessType,
      companySize,
      workLocations,
      officeAddress,
      officeState,
      cinNumber,
      taxInfoNumber,
      hiringRoles,
      workerTypeNeeded,
      workersRequired,
      jobType,
      preferredCountries,
      expectedStartDate,
      salaryType,
      salaryAmount,
      idType,
      idNumber,
      paymentMethod,
      billingAddress,
      gstNumber,
      followsSafety,
      providesPPE,
      safetyLevel,
    }),
    [
      fullName, mobile, companyName, country, employerRole, businessType, companySize,
      workLocations, officeAddress, officeState, cinNumber, taxInfoNumber, hiringRoles,
      workerTypeNeeded, workersRequired, jobType, preferredCountries, expectedStartDate,
      salaryType, salaryAmount, idType, idNumber, paymentMethod, billingAddress, gstNumber,
      followsSafety, providesPPE, safetyLevel,
    ],
  );

  const handleAutoSave = useCallback(
    async (data: typeof autoSaveData) => {
      if (!user) return;
      await saveEmployerOnboardingPartial(user.id, data);
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
      setFullName(profile.full_name || '');
      setMobile(profile.phone || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        markReady({
          fullName: profile?.full_name || '',
          mobile: profile?.phone || '',
          companyName: '',
          country: '',
          employerRole: '',
          businessType: '',
          companySize: '',
          workLocations: [],
          officeAddress: '',
          officeState: '',
          cinNumber: '',
          taxInfoNumber: '',
          hiringRoles: [],
          workerTypeNeeded: '',
          workersRequired: '',
          jobType: '',
          preferredCountries: [],
          expectedStartDate: '',
          salaryType: '',
          salaryAmount: '',
          idType: '',
          idNumber: '',
          paymentMethod: '',
          billingAddress: '',
          gstNumber: '',
          followsSafety: false,
          providesPPE: '',
          safetyLevel: '',
        });
        return;
      }

      const ep = data as Record<string, unknown>;
      const next = {
        fullName: profile?.full_name || '',
        mobile: profile?.phone || '',
        companyName: (ep.company_name as string) || '',
        country: (ep.country as string) || '',
        employerRole: (ep.employer_role as string) || '',
        businessType: (ep.business_type as string) || '',
        companySize: (ep.company_size as string) || '',
        workLocations: (ep.work_locations as string[]) || [],
        officeAddress: (ep.office_address as string) || '',
        officeState: (ep.office_state as string) || '',
        cinNumber: (ep.cin_number as string) || '',
        taxInfoNumber: (ep.tax_info_number as string) || '',
        hiringRoles: (ep.hiring_roles as string[]) || [],
        workerTypeNeeded: (ep.worker_type_needed as string) || '',
        workersRequired: ep.workers_required != null ? String(ep.workers_required) : '',
        jobType: (ep.job_type as string) || '',
        preferredCountries: (ep.preferred_countries as string[]) || [],
        expectedStartDate: (ep.expected_start_date as string) || '',
        salaryType: (ep.salary_type as string) || '',
        salaryAmount: ep.salary_amount != null ? String(ep.salary_amount) : '',
        idType: (ep.id_type as string) || '',
        idNumber: (ep.id_number as string) || '',
        paymentMethod: (ep.payment_method_preference as string) || '',
        billingAddress: (ep.billing_address as string) || '',
        gstNumber: (ep.gst_number as string) || '',
        followsSafety: Boolean(ep.follows_safety_standards),
        providesPPE: (ep.provides_ppe as string) || '',
        safetyLevel: (ep.site_safety_level as string) || '',
      };

      setCompanyName(next.companyName);
      setCountry(next.country);
      setEmployerRole(next.employerRole);
      setBusinessType(next.businessType);
      setCompanySize(next.companySize);
      setWorkLocations(next.workLocations);
      setOfficeAddress(next.officeAddress);
      setOfficeState(next.officeState);
      setCinNumber(next.cinNumber);
      setTaxInfoNumber(next.taxInfoNumber);
      setHiringRoles(next.hiringRoles);
      setWorkerTypeNeeded(next.workerTypeNeeded);
      setWorkersRequired(next.workersRequired);
      setJobType(next.jobType);
      setPreferredCountries(next.preferredCountries);
      setExpectedStartDate(next.expectedStartDate);
      setSalaryType(next.salaryType);
      setSalaryAmount(next.salaryAmount);
      setIdType(next.idType);
      setIdNumber(next.idNumber);
      setPaymentMethod(next.paymentMethod);
      setBillingAddress(next.billingAddress);
      setGstNumber(next.gstNumber);
      setFollowsSafety(next.followsSafety);
      setProvidesPPE(next.providesPPE);
      setSafetyLevel(next.safetyLevel);
      markReady(next);
    };

    void loadDraft();
  }, [user, profile, markReady]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('employer_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      if ((data as any)?.onboarding_completed) {
        navigate('/employer/dashboard', { replace: true });
      }
    };
    checkOnboarding();
  }, [user, navigate]);

  const toggleHiringRole = (role: string) => {
    setHiringRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleWorkLocation = (loc: string) => {
    setWorkLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const togglePreferredCountry = (c: string) => {
    setPreferredCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const canProceedStep1 = fullName.trim() && mobile.trim() && companyName.trim() && country && employerRole;
  const canProceedStep2 = businessType && companySize;
  const canProceedStep3 = hiringRoles.length > 0 && workerTypeNeeded && workersRequired;

  const handleNext = () => {
    if (step === 1) {
      const result = validateSchema(employerOnboardingStep1Schema, {
        fullName,
        mobile,
        companyName,
        country,
        employerRole,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return;
      }
    } else if (step === 2) {
      const result = validateSchema(employerOnboardingStep2Schema, {
        businessType,
        companySize,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return;
      }
    } else if (step === 3) {
      const result = validateSchema(employerOnboardingStep3Schema, {
        hiringRoles,
        workerTypeNeeded,
        workersRequired,
        expectedStartDate,
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
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: mobile })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      const { error: epErr } = await supabase
        .from('employer_profiles')
        .upsert({
          user_id: user.id,
          company_name: companyName || null,
          country: country || null,
          employer_role: employerRole || null,
          business_type: businessType || null,
          company_size: companySize || null,
          work_locations: workLocations.length > 0 ? workLocations : [],
          office_address: officeAddress || null,
          office_state: officeState || null,
          cin_number: cinNumber || null,
          tax_info_number: taxInfoNumber || null,
          hiring_roles: hiringRoles.length > 0 ? hiringRoles : [],
          worker_type_needed: workerTypeNeeded || null,
          workers_required: workersRequired ? Number(workersRequired) : null,
          job_type: jobType || null,
          preferred_countries: preferredCountries.length > 0 ? preferredCountries : [],
          expected_start_date: expectedStartDate || null,
          salary_type: salaryType || null,
          salary_amount: salaryAmount ? Number(salaryAmount) : null,
          id_type: idType || null,
          id_number: idNumber || null,
          payment_method_preference: paymentMethod || null,
          billing_address: billingAddress || null,
          gst_number: gstNumber || null,
          follows_safety_standards: followsSafety,
          provides_ppe: providesPPE || null,
          site_safety_level: safetyLevel || null,
          onboarding_completed: true,
        } as any, { onConflict: 'user_id' });

      if (epErr) throw epErr;

      toast.success('Onboarding completed! Welcome aboard 🎉');
      navigate('/employer/dashboard', { replace: true });
    } catch (error) {
      console.error('Employer onboarding save error:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const filteredCountries = NATIONALITIES.filter(c => c !== 'All Nationalities');
  const filteredDestCountries = DESTINATION_COUNTRIES.filter(c => c !== 'All Countries');
  const filteredCategories = JOB_CATEGORIES.filter(c => c !== 'All Categories');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Set Up Your Business</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of {STEPS.length} — {STEPS[step - 1].title}
          </p>
          <AutoSaveStatus status={autoSaveStatus} className="justify-center mt-2" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-4">
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
            {/* STEP 1 — Basic Details */}
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
                  <Label>Email (verify later)</Label>
                  <Input value={email} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. ABC Constructions" />
                  {stepErrors.companyName && <p className="text-sm text-destructive">{stepErrors.companyName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Your Role *</Label>
                    <Select value={employerRole} onValueChange={setEmployerRole}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYER_ROLES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 — Business Info */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Business Type *</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company Size *</Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Work Locations (select cities)</Label>
                  <Input
                    placeholder="Type a city and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !workLocations.includes(val)) {
                          setWorkLocations(prev => [...prev, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {workLocations.map(loc => (
                      <Badge key={loc} variant="secondary" className="cursor-pointer" onClick={() => toggleWorkLocation(loc)}>
                        {loc} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Office Address</Label>
                    <Input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Office address" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input value={officeState} onChange={e => setOfficeState(e.target.value)} placeholder="e.g. Maharashtra" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>CIN Number</Label>
                    <Input value={cinNumber} onChange={e => setCinNumber(e.target.value)} placeholder="Company CIN" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tax Info Number</Label>
                    <Input value={taxInfoNumber} onChange={e => setTaxInfoNumber(e.target.value)} placeholder="TAN / TIN" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 3 — Hiring Needs */}
            {step === 3 && (
              <>
                <div className="space-y-1.5">
                  <Label>Hiring for Roles * (select multiple)</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {POPULAR_SKILLS.map(skill => (
                      <Badge
                        key={skill}
                        variant={hiringRoles.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleHiringRole(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Worker Type Needed *</Label>
                    <Select value={workerTypeNeeded} onValueChange={setWorkerTypeNeeded}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {WORKER_TYPES.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Workers Required *</Label>
                    <Input type="number" value={workersRequired} onChange={e => setWorkersRequired(e.target.value)} placeholder="e.g. 10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Job Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {WORK_PREFERENCES.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expected Start Date</Label>
                    <Input type="date" value={expectedStartDate} onChange={e => setExpectedStartDate(e.target.value)} />
                    {stepErrors.expectedStartDate && <p className="text-sm text-destructive">{stepErrors.expectedStartDate}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Preferred Countries (source workers from)</Label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border rounded-md">
                    {filteredDestCountries.slice(0, 20).map(c => (
                      <Badge
                        key={c}
                        variant={preferredCountries.includes(c) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => togglePreferredCountry(c)}
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salary Type</Label>
                    <Select value={salaryType} onValueChange={setSalaryType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {[...WAGE_TYPES, 'On Contract'].map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salary Amount (₹)</Label>
                    <Input type="number" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} placeholder="e.g. 25000" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 4 — Business Verification */}
            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Verified businesses rank higher and build worker trust. You can complete this later.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>ID Number</Label>
                    <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Enter ID number" />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">📄 Document & Logo Upload</p>
                  <p className="text-xs text-muted-foreground">
                    You can upload verification documents and company logo from your profile after onboarding.
                  </p>
                </div>
              </>
            )}

            {/* STEP 5 — Payment & Safety */}
            {step === 5 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">All fields are optional — you can update these later.</p>

                <div className="space-y-1.5">
                  <Label>Payment Method Preference</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Billing Address</Label>
                  <Textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Billing address" rows={2} />
                </div>

                <div className="space-y-1.5">
                  <Label>GST Number (optional)</Label>
                  <Input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Safety Standards
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Employers with safety certifications rank higher and attract more workers.
                  </p>

                  <div className="flex items-center justify-between py-2">
                    <Label className="cursor-pointer">Follows Safety Standards</Label>
                    <Switch checked={followsSafety} onCheckedChange={setFollowsSafety} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Provides PPE</Label>
                      <Select value={providesPPE} onValueChange={setProvidesPPE}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Site Safety Level</Label>
                      <Select value={safetyLevel} onValueChange={setSafetyLevel}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {SAFETY_LEVELS.map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={
                step === 1 ? !canProceedStep1 :
                step === 2 ? !canProceedStep2 :
                step === 3 ? !canProceedStep3 :
                false
              }
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

        {/* Skip entire setup — user can complete details later from profile */}
        <p className="text-center mt-3">
          <button
            onClick={step === STEPS.length ? handleSave : handleNext}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground underline mr-3"
          >
            {step === STEPS.length ? 'Skip & finish' : 'Skip this step'}
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground underline ml-3"
          >
            Skip setup — complete later
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          You can finish your business details anytime from your profile.
        </p>
      </div>
    </div>
  );
}
