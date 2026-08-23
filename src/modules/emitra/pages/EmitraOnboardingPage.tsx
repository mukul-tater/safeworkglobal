import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import FormStepPills, { useMaxReachedStep } from '@/components/FormStepPills';
import PartnerDocUpload, { uploadPartnerDocFile } from '@/components/partner/PartnerDocUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin,
  FileText, FileSignature, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { passwordSignupIssue, sanitizePasswordInput, PASSWORD_HINT } from '@/lib/validations/password';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  useFirebasePhoneOtp,
  WORKER_OTP_RECAPTCHA_BTN_ID,
} from '@/modules/worker-registration/hooks/useFirebasePhoneOtp';
import {
  displayableEmail,
  partnerAuthEmailFromMobile,
} from '@/lib/workerAuthEmail';
import VestaEmitraAgreement from '@/components/partner/VestaEmitraAgreement';
import {
  emitraV2BasicSchema,
  emitraV2DocumentsSchema,
  emitraV2AgreementSchema,
  PARTNER_DECLARATION_ITEMS,
  PARTNER_DECLARATION_TEXT,
} from '../validations/emitraOnboardingV2';
import { getPartnerProfile, savePartnerApplication } from '../services/emitraService';
import { getLspSession } from '@/modules/lsp/services/lspSession';
import SearchSelect from '@/components/SearchSelect';
import { getIndiaStates, getIndiaDistricts, getIndiaCities } from '@/lib/indiaLocations';

const STEPS = [
  { id: 1, title: 'Centre & Owner Details', icon: MapPin },
  { id: 2, title: 'Documents & Declaration', icon: FileText },
  { id: 3, title: 'Agreement & OTP', icon: FileSignature },
] as const;

type FormData = Record<string, any>;

const DEFAULTS: FormData = {
  center_name: '',
  emitra_id: '',
  owner_name: '',
  address_line1: '',
  city_town: '',
  district: '',
  state: '',
  pincode: '',
  google_maps_url: '',
  shop_photo_url: '',
  mobile: '',
  mobile_verified: false,
  whatsapp: '',
  email: '',
  date_of_birth: '',
  aadhaar_number: '',
  pan_number: '',
  aadhaar_url: '',
  address_proof_url: '',
  emitra_certificate_url: '',
  accepted_terms: false,
  no_jobs_promise: false,
  agree_no_misrepresentation: false,
  no_unauthorized_fees: false,
  agree_accurate_info: false,
  agree_not_sub_agent: false,
  agree_partner_agreement: false,
};

/**
 * E-Mitra / CSC partner onboarding.
 * Replaces EmitraRegisterPage at /emitra/register; legacy kept at /emitra/register-legacy.
 */
export default function EmitraOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, user } = useAuth();
  const lspSession = getLspSession();
  const sourceLspCode = searchParams.get('source_lsp') || lspSession?.code || null;
  const [sourceLspId, setSourceLspId] = useState<string | null>(lspSession?.lspId ?? null);
  const firebaseOtp = useFirebasePhoneOtp();
  const [step, setStep] = useState(1);
  const maxReached = useMaxReachedStep(step);
  const [loading, setLoading] = useState(!!user);
  const [saving, setSaving] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [agreementOtpStep, setAgreementOtpStep] = useState(false);
  const [agreementOtp, setAgreementOtp] = useState('');
  const [agreementOtpBusy, setAgreementOtpBusy] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>({ ...DEFAULTS });
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [pendingShopPhoto, setPendingShopPhoto] = useState<File | null>(null);
  const profileHydratedFor = useRef<string | null>(null);

  const update = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));

  const allDeclarationsChecked = PARTNER_DECLARATION_ITEMS.every((item) => !!data[item.key]);

  const agreeAllDeclarations = () => {
    update(Object.fromEntries(PARTNER_DECLARATION_ITEMS.map((item) => [item.key, true])));
    setErrors((e) => {
      const nextErrors = { ...e };
      for (const item of PARTNER_DECLARATION_ITEMS) delete nextErrors[item.key];
      return nextErrors;
    });
  };

  const setMobile = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (agreementAccepted || otpStep || agreementOtpStep || mobileVerified) {
      setAgreementAccepted(false);
      setMobileVerified(false);
      setOtpStep(false);
      setOtp('');
      setAgreementOtpStep(false);
      setAgreementOtp('');
      firebaseOtp.resetRecaptcha();
    }
    update({
      mobile: digits,
      whatsapp: digits,
      mobile_verified: false,
    });
  };

  const setStateValue = (state: string) => {
    update({ state, district: '', city_town: '' });
  };

  const setDistrictValue = (district: string) => {
    update({ district, city_town: '' });
  };

  useEffect(() => {
    if (!otpStep && !agreementOtpStep) return;
    firebaseOtp.clearVerifierOnly();
    firebaseOtp.dismissRecaptchaWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when entering an OTP step
  }, [otpStep, agreementOtpStep]);

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
    if (profileHydratedFor.current === user.id) return;
    profileHydratedFor.current = user.id;
    (async () => {
      const row = await getPartnerProfile(user.id);
      if (row) {
        if (row.submitted_at) {
          navigate('/emitra/dashboard', { replace: true });
          return;
        }
        const mobile = row.mobile || '';
        setData((d) => ({
          ...d,
          owner_name: row.owner_name || d.owner_name || '',
          email: displayableEmail(row.email) || displayableEmail(user.email) || d.email || '',
          center_name: row.center_name || row.shop_name || d.center_name || '',
          emitra_id: row.emitra_id || row.csc_id || d.emitra_id || '',
          address_line1: (row as any).address_line1 || row.address || d.address_line1 || '',
          city_town: (row as any).city_town || row.village_city || (row as any).village || d.city_town || '',
          district: row.district || d.district || '',
          state: row.state || d.state || '',
          pincode: row.pincode || d.pincode || '',
          date_of_birth: String((row as any).date_of_birth || '').slice(0, 10) || d.date_of_birth || '',
          google_maps_url: (row as any).google_maps_url || d.google_maps_url || '',
          shop_photo_url: row.shop_photo_url || d.shop_photo_url || '',
          aadhaar_number: row.aadhaar_number || '',
          pan_number: row.pan_number || '',
          aadhaar_url: (row as any).aadhaar_url || d.aadhaar_url || '',
          address_proof_url: row.address_proof_url || '',
          emitra_certificate_url: row.emitra_certificate_url || d.emitra_certificate_url || '',
          accepted_terms: row.accepted_terms ?? false,
          no_jobs_promise: row.no_jobs_promise ?? false,
          agree_no_misrepresentation: (row as any).agree_no_misrepresentation ?? false,
          no_unauthorized_fees: row.no_unauthorized_fees ?? false,
          agree_accurate_info: (row as any).agree_accurate_info ?? false,
          agree_not_sub_agent: (row as any).agree_not_sub_agent ?? false,
          mobile,
          whatsapp: mobile,
          mobile_verified: !!row.mobile_verified,
        }));
        if (row.current_step) setStep(Math.min(Math.max(row.current_step, 1), STEPS.length));
        if (row.mobile_verified) setMobileVerified(true);
        if (row.agreement_accepted_via_otp) setAgreementAccepted(true);
      } else {
        const meta = user.user_metadata || {};
        setData((d) => ({
          ...d,
          owner_name: (meta.full_name as string) || (meta.name as string) || d.owner_name || '',
          email: displayableEmail(user.email) || d.email || '',
        }));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const schemas = [null, emitraV2BasicSchema, emitraV2DocumentsSchema, emitraV2AgreementSchema] as const;

  const validateStep = (): boolean => {
    setErrors({});
    const schema = schemas[step];
    if (!schema) return true;
    const payload =
      step === 1
        ? {
            ...data,
            shop_photo_url: data.shop_photo_url || (pendingShopPhoto ? 'pending' : ''),
            mobile_verified: mobileVerified,
            whatsapp: data.mobile,
          }
        : data;
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
    if (step === 1 && !user) {
      const passwordIssue = passwordSignupIssue(accountPassword);
      if (passwordIssue) {
        setErrors((e) => ({ ...e, password: passwordIssue }));
        toast.error(passwordIssue);
        return false;
      }
      if (accountPassword !== accountPasswordConfirm) {
        setErrors((e) => ({ ...e, password_confirm: 'Passwords do not match' }));
        toast.error('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const requestMobileOtp = async () => {
    const digits = (data.mobile || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setErrors((e) => ({ ...e, mobile: 'Enter a valid 10-digit mobile' }));
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!firebaseOtp.isAvailable) {
      toast.error('SMS verification is not available right now. Please contact support.');
      return;
    }
    setOtpBusy(true);
    try {
      await firebaseOtp.sendOtp(digits);
      setOtpStep(true);
      setOtp('');
      toast.success(`Verification code sent to +91 ${digits}`);
    } catch (err) {
      firebaseOtp.resetRecaptcha();
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmMobileOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit SMS code');
      return;
    }
    setOtpBusy(true);
    try {
      await firebaseOtp.verifyOtp(otp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
      setMobileVerified(true);
      update({ mobile_verified: true, whatsapp: data.mobile });
      setOtpStep(false);
      setOtp('');
      toast.success('Mobile verified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setOtpBusy(false);
    }
  };

  const requestOtp = async () => {
    if (!data.agree_partner_agreement) {
      setErrors((e) => ({ ...e, agree_partner_agreement: 'You must agree to the Partner Agreement' }));
      toast.error('Please agree to the Partner Agreement first');
      return;
    }
    if (!(data.owner_name || '').trim()) {
      setErrors((e) => ({ ...e, owner_name: 'Partner name is required' }));
      toast.error('Enter the partner name');
      return;
    }
    const digits = (data.mobile || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setErrors((e) => ({ ...e, mobile: 'Enter a valid 10-digit mobile' }));
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!firebaseOtp.isAvailable) {
      toast.error('SMS verification is not available right now. Please contact support.');
      return;
    }
    setAgreementOtpBusy(true);
    try {
      await firebaseOtp.sendOtp(digits);
      setAgreementOtpStep(true);
      setAgreementOtp('');
      toast.success(`Agreement OTP sent to +91 ${digits}`);
    } catch (err) {
      firebaseOtp.resetRecaptcha();
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setAgreementOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (agreementOtp.length !== 6) {
      toast.error('Enter the 6-digit SMS code');
      return;
    }
    setAgreementOtpBusy(true);
    try {
      await firebaseOtp.verifyOtp(agreementOtp);
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
      setAgreementAccepted(true);
      setAgreementOtpStep(false);
      setAgreementOtp('');
      toast.success('Agreement accepted via OTP');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setAgreementOtpBusy(false);
    }
  };

  const ensureAccount = async (): Promise<string | null> => {
    if (user) return user.id;
    if (!mobileVerified) {
      toast.error('Verify your mobile number with SMS OTP first');
      return null;
    }
    const passwordIssue = passwordSignupIssue(accountPassword);
    if (passwordIssue) {
      toast.error(passwordIssue);
      return null;
    }
    if (accountPassword !== accountPasswordConfirm) {
      toast.error('Passwords do not match');
      return null;
    }
    const digits = (data.mobile || '').replace(/\D/g, '');
    const realEmail = displayableEmail(data.email);
    const authEmail = realEmail || partnerAuthEmailFromMobile(digits);

    const result = await signup({
      email: authEmail,
      password: accountPassword,
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
    if (newUser?.id) profileHydratedFor.current = newUser.id;
    return newUser?.id || null;
  };

  const buildPayload = (overrides: Record<string, unknown> = {}) => {
    const address = data.address_line1 || null;
    const villageCity = data.city_town || null;
    const digits = (data.mobile || '').replace(/\D/g, '');

    return {
      owner_name: data.owner_name,
      mobile: data.mobile,
      whatsapp: digits || null,
      email: displayableEmail(data.email),
      date_of_birth: data.date_of_birth || null,
      emitra_id: data.emitra_id,
      csc_id: data.emitra_id || null,
      center_name: data.center_name,
      shop_name: data.center_name || null,
      pan_number: data.pan_number || null,
      aadhaar_number: data.aadhaar_number || null,
      address_line1: data.address_line1,
      city_town: data.city_town || null,
      village: data.city_town || null,
      address,
      village_city: villageCity,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      google_maps_url: data.google_maps_url || null,
      shop_photo_url: data.shop_photo_url || null,
      aadhaar_url: data.aadhaar_url || null,
      address_proof_url: data.address_proof_url || null,
      emitra_certificate_url: data.emitra_certificate_url || null,
      accepted_terms: !!data.accepted_terms,
      no_jobs_promise: !!data.no_jobs_promise,
      agree_no_misrepresentation: !!data.agree_no_misrepresentation,
      no_unauthorized_fees: !!data.no_unauthorized_fees,
      agree_accurate_info: !!data.agree_accurate_info,
      agree_not_sub_agent: !!data.agree_not_sub_agent,
      mobile_verified: mobileVerified,
      ...(agreementAccepted
        ? {
            agreement_accepted_via_otp: true,
            agreement_accepted_at: new Date().toISOString(),
          }
        : {}),
      current_step: step,
      ...(sourceLspId ? { source_lsp_id: sourceLspId } : {}),
      ...overrides,
    };
  };

  const persistProgress = async (overrides: Record<string, unknown> = {}) => {
    const uid = user?.id || (await ensureAccount());
    if (!uid) throw new Error('Account not ready. Please try again.');
    let shopPhotoUrl = data.shop_photo_url as string;
    if (pendingShopPhoto) {
      shopPhotoUrl = await uploadPartnerDocFile(uid, 'kiosk-photo', pendingShopPhoto);
      setPendingShopPhoto(null);
      update({ shop_photo_url: shopPhotoUrl });
    }
    await savePartnerApplication(uid, buildPayload({ shop_photo_url: shopPhotoUrl, ...overrides }) as any);
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
    if (!agreementAccepted || !mobileVerified) {
      toast.error('Verify the OTP sent to your mobile before completing registration.');
      return;
    }
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
      <AuthSplitLayout audience="partner" activeStep={1} maxWidthClassName="max-w-2xl" centerVertically={false}>
        <p className="py-8 text-center text-sm text-muted-foreground">Loading saved progress…</p>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      audience="partner"
      activeStep={1}
      maxWidthClassName="max-w-2xl"
      centerVertically={false}
      cardClassName="overflow-hidden p-0 sm:p-0"
    >
      <div className="px-5 pt-5 md:px-7 md:pt-6">
          <div className="mb-4">
            <FormStepPills
              current={2}
              total={3}
              maxReachable={2}
              onSelect={(n) => {
                if (n === 1) navigate('/partner/register');
              }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  E-Mitra partner onboarding
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete your application to start registering workers.
                </p>
              </div>
              <Link
                to="/partner/register"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Change type
              </Link>
            </div>
          </div>
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
            {STEPS.map((s) => {
              const canGo = s.id !== step && s.id <= maxReached;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canGo}
                  aria-current={step === s.id ? 'step' : undefined}
                  onClick={() => canGo && setStep(s.id)}
                  className={`${
                    step === s.id ? 'text-primary font-medium' : step > s.id ? 'text-foreground' : ''
                  } disabled:cursor-default ${canGo ? 'hover:text-primary' : ''}`}
                >
                  {s.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-5 md:px-7 md:py-6 space-y-5">
          {step === 1 && (
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Centre Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Centre / Shop Name" error={errors.center_name} required>
                    <Input
                      value={data.center_name || ''}
                      onChange={(e) => update({ center_name: e.target.value })}
                    />
                  </Field>
                  <Field label="E-Mitra ID / CSC ID" error={errors.emitra_id} required>
                    <Input
                      value={data.emitra_id || ''}
                      onChange={(e) => update({ emitra_id: e.target.value })}
                    />
                  </Field>
                  <Field label="Centre Owner / Proprietor Name" error={errors.owner_name} required className="sm:col-span-2">
                    <Input
                      value={data.owner_name || ''}
                      onChange={(e) => update({ owner_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Centre Address" error={errors.address_line1} required className="sm:col-span-2">
                    <Textarea
                      value={data.address_line1 || ''}
                      onChange={(e) => update({ address_line1: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </Field>
                  <Field label="State" error={errors.state} required>
                    <SearchSelect
                      value={data.state || ''}
                      onChange={setStateValue}
                      options={getIndiaStates()}
                      placeholder="Select state"
                      searchPlaceholder="Search state"
                    />
                  </Field>
                  <Field label="District" error={errors.district} required>
                    <SearchSelect
                      value={data.district || ''}
                      onChange={setDistrictValue}
                      options={getIndiaDistricts(data.state || '')}
                      placeholder={data.state ? 'Select district' : 'Select state first'}
                      searchPlaceholder="Search district"
                      disabled={!data.state}
                      emptyText="Select a state first"
                    />
                  </Field>
                  <Field label="Village / Town / City" error={errors.city_town} required>
                    <SearchSelect
                      value={data.city_town || ''}
                      onChange={(v) => update({ city_town: v })}
                      options={getIndiaCities(data.state || '', data.district || '')}
                      placeholder={data.district ? 'Select city / town' : 'Select district first'}
                      searchPlaceholder="Search city / town"
                      disabled={!data.district}
                      emptyText="Select a district first"
                    />
                  </Field>
                  <Field label="PIN Code" error={errors.pincode} required>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={data.pincode || ''}
                      onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, '') })}
                    />
                  </Field>
                  <Field label="Google Maps Location" error={errors.google_maps_url} required className="sm:col-span-2">
                    <Input
                      value={data.google_maps_url || ''}
                      onChange={(e) => update({ google_maps_url: e.target.value })}
                      placeholder="Paste Google Maps link or lat,lng"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Open Google Maps, share your centre location, and paste the link here.
                    </p>
                  </Field>
                  <div className="sm:col-span-2">
                    <PartnerDocUpload
                      label="Centre Photograph"
                      field="kiosk-photo"
                      accept="image/*"
                      required
                      value={data.shop_photo_url}
                      onChange={(v) => update({ shop_photo_url: v || '' })}
                      pendingFile={pendingShopPhoto}
                      onPendingFile={setPendingShopPhoto}
                    />
                    {errors.shop_photo_url && (
                      <p className="text-xs text-destructive mt-1">{errors.shop_photo_url}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Owner Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Date of Birth" error={errors.date_of_birth} required>
                    <Input
                      type="date"
                      value={data.date_of_birth || ''}
                      onChange={(e) => update({ date_of_birth: e.target.value })}
                    />
                  </Field>
                  <Field label="Email" error={errors.email} required>
                    <Input
                      type="email"
                      value={data.email || ''}
                      onChange={(e) => update({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Mobile / WhatsApp Number" error={errors.mobile || errors.mobile_verified} required className="sm:col-span-2">
                    <div className="flex gap-2">
                      <div className="flex flex-1">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                          +91
                        </span>
                        <Input
                          inputMode="numeric"
                          maxLength={10}
                          value={data.mobile || ''}
                          onChange={(e) => setMobile(e.target.value)}
                          disabled={mobileVerified}
                          className="rounded-l-none"
                          placeholder="10-digit Indian mobile"
                        />
                      </div>
                      {mobileVerified ? (
                        <BadgeVerified />
                      ) : (
                        <Button
                          id={otpStep ? undefined : WORKER_OTP_RECAPTCHA_BTN_ID}
                          type="button"
                          variant="secondary"
                          className="h-10 shrink-0 px-4"
                          onClick={() => void requestMobileOtp()}
                          disabled={otpBusy || otpStep}
                        >
                          {otpBusy && !otpStep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This number is used for WhatsApp and SMS OTP verification.
                    </p>
                    {!firebaseOtp.isAvailable && (
                      <p className="text-xs text-amber-600 mt-1">
                        SMS verification is temporarily unavailable. Please try again later or contact support.
                      </p>
                    )}
                  </Field>
                  {otpStep && !mobileVerified && (
                    <div className="sm:col-span-2 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Enter SMS OTP sent to +91 {data.mobile}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        <Button
                          type="button"
                          size="sm"
                          className="h-10"
                          onClick={() => void confirmMobileOtp()}
                          disabled={otpBusy || otp.length !== 6}
                        >
                          {otpBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Verify OTP
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Didn&apos;t get the code?{' '}
                        <button
                          id={WORKER_OTP_RECAPTCHA_BTN_ID}
                          type="button"
                          className="text-primary font-medium hover:underline disabled:opacity-50"
                          onClick={() => void requestMobileOtp()}
                          disabled={otpBusy}
                        >
                          Resend SMS
                        </button>
                        {' · '}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                          onClick={() => {
                            setOtpStep(false);
                            setOtp('');
                            firebaseOtp.resetRecaptcha();
                          }}
                        >
                          Change number
                        </button>
                      </p>
                    </div>
                  )}
                  {!user && (
                    <>
                      <Field label="Account password" error={errors.password} required>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(sanitizePasswordInput(e.target.value))}
                          placeholder={PASSWORD_HINT}
                        />
                      </Field>
                      <Field label="Confirm password" error={errors.password_confirm} required>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          value={accountPasswordConfirm}
                          onChange={(e) => setAccountPasswordConfirm(sanitizePasswordInput(e.target.value))}
                          placeholder="Re-enter password"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Identity</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Aadhaar / Government ID" error={errors.aadhaar_number}>
                    <Input
                      inputMode="numeric"
                      maxLength={12}
                      value={data.aadhaar_number || ''}
                      onChange={(e) => update({ aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      placeholder="12-digit Aadhaar, if applicable"
                    />
                  </Field>
                  <Field label="PAN" error={errors.pan_number}>
                    <Input
                      maxLength={10}
                      value={data.pan_number || ''}
                      onChange={(e) => update({ pan_number: e.target.value.toUpperCase() })}
                      placeholder="If applicable"
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Upload</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <DocField
                    label="ID Proof"
                    field="id-proof"
                    value={data.aadhaar_url}
                    error={errors.aadhaar_url}
                    required
                    onChange={(v) => update({ aadhaar_url: v || '' })}
                  />
                  <DocField
                    label="Address Proof"
                    field="address-proof"
                    value={data.address_proof_url}
                    error={errors.address_proof_url}
                    required
                    onChange={(v) => update({ address_proof_url: v || '' })}
                  />
                  <DocField
                    label="E-Mitra / CSC authorization / ID proof"
                    field="emitra-cert"
                    value={data.emitra_certificate_url}
                    error={errors.emitra_certificate_url}
                    required
                    onChange={(v) => update({ emitra_certificate_url: v || '' })}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Partner Declaration</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {PARTNER_DECLARATION_TEXT}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={agreeAllDeclarations}
                    className="shrink-0 h-auto border-primary/40 text-primary hover:bg-primary/10 py-2 px-3"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {allDeclarationsChecked ? 'All terms accepted' : 'Agree to all terms and conditions'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {PARTNER_DECLARATION_ITEMS.map((item) => (
                    <Decl
                      key={item.key}
                      id={item.key}
                      checked={!!data[item.key]}
                      error={errors[item.key]}
                      onChange={(v) => update({ [item.key]: v })}
                      label={item.label}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Partner Agreement</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please review the SafeWork Global E-Mitra/CSC Partner Agreement before accepting.
                  </p>
                </div>
                <VestaEmitraAgreement partnerName={data.owner_name || undefined} />
                <Decl
                  id="agree_partner_agreement"
                  checked={!!data.agree_partner_agreement}
                  error={errors.agree_partner_agreement}
                  onChange={(v) => update({ agree_partner_agreement: v })}
                  label="I have read and agree to the SafeWork Global E-Mitra/CSC Partner Agreement and understand my permitted role and responsibilities."
                />
              </section>

              <section className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Agreement & OTP Acceptance</h3>
                <Field label="Partner Name" error={errors.owner_name} required>
                  <Input
                    value={data.owner_name || ''}
                    onChange={(e) => update({ owner_name: e.target.value })}
                  />
                </Field>
                <Field label="Mobile" error={errors.mobile} required>
                  <div className="flex gap-2">
                    <div className="flex flex-1">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                        +91
                      </span>
                      <Input
                        inputMode="numeric"
                        maxLength={10}
                        value={data.mobile || ''}
                        onChange={(e) => setMobile(e.target.value)}
                        disabled={agreementAccepted}
                        className="rounded-l-none"
                        placeholder="XXXXX XXXXX"
                      />
                    </div>
                    {agreementAccepted ? (
                      <BadgeVerified />
                    ) : (
                      <Button
                        id={agreementOtpStep ? undefined : WORKER_OTP_RECAPTCHA_BTN_ID}
                        type="button"
                        variant="secondary"
                        className="h-10 shrink-0 px-4"
                        onClick={() => void requestOtp()}
                        disabled={agreementOtpBusy || agreementOtpStep}
                      >
                        {agreementOtpBusy && !agreementOtpStep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                      </Button>
                    )}
                  </div>
                </Field>

                {agreementAccepted ? (
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm font-medium text-success">
                      Agreement accepted via OTP on +91 {data.mobile}
                    </span>
                  </div>
                ) : agreementOtpStep ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Enter OTP
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <InputOTP maxLength={6} value={agreementOtp} onChange={setAgreementOtp}>
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <Button
                        type="button"
                        size="sm"
                        className="h-10"
                        onClick={() => void confirmOtp()}
                        disabled={agreementOtpBusy || agreementOtp.length !== 6}
                      >
                        {agreementOtpBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Verify
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Didn&apos;t get the code?{' '}
                      <button
                        id={WORKER_OTP_RECAPTCHA_BTN_ID}
                        type="button"
                        className="text-primary font-medium hover:underline disabled:opacity-50"
                        onClick={() => void requestOtp()}
                        disabled={agreementOtpBusy}
                      >
                        Resend SMS
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                        onClick={() => {
                          setAgreementOtpStep(false);
                          setAgreementOtp('');
                          firebaseOtp.resetRecaptcha();
                        }}
                      >
                        Change number
                      </button>
                    </p>
                  </div>
                ) : null}

                {!firebaseOtp.isAvailable && !agreementAccepted && (
                  <p className="text-xs text-amber-600">
                    SMS verification is temporarily unavailable. Please try again later or contact support.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-5 sm:flex-row sm:justify-between md:px-7">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length ? (
            <Button
              type="button"
              className="h-11 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
              onClick={() => void handleNext()}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
              onClick={() => void handleSubmit()}
              disabled={saving || !agreementAccepted}
            >
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
              Accept & Complete Registration
            </Button>
          )}
        </div>
        <p className="px-5 pb-5 text-center text-sm text-muted-foreground md:px-7">
          Already a partner?{' '}
          <Link to="/emitra/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
    </AuthSplitLayout>
  );
}

function BadgeVerified() {
  return (
    <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 text-xs font-medium text-success shrink-0">
      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
    </span>
  );
}

function Field({
  label,
  error,
  children,
  required,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
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
  required,
}: {
  label: string;
  field: string;
  value?: string | null;
  error?: string;
  onChange: (v: string | null) => void;
  accept?: string;
  required?: boolean;
}) {
  return (
    <div>
      <PartnerDocUpload label={label} field={field} accept={accept} value={value} onChange={onChange} required={required} />
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
