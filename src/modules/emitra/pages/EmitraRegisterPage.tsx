import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import EmitraLayout from '../components/EmitraLayout';
import PartnerDocUpload from '@/components/partner/PartnerDocUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, User, Store, MapPin,
  Landmark, FileSignature, Shield, SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import { indianStates } from '@/lib/validations/partner';
import { WORKER_SKILLS } from '../config/constants';
import {
  emitraPersonalSchema, emitraDetailsSchema, emitraLocationSchema,
  emitraBankSchema, emitraDocumentsSchema, emitraDeclarationsSchema,
} from '../validations/emitra';
import { getPartnerProfile, savePartnerApplication } from '../services/emitraService';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'E-Mitra Details', icon: Store },
  { id: 3, title: 'Location', icon: MapPin },
  { id: 4, title: 'Banking', icon: Landmark },
  { id: 5, title: 'Documents', icon: Shield },
  { id: 6, title: 'Declaration', icon: FileSignature },
] as const;

type FormData = Record<string, any>;

export default function EmitraRegisterPage() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!!user);
  const [saving, setSaving] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skippedOptional, setSkippedOptional] = useState(false);
  const [data, setData] = useState<FormData>({
    worker_categories: [],
    has_computer: false,
    has_scanner: false,
    has_printer: false,
    has_internet: false,
    accepted_terms: false,
    no_jobs_promise: false,
    no_unauthorized_fees: false,
    mobile_verified: false,
  });

  const update = (patch: Partial<FormData>) => setData(d => ({ ...d, ...patch }));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const row = await getPartnerProfile(user.id);
      if (row) {
        if (row.submitted_at) {
          navigate('/emitra/dashboard', { replace: true });
          return;
        }
        setData(d => ({
          ...d,
          ...row,
          owner_name: row.owner_name || d.owner_name || '',
          email: row.email || user.email || d.email || '',
          worker_categories: row.worker_categories || [],
          has_computer: row.has_computer ?? false,
          has_scanner: row.has_scanner ?? false,
          has_printer: row.has_printer ?? false,
          has_internet: row.has_internet ?? false,
          accepted_terms: row.accepted_terms ?? false,
          no_jobs_promise: row.no_jobs_promise ?? false,
          no_unauthorized_fees: row.no_unauthorized_fees ?? false,
        }));
        if (row.current_step) setStep(Math.min(Math.max(row.current_step, 1), STEPS.length));
        if (row.mobile_verified) setMobileVerified(true);
      } else {
        const meta = user.user_metadata || {};
        setData(d => ({
          ...d,
          owner_name:
            (meta.full_name as string) ||
            (meta.name as string) ||
            d.owner_name ||
            '',
          email: user.email || d.email || '',
        }));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const validateStep = (): boolean => {
    setErrors({});
    const schemas = [
      null,
      emitraPersonalSchema,
      emitraDetailsSchema,
      emitraLocationSchema,
      emitraBankSchema,
      emitraDocumentsSchema,
      emitraDeclarationsSchema,
    ];
    const schema = schemas[step];
    if (!schema) return true;
    const payload = step === STEPS.length ? { ...data, mobile_verified: mobileVerified } : data;
    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error('Please fix the highlighted fields');
      return false;
    }
    return true;
  };

  const requestOtp = () => {
    const digits = (data.mobile || '').replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid mobile number first');
      return;
    }
    toast.success(`OTP sent to ${digits}`, { description: 'Demo: enter any 6 digits' });
    setOtpStep(true);
  };

  const verifyOtp = () => {
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setMobileVerified(true);
    update({ mobile_verified: true });
    setOtpStep(false);
    toast.success('Mobile verified');
  };

  const ensureAccount = async (): Promise<string | null> => {
    if (user) return user.id;
    const digits = (data.mobile || '').replace(/\D/g, '');
    const authEmail = data.email?.trim() || `emitra${digits}@partners.safeworkglobal.app`;
    const password = `SWP-${digits}`;

    const result = await signup({
      email: authEmail,
      password,
      full_name: data.owner_name,
      phone: digits,
      role: 'partner',
    });

    if (!result.success) {
      toast.error(result.error || 'Account creation failed');
      return null;
    }

    const { data: { user: newUser } } = await supabase.auth.getUser();
    return newUser?.id || null;
  };

  const buildPayload = (overrides: Record<string, unknown> = {}) => ({
    owner_name: data.owner_name,
    mobile: data.mobile,
    whatsapp: data.whatsapp,
    email: data.email,
    emitra_id: data.emitra_id,
    center_name: data.center_name,
    years_in_operation: data.years_in_operation,
    address: data.address,
    village_city: data.village_city,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    has_computer: data.has_computer,
    has_scanner: data.has_scanner,
    has_printer: data.has_printer,
    has_internet: data.has_internet,
    worker_categories: data.worker_categories,
    account_holder: data.account_holder,
    account_number: data.account_number,
    ifsc: data.ifsc,
    upi_id: data.upi_id || null,
    pan_number: data.pan_number,
    emitra_certificate_url: data.emitra_certificate_url,
    pan_card_url: data.pan_card_url,
    address_proof_url: data.address_proof_url,
    shop_photo_url: data.shop_photo_url,
    owner_photo_url: data.owner_photo_url,
    accepted_terms: data.accepted_terms,
    no_jobs_promise: data.no_jobs_promise,
    no_unauthorized_fees: data.no_unauthorized_fees,
    mobile_verified: mobileVerified,
    current_step: step,
    ...overrides,
  });

  const persistProgress = async (overrides: Record<string, unknown> = {}) => {
    const uid = user?.id || (await ensureAccount());
    if (!uid) throw new Error('Account not ready. Please verify mobile and try again.');
    await savePartnerApplication(uid, buildPayload(overrides));
    return uid;
  };

  const handleSkip = async () => {
    if (step === 1 && !mobileVerified) {
      toast.error('Please verify your mobile number first');
      return;
    }

    const personalOk = emitraPersonalSchema.safeParse(data);
    if (!personalOk.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of personalOk.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error('Complete personal information before skipping');
      return;
    }

    if (step >= 2) {
      const detailsOk = emitraDetailsSchema.safeParse(data);
      if (!detailsOk.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of detailsOk.error.issues) {
          const k = issue.path[0] as string;
          if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
        }
        setErrors(fieldErrors);
        toast.error('Complete E-Mitra details before skipping');
        return;
      }
    }

    setSaving(true);
    try {
      await persistProgress({ current_step: STEPS.length });
      setSkippedOptional(true);
      setStep(STEPS.length);
      toast.info('Optional steps skipped. Review declarations to submit your application.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !mobileVerified) {
      toast.error('Please verify your mobile number with OTP');
      return;
    }
    if (!validateStep()) return;

    setSaving(true);
    try {
      await persistProgress({ current_step: Math.min(step + 1, STEPS.length) });
      setStep(s => Math.min(s + 1, STEPS.length));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await persistProgress({
        status: 'under_review',
        submitted_at: new Date().toISOString(),
        current_step: STEPS.length,
      });

      toast.success('Application submitted! Our team will review it shortly.');
      navigate('/emitra/login');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const StepIcon = STEPS[step - 1].icon;

  if (loading) {
    return (
      <EmitraLayout maxWidth="3xl" title="Become a SafeWork Partner" subtitle="Loading your application…">
        <Card className="p-8 text-center text-muted-foreground">Loading saved progress…</Card>
      </EmitraLayout>
    );
  }

  return (
    <EmitraLayout
      maxWidth="3xl"
      title="Become a SafeWork Partner"
      subtitle="Apply as an E-Mitra or cyber cafe partner. Complete all steps to submit your application for review."
    >
      <Card className="mb-5 border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm font-medium text-foreground">
              Step {step} of {STEPS.length}
              <span className="text-muted-foreground font-normal"> — {STEPS[step - 1].title}</span>
            </p>
            <span className="text-xs font-medium text-primary tabular-nums">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-muted" />
        </div>
        <div className="px-3 py-4 sm:px-5 overflow-x-auto">
          <div className="flex min-w-[520px] sm:min-w-0 items-start justify-between gap-1">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : active
                            ? 'bg-primary/15 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <p
                      className={`hidden lg:block text-[10px] mt-2 text-center leading-tight max-w-[4.5rem] ${
                        active ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 mt-4 rounded-full ${
                        step > s.id ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="border-border/60 shadow-lg">
        <div className="px-5 py-5 md:px-7 md:py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Step {step} of {STEPS.length}
              </p>
              <h2 className="text-xl font-semibold font-heading">{STEPS[step - 1].title}</h2>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 md:px-7 md:py-7">
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.owner_name} required>
              <Input className="h-11" value={data.owner_name || ''} onChange={e => update({ owner_name: e.target.value })} />
            </Field>
            <Field label="Email" error={errors.email} required>
              <Input className="h-11" type="email" value={data.email || ''} onChange={e => update({ email: e.target.value })} />
            </Field>
            <Field label="Mobile Number" error={errors.mobile} required>
              <div className="flex gap-2">
                <Input className="h-11" inputMode="numeric" maxLength={10} value={data.mobile || ''}
                  onChange={e => update({ mobile: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile" />
                {!mobileVerified ? (
                  <Button type="button" variant="secondary" className="h-11 shrink-0 px-4" onClick={requestOtp} disabled={otpStep}>
                    Verify
                  </Button>
                ) : (
                  <Badge className="self-center shrink-0 h-11 px-3 flex items-center bg-success/10 text-success border-success/20 hover:bg-success/10">
                    Verified
                  </Badge>
                )}
              </div>
            </Field>
            {otpStep && !mobileVerified && (
              <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Enter OTP sent to {data.mobile}</p>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
                </InputOTP>
                <Button type="button" size="sm" onClick={verifyOtp}>Confirm OTP</Button>
              </div>
            )}
            <Field label="WhatsApp Number" error={errors.whatsapp} required>
              <Input className="h-11" inputMode="numeric" maxLength={10} value={data.whatsapp || ''}
                onChange={e => update({ whatsapp: e.target.value.replace(/\D/g, '') })} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="E-Mitra ID" error={errors.emitra_id} required>
                <Input value={data.emitra_id || ''} onChange={e => update({ emitra_id: e.target.value })} />
              </Field>
              <Field label="Kiosk Name" error={errors.center_name} required>
                <Input value={data.center_name || ''} onChange={e => update({ center_name: e.target.value })} />
              </Field>
              <Field label="Years of Operation" error={errors.years_in_operation} required>
                <Input type="number" min={0} value={data.years_in_operation ?? ''}
                  onChange={e => update({ years_in_operation: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
            </div>
            <div>
              <Label className="text-sm font-medium">Worker Categories Available <span className="text-destructive">*</span></Label>
              <div className="grid sm:grid-cols-3 gap-2 mt-2">
                {WORKER_SKILLS.map(skill => {
                  const checked = (data.worker_categories || []).includes(skill);
                  return (
                    <label key={skill} className={`flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer text-sm transition-colors ${checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <Checkbox checked={checked} onCheckedChange={() => {
                        const cur = data.worker_categories || [];
                        update({ worker_categories: checked ? cur.filter((x: string) => x !== skill) : [...cur, skill] });
                      }} />
                      {skill}
                    </label>
                  );
                })}
              </div>
              {errors.worker_categories && <p className="text-xs text-destructive mt-1">{errors.worker_categories}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address} required>
                <Textarea rows={2} value={data.address || ''} onChange={e => update({ address: e.target.value })} />
              </Field>
            </div>
            <Field label="Village / City" error={errors.village_city} required>
              <Input value={data.village_city || ''} onChange={e => update({ village_city: e.target.value })} />
            </Field>
            <Field label="District" error={errors.district} required>
              <Input value={data.district || ''} onChange={e => update({ district: e.target.value })} />
            </Field>
            <Field label="State" error={errors.state} required>
              <Select value={data.state || ''} onValueChange={v => update({ state: v })}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="PIN Code" error={errors.pincode} required>
              <Input inputMode="numeric" maxLength={6} value={data.pincode || ''}
                onChange={e => update({ pincode: e.target.value.replace(/\D/g, '') })} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Account Holder Name" error={errors.account_holder} required>
              <Input value={data.account_holder || ''} onChange={e => update({ account_holder: e.target.value })} />
            </Field>
            <Field label="Account Number" error={errors.account_number} required>
              <Input inputMode="numeric" value={data.account_number || ''}
                onChange={e => update({ account_number: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="IFSC" error={errors.ifsc} required>
              <Input maxLength={11} value={data.ifsc || ''} onChange={e => update({ ifsc: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="UPI ID (optional)" error={errors.upi_id}>
              <Input value={data.upi_id || ''} onChange={e => update({ upi_id: e.target.value })} />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Field label="PAN Number" error={errors.pan_number} required>
              <Input maxLength={10} value={data.pan_number || ''} onChange={e => update({ pan_number: e.target.value.toUpperCase() })} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <PartnerDocUpload label="E-Mitra Certificate" field="emitra-cert" value={data.emitra_certificate_url}
                onChange={v => update({ emitra_certificate_url: v })} />
              <PartnerDocUpload label="PAN Card" field="pan-card" value={data.pan_card_url} onChange={v => update({ pan_card_url: v })} />
              <PartnerDocUpload label="Address Proof" field="address-proof" value={data.address_proof_url}
                onChange={v => update({ address_proof_url: v })} />
              <PartnerDocUpload label="Kiosk Photograph" field="kiosk-photo" accept="image/*" value={data.shop_photo_url}
                onChange={v => update({ shop_photo_url: v })} />
              <PartnerDocUpload label="Owner Photograph" field="owner-photo" accept="image/*" value={data.owner_photo_url}
                onChange={v => update({ owner_photo_url: v })} />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            {skippedOptional && (
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                You skipped location, banking, and documents. You can complete those later — submit now with the details you have provided.
              </p>
            )}
            <div className="space-y-2">
              {[
                { key: 'accepted_terms', label: 'I agree to SafeWork Partner Terms' },
                { key: 'no_jobs_promise', label: 'I will not promise jobs or visas' },
                { key: 'no_unauthorized_fees', label: 'I will not collect unauthorized fees' },
              ].map(item => (
                <div key={item.key}>
                  <label
                    htmlFor={`decl-${item.key}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`decl-${item.key}`}
                      className="mt-0.5"
                      checked={!!data[item.key]}
                      onCheckedChange={v => update({ [item.key]: !!v })}
                    />
                    <span className="text-sm leading-snug pt-0.5">{item.label}</span>
                  </label>
                  {errors[item.key] && <p className="text-xs text-destructive mt-1 ml-10">{errors[item.key]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 px-5 py-5 md:px-7 border-t border-border bg-muted/20">
          <Button type="button" variant="outline" className="h-11" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || saving}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {step >= 2 && step < STEPS.length && (
              <Button type="button" variant="ghost" className="h-11" onClick={handleSkip} disabled={saving}>
                <SkipForward className="h-4 w-4 mr-1" /> Skip optional steps
              </Button>
            )}
            {step < STEPS.length ? (
              <Button type="button" className="h-11 px-6" onClick={handleNext} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" className="h-11 px-6" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </Card>
    </EmitraLayout>
  );
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
