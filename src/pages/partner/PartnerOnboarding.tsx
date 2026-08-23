import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Store, ShieldCheck, Building2, Landmark, FileSignature, SkipForward } from "lucide-react";
import { toast } from "sonner";
import PartnerDocUpload from "@/components/partner/PartnerDocUpload";
import IndiaLocationFields from "@/components/IndiaLocationFields";
import { useMaxReachedStep } from "@/components/FormStepPills";
import {
  businessInfoSchema, identitySchema, businessDetailsSchema, bankSchema, declarationsSchema,
  SERVICE_OPTIONS,
} from "@/lib/validations/partner";

type PartnerRow = Record<string, any>;

const STEPS = [
  { id: 1, title: "Business Information", icon: Store },
  { id: 2, title: "Identity Verification", icon: ShieldCheck },
  { id: 3, title: "Business Details", icon: Building2 },
  { id: 4, title: "Bank Details", icon: Landmark },
  { id: 5, title: "Declarations & Submit", icon: FileSignature },
] as const;

export default function PartnerOnboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const maxReached = useMaxReachedStep(step);
  const [data, setData] = useState<PartnerRow>({
    services_offered: [],
    offers_passport_service: false,
    offers_doc_scanning: false,
    offers_worker_registration: false,
    accepted_terms: false,
    accepted_privacy: false,
    confirmed_accuracy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skippedOptional, setSkippedOptional] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: row } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (row) {
        // If already submitted, send straight to dashboard
        if (row.submitted_at) {
          navigate("/partner/dashboard", { replace: true });
          return;
        }
        setData({
          ...row,
          email: row.email || profile?.email || "",
          owner_name: row.owner_name || profile?.full_name || "",
          mobile: row.mobile || profile?.phone || "",
        });
        setStep(row.current_step || 1);
      } else {
        setData(d => ({ ...d, email: profile?.email || "", owner_name: profile?.full_name || "", mobile: profile?.phone || "" }));
      }
      setLoading(false);
    })();
  }, [user, profile, navigate]);

  const update = (patch: Partial<PartnerRow>) => setData(d => ({ ...d, ...patch }));

  const persist = async (patch: Partial<PartnerRow>) => {
    if (!user) return;
    const { error } = await supabase
      .from("partner_profiles")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    if (error) throw error;
  };

  const validateStep = (): boolean => {
    setErrors({});
    let schema: any = null;
    if (step === 1) schema = businessInfoSchema;
    else if (step === 2) schema = identitySchema;
    else if (step === 3) schema = businessDetailsSchema;
    else if (step === 4) schema = bankSchema;
    else if (step === 5) schema = declarationsSchema;
    if (!schema) return true;
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await persist({ ...data, current_step: Math.min(step + 1, STEPS.length) });
      setStep(s => Math.min(s + 1, STEPS.length));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleSkip = async () => {
    const businessOk = businessInfoSchema.safeParse(data);
    const identityOk = identitySchema.safeParse(data);
    if (!businessOk.success || !identityOk.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of [
        ...(businessOk.success ? [] : businessOk.error.issues),
        ...(identityOk.success ? [] : identityOk.error.issues),
      ]) {
        const k = issue.path[0] as string;
        if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Complete business information and identity verification before skipping");
      return;
    }

    setSaving(true);
    try {
      await persist({ ...data, current_step: STEPS.length });
      setSkippedOptional(true);
      setStep(STEPS.length);
      toast.info("Optional steps skipped. Review declarations to submit your application.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await persist({
        ...data,
        status: "under_review",
        submitted_at: new Date().toISOString(),
        current_step: STEPS.length,
      });
      toast.success("Application submitted! Our team will review it shortly.");
      navigate("/partner/dashboard", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (step / STEPS.length) * 100;
  const StepIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-muted/30 py-6 md:py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <Badge variant="outline" className="mb-2">e-Mitra Partner Registration</Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Become a SafeWork Partner</h1>
          <p className="text-sm text-muted-foreground">Complete all steps to submit your application for approval.</p>
        </div>

        {/* Stepper */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
            <span>Step {step} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map(s => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              const canGo = s.id !== step && s.id <= maxReached;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canGo}
                  aria-current={active ? "step" : undefined}
                  onClick={() => canGo && setStep(s.id)}
                  className="text-center disabled:cursor-default"
                >
                  <div className={`mx-auto h-9 w-9 rounded-full flex items-center justify-center border-2 ${
                    done ? "bg-success border-success text-success-foreground"
                    : active ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted text-muted-foreground"
                  } ${canGo ? "hover:opacity-90" : ""}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <p className={`text-[10px] mt-1 ${active ? "font-medium" : "text-muted-foreground"} hidden sm:block`}>{s.title}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Step content */}
        <Card className="p-5 md:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><StepIcon className="h-5 w-5" /></div>
            <h2 className="text-xl font-semibold">{STEPS[step - 1].title}</h2>
          </div>

          {step === 1 && <BusinessInfoStep data={data} update={update} errors={errors} />}
          {step === 2 && <IdentityStep data={data} update={update} errors={errors} />}
          {step === 3 && <BusinessDetailsStep data={data} update={update} errors={errors} />}
          {step === 4 && <BankStep data={data} update={update} errors={errors} />}
          {step === 5 && <DeclarationsStep data={data} update={update} errors={errors} skippedOptional={skippedOptional} />}

          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-7 pt-5 border-t">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || saving}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              {step >= 2 && step < STEPS.length && (
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={saving}>
                  <SkipForward className="h-4 w-4 mr-1" /> Skip optional steps
                </Button>
              )}
              {step < STEPS.length ? (
                <Button type="button" onClick={handleNext} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Save & Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Step components ---------- */

interface StepProps {
  data: PartnerRow;
  update: (p: Partial<PartnerRow>) => void;
  errors: Record<string, string>;
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

function BusinessInfoStep({ data, update, errors }: StepProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Center Name" error={errors.center_name} required>
        <Input value={data.center_name || ""} onChange={e => update({ center_name: e.target.value })} placeholder="e.g. Sharma Digital Seva Kendra" />
      </Field>
      <Field label="Owner Name" error={errors.owner_name} required>
        <Input value={data.owner_name || ""} onChange={e => update({ owner_name: e.target.value })} />
      </Field>
      <Field label="Mobile Number" error={errors.mobile} required>
        <Input inputMode="numeric" maxLength={10} value={data.mobile || ""} onChange={e => update({ mobile: e.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile" />
      </Field>
      <Field label="WhatsApp Number" error={errors.whatsapp} required>
        <Input inputMode="numeric" maxLength={10} value={data.whatsapp || ""} onChange={e => update({ whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="10-digit WhatsApp" />
      </Field>
      <Field label="Email Address" error={errors.email} required>
        <Input type="email" value={data.email || ""} onChange={e => update({ email: e.target.value })} />
      </Field>
      <IndiaLocationFields
        className="contents"
        showCity={false}
        value={{
          state: data.state || "",
          district: data.district || "",
          city: "",
          pincode: data.pincode || "",
        }}
        onChange={(loc) => update({ state: loc.state, district: loc.district, pincode: loc.pincode })}
        errors={{ state: errors.state, district: errors.district, pincode: errors.pincode }}
      />
      <div className="sm:col-span-2">
        <Field label="Full Address" error={errors.address} required>
          <Textarea rows={3} value={data.address || ""} onChange={e => update({ address: e.target.value })} placeholder="Shop number, street, landmark, city" />
        </Field>
      </div>
    </div>
  );
}

function IdentityStep({ data, update, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Aadhaar Number" error={errors.aadhaar_number} required>
          <Input inputMode="numeric" maxLength={12} value={data.aadhaar_number || ""} onChange={e => update({ aadhaar_number: e.target.value.replace(/\D/g, "") })} placeholder="12 digits" />
        </Field>
        <Field label="PAN Number" error={errors.pan_number} required>
          <Input maxLength={10} value={data.pan_number || ""} onChange={e => update({ pan_number: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <PartnerDocUpload label="Aadhaar Front" field="aadhaar-front" value={data.aadhaar_front_url} onChange={v => update({ aadhaar_front_url: v })} />
        <PartnerDocUpload label="Aadhaar Back" field="aadhaar-back" value={data.aadhaar_back_url} onChange={v => update({ aadhaar_back_url: v })} />
        <PartnerDocUpload label="PAN Card" field="pan-card" value={data.pan_card_url} onChange={v => update({ pan_card_url: v })} />
        <PartnerDocUpload label="Shop Photo" field="shop-photo" accept="image/*" value={data.shop_photo_url} onChange={v => update({ shop_photo_url: v })} />
      </div>
      {(errors.aadhaar_front_url || errors.aadhaar_back_url || errors.pan_card_url || errors.shop_photo_url) && (
        <p className="text-xs text-destructive">All four documents are required.</p>
      )}
    </div>
  );
}

function BusinessDetailsStep({ data, update, errors }: StepProps) {
  const toggleService = (s: string) => {
    const cur: string[] = data.services_offered || [];
    update({ services_offered: cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s] });
  };
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Years In Operation" error={errors.years_in_operation} required>
          <Input type="number" min={0} value={data.years_in_operation ?? ""} onChange={e => update({ years_in_operation: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Monthly Customer Footfall" error={errors.monthly_footfall} required>
          <Input type="number" min={0} value={data.monthly_footfall ?? ""} onChange={e => update({ monthly_footfall: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
      </div>

      <div>
        <Label className="text-sm font-medium">Services Offered <span className="text-destructive">*</span></Label>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          {SERVICE_OPTIONS.map(s => {
            const checked = (data.services_offered || []).includes(s);
            return (
              <label key={s} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/40"}`}>
                <Checkbox checked={checked} onCheckedChange={() => toggleService(s)} />
                <span className="text-sm">{s}</span>
              </label>
            );
          })}
        </div>
        {errors.services_offered && <p className="text-xs text-destructive mt-1">{errors.services_offered}</p>}
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Specialized capabilities</p>
        {[
          { key: "offers_passport_service", label: "Passport application support available" },
          { key: "offers_doc_scanning", label: "Document scanning available" },
          { key: "offers_worker_registration", label: "Can assist with worker registration" },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={!!data[item.key]} onCheckedChange={v => update({ [item.key]: !!v })} />
            <span className="text-sm">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function BankStep({ data, update, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Account Holder Name" error={errors.account_holder} required>
          <Input value={data.account_holder || ""} onChange={e => update({ account_holder: e.target.value })} />
        </Field>
        <Field label="Account Number" error={errors.account_number} required>
          <Input inputMode="numeric" value={data.account_number || ""} onChange={e => update({ account_number: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field label="IFSC Code" error={errors.ifsc} required>
          <Input maxLength={11} value={data.ifsc || ""} onChange={e => update({ ifsc: e.target.value.toUpperCase() })} placeholder="ABCD0123456" />
        </Field>
        <Field label="UPI ID (optional)" error={errors.upi_id}>
          <Input value={data.upi_id || ""} onChange={e => update({ upi_id: e.target.value })} placeholder="name@bank" />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">Bank details are used only for partner incentive payouts. They are encrypted in storage and visible only to admins.</p>
    </div>
  );
}

function DeclarationsStep({ data, update, errors, skippedOptional }: StepProps & { skippedOptional?: boolean }) {
  return (
    <div className="space-y-4">
      {skippedOptional && (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
          You skipped business details and bank information. Submit now with the details you have provided — you can update your profile later.
        </p>
      )}
      <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-2 max-h-48 overflow-y-auto">
        <p className="font-medium">Summary of your application</p>
        <p><span className="text-muted-foreground">Center:</span> {data.center_name || "—"}</p>
        <p><span className="text-muted-foreground">Owner:</span> {data.owner_name || "—"}</p>
        <p><span className="text-muted-foreground">Location:</span> {[data.district, data.state, data.pincode].filter(Boolean).join(", ") || "—"}</p>
        <p><span className="text-muted-foreground">Mobile / WhatsApp:</span> {data.mobile || "—"} / {data.whatsapp || "—"}</p>
        <p><span className="text-muted-foreground">Services:</span> {(data.services_offered || []).join(", ") || "—"}</p>
      </div>

      {[
        { key: "accepted_terms", label: "I have read and accept the SafeWork Partner Terms.", err: errors.accepted_terms },
        { key: "accepted_privacy", label: "I have read and accept the Privacy Policy.", err: errors.accepted_privacy },
        { key: "confirmed_accuracy", label: "I confirm that all information provided is true and accurate.", err: errors.confirmed_accuracy },
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
          {item.err && <p className="text-xs text-destructive mt-1 ml-10">{item.err}</p>}
        </div>
      ))}
    </div>
  );
}