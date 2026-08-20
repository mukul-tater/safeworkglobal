import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { validateSchema } from "@/lib/validations/common";
import {
  quickEmployerSignupSchema,
  quickEmployerStep2Schema,
} from "@/lib/validations/onboarding";
import { DESTINATION_COUNTRIES } from "@/lib/constants";
import GoogleAuthButton from "@/modules/worker-registration/components/GoogleAuthButton";
import SignupJourneyPanel from "@/components/SignupJourneyPanel";
import SEOHead from "@/components/SEOHead";

const EMPLOYER_ROLE = "Owner";
const BUSINESS_TYPES = ["Construction", "Industrial", "Contractor", "Vendor", "Other"];
const COMPANY_SIZES = ["1-10", "10-50", "50-200", "200+"];
const FILTERED_COUNTRIES = DESTINATION_COUNTRIES.filter((c) => c !== "All Countries");

type WizardStep = 1 | 2;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function StepDots({ step }: { step: WizardStep }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {([1, 2] as const).map((n) => (
        <span
          key={n}
          className={`h-1.5 w-6 rounded-full ${
            n <= step ? "bg-primary" : "bg-muted-foreground/25"
          }`}
        />
      ))}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        Step {step} of 2
      </span>
    </div>
  );
}

export default function QuickEmployerSignup() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, role, profileLoading } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);
  const [ready, setReady] = useState(false);
  const bootstrappedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [mobile, setMobile] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [workLocations, setWorkLocations] = useState<string[]>([]);
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeState, setOfficeState] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [taxInfoNumber, setTaxInfoNumber] = useState("");

  const autoSavePayload = useMemo(
    () => ({
      fullName,
      mobile,
      companyName,
      country,
      businessType,
      companySize,
      workLocations,
      officeAddress,
      officeState,
      cinNumber,
      taxInfoNumber,
    }),
    [
      fullName,
      mobile,
      companyName,
      country,
      businessType,
      companySize,
      workLocations,
      officeAddress,
      officeState,
      cinNumber,
      taxInfoNumber,
    ],
  );

  const persistBusiness = useCallback(
    async (userId: string, completed: boolean) => {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: autoSavePayload.fullName || profile?.full_name || null,
          phone: autoSavePayload.mobile || null,
        })
        .eq("id", userId);
      if (profileErr) throw profileErr;

      const { error: epErr } = await supabase.from("employer_profiles").upsert(
        {
          user_id: userId,
          company_name: autoSavePayload.companyName || null,
          country: autoSavePayload.country || null,
          employer_role: EMPLOYER_ROLE,
          business_type: autoSavePayload.businessType || null,
          company_size: autoSavePayload.companySize || null,
          work_locations: autoSavePayload.workLocations.length > 0 ? autoSavePayload.workLocations : [],
          office_address: autoSavePayload.officeAddress || null,
          office_state: autoSavePayload.officeState || null,
          cin_number: autoSavePayload.cinNumber || null,
          tax_info_number: autoSavePayload.taxInfoNumber || null,
          onboarding_completed: completed,
        } as never,
        { onConflict: "user_id" },
      );
      if (epErr) throw epErr;
    },
    [autoSavePayload, profile?.full_name],
  );

  useEffect(() => {
    if (profileLoading) return;
    if (bootstrappedRef.current) {
      if (isAuthenticated && role === "employer") {
        setStep((s) => (s === 1 ? 2 : s));
      }
      return;
    }
    let cancelled = false;

    const bootstrap = async () => {
      if (isAuthenticated && role === "employer" && user) {
        const { data } = await supabase
          .from("employer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if ((data as { onboarding_completed?: boolean } | null)?.onboarding_completed) {
          navigate("/employer/dashboard", { replace: true });
          return;
        }

        const ep = (data || {}) as Record<string, unknown>;
        setFullName(profile?.full_name || "");
        setEmail(profile?.email || "");
        setMobile(profile?.phone || "");
        setCompanyName((ep.company_name as string) || "");
        setCountry((ep.country as string) || "");
        setBusinessType((ep.business_type as string) || "");
        setCompanySize((ep.company_size as string) || "");
        setWorkLocations((ep.work_locations as string[]) || []);
        setOfficeAddress((ep.office_address as string) || "");
        setOfficeState((ep.office_state as string) || "");
        setCinNumber((ep.cin_number as string) || "");
        setTaxInfoNumber((ep.tax_info_number as string) || "");
        setStep(2);
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

  const toggleWorkLocation = (loc: string) => {
    setWorkLocations((prev) => prev.filter((l) => l !== loc));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validation = validateSchema(quickEmployerSignupSchema, {
      fullName,
      email,
      password,
    });
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
          data: {
            full_name: validation.data.fullName.trim(),
            role: "employer",
          },
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
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", created.id)
          .maybeSingle();
        if (roleRow && roleRow.role !== "employer") {
          await supabase.auth.signOut();
          toast.error(
            `This account is already registered as a ${roleRow.role}. Please log in with the correct role.`,
          );
          navigate("/employer/login");
          return;
        }
      }

      toast.success("Account created. Now tell us about your business.");
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const persistOnboarding = async (completed: boolean) => {
    const { data: { user: current } } = await supabase.auth.getUser();
    if (!current) {
      toast.error("Please sign in to save your details.");
      navigate("/employer/login");
      return false;
    }
    await persistBusiness(current.id, completed);
    return true;
  };

  const handleFinish = async () => {
    const result = validateSchema(quickEmployerStep2Schema, {
      mobile,
      companyName,
      country,
      businessType,
      companySize,
    });
    if (!result.success) {
      setStepErrors(result.errors);
      toast.error(Object.values(result.errors)[0]);
      return;
    }
    setStepErrors({});
    setSaving(true);
    try {
      const ok = await persistOnboarding(true);
      if (!ok) return;
      toast.success("You're all set. Welcome aboard!");
      navigate("/employer/dashboard", { replace: true });
    } catch (err) {
      console.error("Employer quick-signup save error:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipSetup = async () => {
    setSaving(true);
    try {
      const ok = await persistOnboarding(true);
      if (!ok) return;
      toast.success("You can finish your business details anytime from your profile.");
      navigate("/employer/dashboard", { replace: true });
    } catch (err) {
      console.error("Employer quick-signup skip error:", err);
      toast.error("Failed to continue. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || saving;

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
        title="Employer Signup | SafeWork Global"
        description="Create a SafeWork Global employer account to hire skill-verified workers through a technology and workforce mobility platform."
      />
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel audience="employer" activeStep={step - 1} />

        <main
          className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-8 md:px-8 lg:px-12 ${
            step === 1 ? "justify-start sm:justify-center" : "justify-start py-6 sm:py-8"
          }`}
        >
          <div className={`mx-auto w-full ${step === 1 ? "max-w-[420px]" : "max-w-[520px]"}`}>
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              <div className="mb-5">
                <StepDots step={step} />
                {step === 1 && (
                  <>
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                      Create your employer account
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Takes less than 2 minutes. No upfront fees — pay only after you hire.
                    </p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                      Set up your business
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Company details so we can match you with verified workers.
                    </p>
                  </>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <>
                  <div className="mb-4 space-y-3">
                    <GoogleAuthButton
                      label="Sign up with Google"
                      role="employer"
                      onBeforeOAuth={() => {
                        if (fullName.trim()) {
                          sessionStorage.setItem("pending_employer_full_name", fullName.trim());
                        }
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
                      <p className="mb-2.5 text-center text-xs text-muted-foreground">
                        Looking for a different portal?
                      </p>
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

              {step === 2 && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">Mobile number *</Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className="h-11"
                      disabled={busy}
                    />
                    <p className="text-xs text-muted-foreground">
                      WhatsApp verification will be sent to this number
                    </p>
                    <FieldError message={stepErrors.mobile} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company name *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. ABC Constructions"
                      className="h-11"
                      disabled={busy}
                    />
                    <FieldError message={stepErrors.companyName} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Country *</Label>
                    <Select value={country} onValueChange={setCountry} disabled={busy}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTERED_COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={stepErrors.country} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Business type *</Label>
                      <Select value={businessType} onValueChange={setBusinessType} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.businessType} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company size *</Label>
                      <Select value={companySize} onValueChange={setCompanySize} disabled={busy}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={stepErrors.companySize} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Work locations</Label>
                    <Input
                      placeholder="Type a city and press Enter"
                      className="h-11"
                      disabled={busy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !workLocations.includes(val)) {
                            setWorkLocations((prev) => [...prev, val]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    {workLocations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {workLocations.map((loc) => (
                          <Badge
                            key={loc}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => toggleWorkLocation(loc)}
                          >
                            {loc} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="officeAddress">Office address</Label>
                      <Input
                        id="officeAddress"
                        value={officeAddress}
                        onChange={(e) => setOfficeAddress(e.target.value)}
                        placeholder="Office address"
                        className="h-11"
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="officeState">State</Label>
                      <Input
                        id="officeState"
                        value={officeState}
                        onChange={(e) => setOfficeState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="h-11"
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cinNumber">CIN number</Label>
                      <Input
                        id="cinNumber"
                        value={cinNumber}
                        onChange={(e) => setCinNumber(e.target.value)}
                        placeholder="Company CIN"
                        className="h-11"
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taxInfoNumber">Tax info number</Label>
                      <Input
                        id="taxInfoNumber"
                        value={taxInfoNumber}
                        onChange={(e) => setTaxInfoNumber(e.target.value)}
                        placeholder="TAN / TIN"
                        className="h-11"
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleFinish}
                    className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
                    disabled={busy}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish setup
                  </Button>
                </div>
              )}

              {step > 1 && (
                <>
                  <p className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleSkipSetup}
                      disabled={busy}
                      className="text-sm text-muted-foreground underline hover:text-foreground"
                    >
                      Skip setup — complete later
                    </button>
                  </p>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    You can finish your business details anytime from your profile.
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
