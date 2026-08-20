import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { validateSchema } from "@/lib/validations/common";
import { quickEmployerSignupSchema } from "@/lib/validations/onboarding";
import {
  employerCompanySchema,
  employerContactSchema,
  employerDeclarationsSchema,
  employerPartnershipSchema,
  employerWorkforceSchema,
} from "@/lib/validations/employerRegistration";
import {
  BUSINESS_ACTIVITIES,
  COMMUNICATION_CHANNELS,
  COMPANY_TYPES,
  CONTACT_DESIGNATIONS,
  PARTNERSHIP_SERVICES,
  UAE_EMIRATES,
} from "@/lib/employerTradeSkills";
import GoogleAuthButton from "@/modules/worker-registration/components/GoogleAuthButton";
import SignupJourneyPanel from "@/components/SignupJourneyPanel";
import SEOHead from "@/components/SEOHead";
import EmployerSignupStepper from "@/components/employer/EmployerSignupStepper";
import EmployerDocUpload from "@/components/employer/EmployerDocUpload";
import UaePhoneField from "@/components/employer/UaePhoneField";
import ManpowerRequirementSection from "@/components/employer/ManpowerRequirementSection";
import {
  emptyDraft,
  emptyRequirement,
  loadEmployerRegistration,
  saveEmployerRegistration,
  totalWorkers,
  type EmployerRegistrationDraft,
  type RegistrationSection,
} from "@/services/employerRegistrationService";

type Screen = "account" | "form" | "success";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function SectionIntro({
  title,
  bilingual,
  subtitle,
}: {
  title: string;
  bilingual: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">{title}</h2>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{bilingual}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default function QuickEmployerSignup() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, role, profileLoading } = useAuth();

  const [screen, setScreen] = useState<Screen>("account");
  const [section, setSection] = useState<RegistrationSection>(1);
  const [ready, setReady] = useState(false);
  const bootstrappedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState("");
  const [draft, setDraft] = useState<EmployerRegistrationDraft>(emptyDraft);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const patchDraft = useCallback((patch: Partial<EmployerRegistrationDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (bootstrappedRef.current) {
      if (isAuthenticated && role === "employer") {
        setScreen((s) => (s === "account" ? "form" : s));
      }
      return;
    }
    let cancelled = false;

    const bootstrap = async () => {
      if (isAuthenticated && role === "employer" && user) {
        const loaded = await loadEmployerRegistration(user.id);
        if (cancelled) return;
        setDraft(loaded.draft);
        setFullName(profile?.full_name || loaded.draft.contactFullName);
        setEmail(profile?.email || loaded.draft.businessEmail);
        if (loaded.draft.referenceId) setReferenceId(loaded.draft.referenceId);
        if (loaded.completed) {
          navigate("/employer/dashboard", { replace: true });
          return;
        }
        setScreen("form");
      }
      if (!cancelled) {
        bootstrappedRef.current = true;
        setReady(true);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role, user, profile, profileLoading, navigate]);

  const persistDraft = async (completed: boolean) => {
    const { data: { user: current } } = await supabase.auth.getUser();
    if (!current) {
      toast.error("Please sign in to save your details.");
      navigate("/employer/login");
      throw new Error("Please sign in to save your details.");
    }
    return saveEmployerRegistration(current.id, draft, completed);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validation = validateSchema(quickEmployerSignupSchema, { fullName, email, password });
    if (!validation.success) {
      const message = Object.values(validation.errors)[0];
      setError(message);
      toast.error(message);
      return;
    }
    if (password !== confirmPassword) {
      const message = "Passwords do not match";
      setError(message);
      toast.error(message);
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: validation.data.email.trim(),
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/employer/quick-signup`,
          data: { full_name: validation.data.fullName.trim(), role: "employer" },
        },
      });
      if (signUpError) {
        if (/already registered|already exists/i.test(signUpError.message)) {
          toast.error("This email is already registered. Please sign in instead.");
          navigate("/employer/login");
          return;
        }
        throw signUpError;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        toast.success("Check your email to verify your account");
        navigate("/verify-email");
        return;
      }

      const { data: { user: created } } = await supabase.auth.getUser();
      if (created) {
        const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", created.id).maybeSingle();
        if (roleRow && roleRow.role !== "employer") {
          await supabase.auth.signOut();
          toast.error(`This account is already registered as a ${roleRow.role}. Please log in with the correct role.`);
          navigate("/employer/login");
          return;
        }
        patchDraft({
          contactFullName: fullName.trim(),
          businessEmail: email.trim(),
        });
      }

      toast.success("Account created. Tell us about your company.");
      setScreen("form");
      setSection(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentSection = (): boolean => {
    if (section === 1) {
      const result = validateSchema(employerCompanySchema, {
        companyLegalName: draft.companyLegalName,
        tradeName: draft.tradeName,
        companyType: draft.companyType,
        businessActivity: draft.businessActivity,
        emirate: draft.emirate,
        website: draft.website,
        linkedin: draft.linkedin,
        tradeLicencePath: draft.tradeLicencePath,
        companyProfilePath: draft.companyProfilePath,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return false;
      }
    } else if (section === 2) {
      const result = validateSchema(employerContactSchema, {
        fullName: draft.contactFullName,
        designation: draft.designation,
        uaeMobile: draft.uaeMobile,
        whatsapp: draft.whatsapp,
        businessEmail: draft.businessEmail,
        preferredCommunication: draft.preferredCommunication,
        additionalContact: draft.additionalContact,
      });
      if (!result.success) {
        setStepErrors(result.errors);
        toast.error(Object.values(result.errors)[0]);
        return false;
      }
    } else if (section === 3) {
      const result = validateSchema(employerWorkforceSchema, { requirements: draft.requirements });
      if (!result.success) {
        setStepErrors(result.errors);
        const firstInvalid = result.errors["requirements.0.trade"]
          ? draft.requirements[0]?.id
          : draft.requirements.find((_, i) => Object.keys(result.errors).some((k) => k.startsWith(`requirements.${i}.`)))?.id;
        if (firstInvalid) setEditingRequirementId(firstInvalid);
        toast.error(Object.values(result.errors)[0]);
        return false;
      }
    } else {
      const partner = validateSchema(employerPartnershipSchema, {
        partnershipModel: draft.partnershipModel,
        commercialNotes: draft.commercialNotes,
      });
      const declarations = validateSchema(employerDeclarationsSchema, {
        authorized: draft.declarationAuthorized,
        accurate: draft.declarationAccurate,
        regulations: draft.declarationRegulations,
        contactOk: draft.declarationContactOk,
      });
      const errors = { ...(partner.success ? {} : partner.errors), ...(declarations.success ? {} : declarations.errors) };
      if (!partner.success || !declarations.success) {
        setStepErrors(errors);
        toast.error(Object.values(errors)[0]);
        return false;
      }
    }
    setStepErrors({});
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentSection()) return;
    if (section < 4) {
      setSaving(true);
      try {
        await persistDraft(false);
        const next = (section + 1) as RegistrationSection;
        if (next === 3 && draft.requirements.length === 0) {
          const item = emptyRequirement();
          patchDraft({ requirements: [item] });
          setEditingRequirementId(item.id);
        }
        setSection(next);
      } catch (err) {
        console.error(err);
        toast.error("Could not save this section. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmitRequirement = async () => {
    if (!validateCurrentSection()) return;
    setSaving(true);
    try {
      const ref = await persistDraft(true);
      if (!ref) return;
      setReferenceId(ref);
      setScreen("success");
      toast.success("Requirement submitted successfully");
    } catch (err) {
      console.error("Employer requirement submit error:", err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLater = async () => {
    setSaving(true);
    try {
      await persistDraft(false);
      toast.success("Progress saved. You can continue this requirement anytime.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    const next = emptyRequirement();
    patchDraft({ requirements: [...draft.requirements, next] });
    setEditingRequirementId(next.id);
  };

  const removeRequirement = (id: string) => {
    const next = draft.requirements.filter((item) => item.id !== id);
    patchDraft({ requirements: next });
    if (editingRequirementId === id) setEditingRequirementId(next[0]?.id ?? null);
  };

  const busy = loading || saving;
  const panelStep = screen === "form" ? section - 1 : -1;

  if (profileLoading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-muted/40">
      <SEOHead
        title="Employer Registration | SafeWork Global"
        description="Tell us your manpower requirement. SafeWork Global helps UAE employers source, screen and skill-verify skilled workers from India."
      />
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel audience="employer" activeStep={panelStep} />

        <main
          className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-8 md:px-8 lg:px-12 ${
            screen === "account" ? "justify-start sm:justify-center" : "justify-start py-6 sm:py-8"
          }`}
        >
          <div className={`mx-auto w-full ${screen === "account" ? "max-w-[420px]" : "max-w-[720px]"}`}>
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              {screen === "form" && <EmployerSignupStepper step={section} />}

              {screen === "account" && (
                <div className="mb-5">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                    Create your employer account
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Then tell us your manpower requirement. No government fee — SafeWork commercial terms are agreed with you.
                  </p>
                </div>
              )}

              {screen === "form" && (
                <div className="mb-5 border-b border-border/60 pb-4">
                  <h1 className="font-heading text-xl font-bold leading-snug tracking-tight sm:text-[1.45rem]">
                    Build Your Workforce in India. Grow Your Business in the UAE.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Tell us your manpower requirement. SafeWork Global helps UAE employers source, screen and skill-verify skilled workers from India.
                  </p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    भारत से Skilled Workforce | Skilled Workforce from India
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {screen === "account" && (
                <>
                  <div className="mb-4 space-y-3">
                    <GoogleAuthButton
                      label="Sign up with Google"
                      role="employer"
                      onBeforeOAuth={() => {
                        if (fullName.trim()) sessionStorage.setItem("pending_employer_full_name", fullName.trim());
                      }}
                    />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-3.5" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11"
                        autoComplete="name"
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work email</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-11 pl-10"
                          autoComplete="email"
                          disabled={busy}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 chars"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-11 pl-10 pr-9"
                            autoComplete="new-password"
                            disabled={busy}
                          />
                          <button
                            type="button"
                            data-inline
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-11 pl-10 pr-9"
                            autoComplete="new-password"
                            disabled={busy}
                          />
                          <button
                            type="button"
                            data-inline
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                      disabled={busy}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create account
                    </Button>
                    <p className="pt-1 text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/employer/login" className="font-medium text-primary hover:underline">
                        Sign in
                      </Link>
                    </p>
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="mb-2.5 text-center text-xs text-muted-foreground">Looking for a different portal?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="h-10 text-sm font-medium">
                          <Link to="/worker/login">Worker sign in</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-10 text-sm font-medium">
                          <Link to="/partner/login">Partner sign in</Link>
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {screen === "form" && section === 1 && (
                <div className="space-y-3.5">
                  <SectionIntro
                    title="1. Company Information"
                    bilingual="Company Information | कंपनी की जानकारी"
                    subtitle="Tell us about your company."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="legalName">Company Legal Name *</Label>
                      <Input
                        id="legalName"
                        className="h-11"
                        value={draft.companyLegalName}
                        disabled={busy}
                        onChange={(e) => patchDraft({ companyLegalName: e.target.value })}
                        placeholder="As on trade licence"
                      />
                      <FieldError message={stepErrors.companyLegalName} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tradeName">Trade / Commercial Name</Label>
                      <Input
                        id="tradeName"
                        className="h-11"
                        value={draft.tradeName}
                        disabled={busy}
                        onChange={(e) => patchDraft({ tradeName: e.target.value })}
                        placeholder="If different"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company Type *</Label>
                      <Select value={draft.companyType} onValueChange={(v) => patchDraft({ companyType: v })} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_TYPES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.companyType} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Business Activity *</Label>
                      <Select value={draft.businessActivity} onValueChange={(v) => patchDraft({ businessActivity: v })} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_ACTIVITIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.businessActivity} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Emirate *</Label>
                      <Select value={draft.emirate} onValueChange={(v) => patchDraft({ emirate: v })} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {UAE_EMIRATES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.emirate} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="website">Company Website</Label>
                      <Input
                        id="website"
                        className="h-11"
                        value={draft.website}
                        disabled={busy}
                        onChange={(e) => patchDraft({ website: e.target.value })}
                        placeholder="https://"
                      />
                      <FieldError message={stepErrors.website} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="linkedin">Company LinkedIn</Label>
                      <Input
                        id="linkedin"
                        className="h-11"
                        value={draft.linkedin}
                        disabled={busy}
                        onChange={(e) => patchDraft({ linkedin: e.target.value })}
                        placeholder="linkedin.com/company/…"
                      />
                      <FieldError message={stepErrors.linkedin} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EmployerDocUpload
                      label="Trade / Commercial Licence"
                      field="trade-licence"
                      required
                      value={draft.tradeLicencePath}
                      disabled={busy}
                      error={stepErrors.tradeLicencePath}
                      onChange={(path) => patchDraft({ tradeLicencePath: path || "" })}
                    />
                    <EmployerDocUpload
                      label="Company Profile / Presentation (Optional)"
                      field="company-profile"
                      accept="application/pdf"
                      value={draft.companyProfilePath}
                      disabled={busy}
                      onChange={(path) => patchDraft({ companyProfilePath: path || "" })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your company information is used for employer verification and recruitment coordination.
                  </p>
                </div>
              )}

              {screen === "form" && section === 2 && (
                <div className="space-y-3.5">
                  <SectionIntro
                    title="2. Authorized Contact Person"
                    bilingual="Authorized Contact | अधिकृत संपर्क"
                    subtitle="Who should our employer team coordinate with?"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="contactName">Full Name *</Label>
                      <Input
                        id="contactName"
                        className="h-11"
                        value={draft.contactFullName}
                        disabled={busy}
                        onChange={(e) => patchDraft({ contactFullName: e.target.value })}
                      />
                      <FieldError message={stepErrors.fullName} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Designation *</Label>
                      <Select value={draft.designation} onValueChange={(v) => patchDraft({ designation: v })} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_DESIGNATIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.designation} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="uaeMobile">UAE Mobile Number *</Label>
                      <UaePhoneField id="uaeMobile" value={draft.uaeMobile} disabled={busy} onChange={(v) => patchDraft({ uaeMobile: v })} />
                      <FieldError message={stepErrors.uaeMobile} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <UaePhoneField id="whatsapp" value={draft.whatsapp} disabled={busy} onChange={(v) => patchDraft({ whatsapp: v })} />
                      <FieldError message={stepErrors.whatsapp} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="businessEmail">Business Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        className="h-11"
                        value={draft.businessEmail}
                        disabled={busy}
                        onChange={(e) => patchDraft({ businessEmail: e.target.value })}
                        placeholder="name@company.ae"
                      />
                      <FieldError message={stepErrors.businessEmail} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Preferred Communication *</Label>
                      <RadioGroup
                        value={draft.preferredCommunication}
                        onValueChange={(v) => patchDraft({ preferredCommunication: v })}
                        className="flex flex-wrap gap-4 pt-1"
                        disabled={busy}
                      >
                        {COMMUNICATION_CHANNELS.map((channel) => (
                          <div key={channel} className="flex items-center gap-2">
                            <RadioGroupItem value={channel} id={`comm-${channel}`} />
                            <Label htmlFor={`comm-${channel}`} className="font-normal">
                              {channel}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <FieldError message={stepErrors.preferredCommunication} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="additionalContact">Additional Contact Number</Label>
                      <UaePhoneField
                        id="additionalContact"
                        value={draft.additionalContact}
                        disabled={busy}
                        onChange={(v) => patchDraft({ additionalContact: v })}
                      />
                      <FieldError message={stepErrors.additionalContact} />
                    </div>
                  </div>
                </div>
              )}

              {screen === "form" && section === 3 && (
                <div className="space-y-3.5">
                  <SectionIntro
                    title="3. Manpower Requirement"
                    bilingual="Manpower Requirement | Manpower की आवश्यकता"
                    subtitle="Tell us what workforce you need."
                  />
                  <ManpowerRequirementSection
                    requirements={draft.requirements}
                    editingId={editingRequirementId}
                    errors={stepErrors}
                    disabled={busy}
                    onChange={(requirements) => patchDraft({ requirements })}
                    onEditingIdChange={setEditingRequirementId}
                    onAdd={addRequirement}
                    onRemove={removeRequirement}
                  />
                </div>
              )}

              {screen === "form" && section === 4 && (
                <div className="space-y-5">
                  <SectionIntro
                    title="4. SafeWork Partnership Model"
                    bilingual="Partnership Model | साझेदारी मॉडल"
                    subtitle="Simple, performance-aligned workforce support for UAE employers."
                  />

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      SafeWork Employer Model
                    </p>
                    <p className="mt-3 font-heading text-5xl font-bold tracking-tight text-foreground">1%</p>
                    <p className="mt-1 text-base font-semibold">of monthly gross salary</p>
                    <p className="text-sm text-muted-foreground">for the duration of employment</p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">SafeWork Commercial Model</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {PARTNERSHIP_SERVICES.map((service) => (
                        <li key={service} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {service}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Final commercial terms will be agreed between SafeWork Global and the employer.
                    </p>
                  </div>

                  <RadioGroup
                    value={draft.partnershipModel}
                    onValueChange={(v) => patchDraft({ partnershipModel: v })}
                    className="space-y-2"
                    disabled={busy}
                  >
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
                      <RadioGroupItem value="percent_1" id="model-1" className="mt-0.5" />
                      <span className="text-sm font-medium">I would like to proceed with the 1% SafeWork model</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
                      <RadioGroupItem value="custom" id="model-custom" className="mt-0.5" />
                      <span className="text-sm font-medium">I would like to discuss customized commercial terms</span>
                    </label>
                  </RadioGroup>
                  <FieldError message={stepErrors.partnershipModel} />

                  <div className="space-y-1.5">
                    <Label htmlFor="commercialNotes">Additional commercial requirements</Label>
                    <Textarea
                      id="commercialNotes"
                      rows={3}
                      value={draft.commercialNotes}
                      disabled={busy}
                      onChange={(e) => patchDraft({ commercialNotes: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/70 p-4">
                    <p className="text-sm font-semibold">Employer declaration</p>
                    {[
                      {
                        key: "declarationAuthorized" as const,
                        errorKey: "authorized",
                        label: "I confirm that I am authorized to submit this manpower requirement on behalf of the company.",
                      },
                      {
                        key: "declarationAccurate" as const,
                        errorKey: "accurate",
                        label: "I confirm that the information provided is accurate to the best of my knowledge.",
                      },
                      {
                        key: "declarationRegulations" as const,
                        errorKey: "regulations",
                        label:
                          "I understand that candidate selection and deployment are subject to employer requirements and applicable UAE and recruitment regulations.",
                      },
                      {
                        key: "declarationContactOk" as const,
                        errorKey: "contactOk",
                        label: "I agree to be contacted by SafeWork Global regarding this manpower requirement.",
                      },
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-3 text-sm leading-snug">
                        <Checkbox
                          checked={draft[item.key]}
                          disabled={busy}
                          onCheckedChange={(checked) => patchDraft({ [item.key]: checked === true })}
                          className="mt-0.5"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                    <FieldError
                      message={
                        stepErrors.authorized ||
                        stepErrors.accurate ||
                        stepErrors.regulations ||
                        stepErrors.contactOk
                      }
                    />
                  </div>

                  <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
                      <p className="font-medium">{draft.companyLegalName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                      <p className="font-medium">{draft.contactFullName || "—"}</p>
                      <p className="text-muted-foreground">{draft.businessEmail}</p>
                      <p className="text-muted-foreground">{draft.uaeMobile ? `+971 ${draft.uaeMobile.replace(/^\+971/, "")}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Manpower requirement</p>
                      <p className="font-medium">{draft.requirements.length} {draft.requirements.length === 1 ? "role" : "roles"}</p>
                      <p className="text-muted-foreground">{totalWorkers(draft.requirements)} total workers</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Commercial model</p>
                      <p className="font-medium">
                        {draft.partnershipModel === "custom" ? "Customized terms" : draft.partnershipModel === "percent_1" ? "1% Employer Model" : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {screen === "form" && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {section > 1 ? (
                    <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => setSection((s) => (s - 1) as RegistrationSection)}>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => void handleSaveLater()}>
                      Save & Continue Later
                    </Button>
                    {section < 4 ? (
                      <Button
                        type="button"
                        className="h-11 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                        disabled={busy}
                        onClick={() => void handleNext()}
                      >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="h-11 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                        disabled={busy}
                        onClick={() => void handleSubmitRequirement()}
                      >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Employer Requirement
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {screen === "success" && (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <h2 className="font-heading text-2xl font-bold tracking-tight">Requirement Submitted Successfully</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Thank you. Our employer team will review your requirement and contact your authorized representative.
                  </p>
                  <p className="mt-4 text-sm font-semibold">
                    Reference ID: <span className="font-mono tracking-wide">{referenceId}</span>
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button asChild className="h-11">
                      <Link to="/employer/requirement">View Requirement</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11">
                      <Link to="/">Back to SafeWork Global</Link>
                    </Button>
                  </div>
                  <p className="mt-4">
                    <Link to="/employer/dashboard" className="text-sm text-primary hover:underline">
                      Go to employer dashboard
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
