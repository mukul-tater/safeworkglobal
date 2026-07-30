import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import EmitraLayout from '../components/EmitraLayout';
import PartnerDocUpload from '@/components/partner/PartnerDocUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, User, MapPin,
  Landmark, FileSignature,
} from 'lucide-react';
import { toast } from 'sonner';
import { indianStates } from '@/lib/validations/partner';
import {
  emitraV2BasicSchema,
  emitraV2LocationSchema,
  emitraV2BankSchema,
  emitraV2DocumentsSchema,
} from '../validations/emitraOnboardingV2';
import { getPartnerProfile, savePartnerApplication } from '../services/emitraService';
import { getLspSession } from '@/modules/lsp/services/lspSession';

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Location Details', icon: MapPin },
  { id: 3, title: 'Banking Details', icon: Landmark },
  { id: 4, title: 'Documents & Agreement', icon: FileSignature },
] as const;

type FormData = Record<string, any>;

const DEFAULTS: FormData = {
  center_name: '',
  owner_name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  aadhaar_number: '',
  pan_number: '',
  gst_number: '',
  emitra_id: '',
  csc_id: '',
  shop_name: '',
  address_line1: '',
  address_line2: '',
  village: '',
  panchayat: '',
  city_town: '',
  district: '',
  state: '',
  pincode: '',
  has_internet: false,
  has_computer: false,
  has_printer: false,
  has_webcam: false,
  account_holder: '',
  bank_name: '',
  account_number: '',
  ifsc: '',
  upi_id: '',
  cancelled_cheque_url: '',
  aadhaar_url: '',
  pan_card_url: '',
  emitra_certificate_url: '',
  shop_photo_url: '',
  owner_photo_url: '',
  inside_shop_photo_url: '',
  training_declaration: false,
  accepted_terms: false,
  agree_mea_guidelines: false,
  no_unauthorized_fees: false,
  agree_platform_only: false,
  agree_confidentiality: false,
};

/**
 * New E-Mitra partner onboarding (v2).
 * Replaces EmitraRegisterPage at /emitra/register; legacy kept at /emitra/register-legacy.
 */
export default function EmitraOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, user } = useAuth();
  const lspSession = getLspSession();
  const sourceLspCode = searchParams.get('source_lsp') || lspSession?.code || null;
  const [sourceLspId, setSourceLspId] = useState<string | null>(lspSession?.lspId ?? null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!!user);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>({ ...DEFAULTS });

  const update = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));

  useEffect(() => {
    if (!sourceLspCode || sourceLspId) return;
    (async () => {
      const { data: id } = await (supabase as any).rpc('resolve_active_lsp_id', {
        p_code: sourceLspCode,
      });
      if (id) setSourceLspId(id);
    })();
  }, [sourceLspCode, sourceLspId]);

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
        setData((d) => ({
          ...d,
          ...row,
          owner_name: row.owner_name || d.owner_name || '',
          email: row.email || user.email || d.email || '',
          center_name: row.center_name || d.center_name || '',
          address_line1: (row as any).address_line1 || row.address || d.address_line1 || '',
          city_town: (row as any).city_town || row.village_city || d.city_town || '',
          village: (row as any).village || d.village || '',
          has_internet: row.has_internet ?? false,
          has_computer: row.has_computer ?? false,
          has_printer: row.has_printer ?? false,
          has_webcam: (row as any).has_webcam ?? false,
          training_declaration: (row as any).training_declaration ?? false,
          accepted_terms: row.accepted_terms ?? false,
          agree_mea_guidelines: (row as any).agree_mea_guidelines ?? false,
          no_unauthorized_fees: row.no_unauthorized_fees ?? false,
          agree_platform_only: (row as any).agree_platform_only ?? false,
          agree_confidentiality: (row as any).agree_confidentiality ?? false,
        }));
        if (row.current_step) setStep(Math.min(Math.max(row.current_step, 1), STEPS.length));
      } else {
        const meta = user.user_metadata || {};
        setData((d) => ({
          ...d,
          owner_name: (meta.full_name as string) || (meta.name as string) || d.owner_name || '',
          email: user.email || d.email || '',
        }));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const schemas = [null, emitraV2BasicSchema, emitraV2LocationSchema, emitraV2BankSchema, emitraV2DocumentsSchema] as const;

  const validateStep = (): boolean => {
    setErrors({});
    const schema = schemas[step];
    if (!schema) return true;
    const result = schema.safeParse(data);
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

    const {
      data: { user: newUser },
    } = await supabase.auth.getUser();
    return newUser?.id || null;
  };

  const buildPayload = (overrides: Record<string, unknown> = {}) => {
    const address =
      [data.address_line1, data.address_line2].filter(Boolean).join(', ') || data.address_line1 || null;
    const villageCity = data.city_town || data.village || null;

    return {
      owner_name: data.owner_name,
      mobile: data.mobile,
      whatsapp: data.whatsapp,
      email: data.email?.trim() || null,
      emitra_id: data.emitra_id,
      center_name: data.center_name,
      aadhaar_number: data.aadhaar_number,
      pan_number: data.pan_number,
      gst_number: data.gst_number || null,
      csc_id: data.csc_id || null,
      shop_name: data.shop_name || null,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      village: data.village || null,
      panchayat: data.panchayat || null,
      city_town: data.city_town || null,
      address,
      village_city: villageCity,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      has_internet: !!data.has_internet,
      has_computer: !!data.has_computer,
      has_printer: !!data.has_printer,
      has_webcam: !!data.has_webcam,
      account_holder: data.account_holder,
      bank_name: data.bank_name,
      account_number: data.account_number,
      ifsc: data.ifsc,
      upi_id: data.upi_id || null,
      cancelled_cheque_url: data.cancelled_cheque_url || null,
      aadhaar_url: data.aadhaar_url || null,
      pan_card_url: data.pan_card_url || null,
      emitra_certificate_url: data.emitra_certificate_url || null,
      shop_photo_url: data.shop_photo_url || null,
      owner_photo_url: data.owner_photo_url || null,
      inside_shop_photo_url: data.inside_shop_photo_url || null,
      training_declaration: !!data.training_declaration,
      accepted_terms: !!data.accepted_terms,
      agree_mea_guidelines: !!data.agree_mea_guidelines,
      no_unauthorized_fees: !!data.no_unauthorized_fees,
      agree_platform_only: !!data.agree_platform_only,
      agree_confidentiality: !!data.agree_confidentiality,
      // Keep legacy declaration fields in sync where useful
      no_jobs_promise: !!data.agree_mea_guidelines,
      mobile_verified: true,
      current_step: step,
      ...(sourceLspId ? { source_lsp_id: sourceLspId } : {}),
      ...overrides,
    };
  };

  const persistProgress = async (overrides: Record<string, unknown> = {}) => {
    const uid = user?.id || (await ensureAccount());
    if (!uid) throw new Error('Account not ready. Please try again.');
    await savePartnerApplication(uid, buildPayload(overrides) as any);
    return uid;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await persistProgress({ current_step: Math.min(step + 1, STEPS.length) });
      setStep((s) => Math.min(s + 1, STEPS.length));
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
      title="E-Mitra Partner Onboarding"
      subtitle="Complete your application to start registering workers on SafeWork Global"
    >
      <Card className="overflow-hidden border-border/60">
        <div className="px-5 pt-5 md:px-7 md:pt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <StepIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="text-lg font-semibold font-heading truncate">{STEPS[step - 1].title}</h2>
              </div>
            </div>
            <span className="text-sm font-medium tabular-nums text-muted-foreground shrink-0">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between gap-1 text-[10px] sm:text-xs text-muted-foreground mb-2">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={step === s.id ? 'text-primary font-medium' : step > s.id ? 'text-foreground' : ''}
              >
                {s.title.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 md:px-7 md:py-6 space-y-5">
          {step === 1 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Business Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="E-Mitra / CSC Name" error={errors.center_name} required>
                  <Input value={data.center_name || ''} onChange={(e) => update({ center_name: e.target.value })} />
                </Field>
                <Field label="Owner Full Name" error={errors.owner_name} required>
                  <Input value={data.owner_name || ''} onChange={(e) => update({ owner_name: e.target.value })} />
                </Field>
                <Field label="Mobile Number" error={errors.mobile} required>
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    value={data.mobile || ''}
                    onChange={(e) => update({ mobile: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="WhatsApp Number" error={errors.whatsapp} required>
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    value={data.whatsapp || ''}
                    onChange={(e) => update({ whatsapp: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="Email Address" error={errors.email}>
                  <Input type="email" value={data.email || ''} onChange={(e) => update({ email: e.target.value })} />
                </Field>
                <Field label="Aadhaar Number" error={errors.aadhaar_number} required>
                  <Input
                    inputMode="numeric"
                    maxLength={12}
                    value={data.aadhaar_number || ''}
                    onChange={(e) => update({ aadhaar_number: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="PAN Number" error={errors.pan_number} required>
                  <Input
                    maxLength={10}
                    value={data.pan_number || ''}
                    onChange={(e) => update({ pan_number: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="GST Number (Optional)" error={errors.gst_number}>
                  <Input
                    maxLength={15}
                    value={data.gst_number || ''}
                    onChange={(e) => update({ gst_number: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="E-Mitra ID" error={errors.emitra_id} required>
                  <Input value={data.emitra_id || ''} onChange={(e) => update({ emitra_id: e.target.value })} />
                </Field>
                <Field label="CSC ID (If Applicable)" error={errors.csc_id}>
                  <Input value={data.csc_id || ''} onChange={(e) => update({ csc_id: e.target.value })} />
                </Field>
              </div>
            </section>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Shop Address</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Shop Name" error={errors.shop_name}>
                    <Input value={data.shop_name || ''} onChange={(e) => update({ shop_name: e.target.value })} />
                  </Field>
                  <div className="hidden sm:block" />
                  <Field label="Address Line 1" error={errors.address_line1} required>
                    <Input value={data.address_line1 || ''} onChange={(e) => update({ address_line1: e.target.value })} />
                  </Field>
                  <Field label="Address Line 2" error={errors.address_line2}>
                    <Input value={data.address_line2 || ''} onChange={(e) => update({ address_line2: e.target.value })} />
                  </Field>
                  <Field label="Village" error={errors.village}>
                    <Input value={data.village || ''} onChange={(e) => update({ village: e.target.value })} />
                  </Field>
                  <Field label="Panchayat" error={errors.panchayat}>
                    <Input value={data.panchayat || ''} onChange={(e) => update({ panchayat: e.target.value })} />
                  </Field>
                  <Field label="City / Town" error={errors.city_town}>
                    <Input value={data.city_town || ''} onChange={(e) => update({ city_town: e.target.value })} />
                  </Field>
                  <Field label="District" error={errors.district} required>
                    <Input value={data.district || ''} onChange={(e) => update({ district: e.target.value })} />
                  </Field>
                  <Field label="State" error={errors.state} required>
                    <Select value={data.state || ''} onValueChange={(v) => update({ state: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {indianStates.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="PIN Code" error={errors.pincode} required>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={data.pincode || ''}
                      onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, '') })}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Infrastructure</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
                      { key: 'has_internet', label: 'Internet Available?' },
                      { key: 'has_computer', label: 'Computer' },
                      { key: 'has_printer', label: 'Printer' },
                      { key: 'has_webcam', label: 'Web Camera' },
                    ] as const
                  ).map((q) => (
                    <Field key={q.key} label={q.label}>
                      <RadioGroup
                        value={data[q.key] ? 'yes' : 'no'}
                        onValueChange={(v) => update({ [q.key]: v === 'yes' })}
                        className="flex gap-4"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="yes" /> Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="no" /> No
                        </label>
                      </RadioGroup>
                    </Field>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Account Holder Name" error={errors.account_holder} required>
                  <Input value={data.account_holder || ''} onChange={(e) => update({ account_holder: e.target.value })} />
                </Field>
                <Field label="Bank Name" error={errors.bank_name} required>
                  <Input value={data.bank_name || ''} onChange={(e) => update({ bank_name: e.target.value })} />
                </Field>
                <Field label="Account Number" error={errors.account_number} required>
                  <Input
                    inputMode="numeric"
                    value={data.account_number || ''}
                    onChange={(e) => update({ account_number: e.target.value.replace(/\D/g, '') })}
                  />
                </Field>
                <Field label="IFSC Code" error={errors.ifsc} required>
                  <Input
                    maxLength={11}
                    value={data.ifsc || ''}
                    onChange={(e) => update({ ifsc: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="UPI ID" error={errors.upi_id}>
                  <Input value={data.upi_id || ''} onChange={(e) => update({ upi_id: e.target.value })} />
                </Field>
              </div>
              <div>
                <PartnerDocUpload
                  label="Cancelled Cheque Upload"
                  field="cancelled-cheque"
                  value={data.cancelled_cheque_url}
                  onChange={(v) => update({ cancelled_cheque_url: v || '' })}
                />
                {errors.cancelled_cheque_url && (
                  <p className="text-xs text-destructive mt-1">{errors.cancelled_cheque_url}</p>
                )}
              </div>
            </section>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Mandatory Documents</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <DocField label="Aadhaar" field="aadhaar" value={data.aadhaar_url} error={errors.aadhaar_url}
                    onChange={(v) => update({ aadhaar_url: v || '' })} />
                  <DocField label="PAN" field="pan-card" value={data.pan_card_url} error={errors.pan_card_url}
                    onChange={(v) => update({ pan_card_url: v || '' })} />
                  <DocField label="E-Mitra Certificate" field="emitra-cert" value={data.emitra_certificate_url}
                    error={errors.emitra_certificate_url} onChange={(v) => update({ emitra_certificate_url: v || '' })} />
                  <DocField label="Shop Photo (Front)" field="kiosk-photo" accept="image/*" value={data.shop_photo_url}
                    error={errors.shop_photo_url} onChange={(v) => update({ shop_photo_url: v || '' })} />
                  <DocField label="Owner Photo" field="owner-photo" accept="image/*" value={data.owner_photo_url}
                    error={errors.owner_photo_url} onChange={(v) => update({ owner_photo_url: v || '' })} />
                  <DocField label="Inside Shop Photo" field="inside-shop" accept="image/*" value={data.inside_shop_photo_url}
                    error={errors.inside_shop_photo_url} onChange={(v) => update({ inside_shop_photo_url: v || '' })} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Training Declaration</h3>
                <Decl
                  id="training"
                  checked={!!data.training_declaration}
                  error={errors.training_declaration}
                  onChange={(v) => update({ training_declaration: v })}
                  label="I agree to complete the SafeWork E-Mitra Training before onboarding workers."
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Agreement</h3>
                <div className="space-y-2">
                  <Decl id="terms" checked={!!data.accepted_terms} error={errors.accepted_terms}
                    onChange={(v) => update({ accepted_terms: v })}
                    label="I agree to the SafeWork Partner Terms." />
                  <Decl id="mea" checked={!!data.agree_mea_guidelines} error={errors.agree_mea_guidelines}
                    onChange={(v) => update({ agree_mea_guidelines: v })}
                    label="I agree to follow the Ministry of External Affairs recruitment guidelines." />
                  <Decl id="fees" checked={!!data.no_unauthorized_fees} error={errors.no_unauthorized_fees}
                    onChange={(v) => update({ no_unauthorized_fees: v })}
                    label="I will not charge any unauthorized fees from workers." />
                  <Decl id="platform" checked={!!data.agree_platform_only} error={errors.agree_platform_only}
                    onChange={(v) => update({ agree_platform_only: v })}
                    label="I will only process candidates through the SafeWork platform." />
                  <Decl id="confidential" checked={!!data.agree_confidentiality} error={errors.agree_confidentiality}
                    onChange={(v) => update({ agree_confidentiality: v })}
                    label="I agree to maintain confidentiality of candidate data." />
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 px-5 py-5 md:px-7 border-t border-border bg-muted/20">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length ? (
            <Button type="button" className="h-11" onClick={() => void handleNext()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" className="h-11" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Submit Application
            </Button>
          )}
        </div>
      </Card>
    </EmitraLayout>
  );
}

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DocField({
  label,
  field,
  value,
  error,
  onChange,
  accept,
}: {
  label: string;
  field: string;
  value?: string | null;
  error?: string;
  onChange: (v: string | null) => void;
  accept?: string;
}) {
  return (
    <div>
      <PartnerDocUpload label={label} field={field} accept={accept} value={value} onChange={onChange} />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Decl({
  id,
  label,
  checked,
  error,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  error?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <label
        htmlFor={`decl-${id}`}
        className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <Checkbox
          id={`decl-${id}`}
          className="mt-0.5"
          checked={checked}
          onCheckedChange={(v) => onChange(!!v)}
        />
        <span className="text-sm leading-snug pt-0.5">{label}</span>
      </label>
      {error && <p className="text-xs text-destructive mt-1 ml-10">{error}</p>}
    </div>
  );
}
