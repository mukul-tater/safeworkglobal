/**
 * SSVN / ITI / SRN / generic partner registration form.
 * Canonical paths: /partner/register-ssvn, /partner/register-iti, /partner/register-srn, /partner/register-consultant
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { indianStates } from "@/lib/validations/partner";
import { partnerAuthEmailFromMobile, displayableEmail } from "@/lib/workerAuthEmail";
import { lockedPartnerFromPath } from "@/modules/partner/config/partnerPortalRoutes";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import { cn } from "@/lib/utils";

interface PartnerType {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function PartnerRegisterLegacy() {
  const { user, isAuthenticated, assignRole, signup, refreshProfile, refreshRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const portal = lockedPartnerFromPath(pathname);
  const lockedTypeCode = portal?.code ?? null;
  const loginPath = portal?.loginPath ?? "/partner/ssvn/login";
  const heading = portal?.heading ?? "Partner Registration";
  const subtitle = portal?.subtitle ?? "Join the SafeWork Global partner network";
  const signInLabel = portal?.signInLabel ?? "Partner sign in";
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    partner_type_id: "",
    company_name: "",
    owner_name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    city: "",
    address: "",
    pincode: "",
    pan: "",
    gst: "",
    account_holder: "",
    account_number: "",
    ifsc: "",
    upi: "",
  });

  useEffect(() => {
    (supabase as any)
      .from("partner_types")
      .select("id, code, name, description")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }: any) => {
        const list = (data ?? []) as PartnerType[];
        const filtered = lockedTypeCode
          ? list.filter((t) => t.code === lockedTypeCode)
          : list;
        setTypes(filtered.length ? filtered : list);
        if (lockedTypeCode) {
          const locked = list.find((t) => t.code === lockedTypeCode);
          if (locked) setForm((f) => ({ ...f, partner_type_id: locked.id }));
        }
      });
  }, [lockedTypeCode]);

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: displayableEmail(user.email) || "" }));
    }
  }, [user]); // eslint-disable-line

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const ensureAuthenticated = async (): Promise<string> => {
    if (isAuthenticated && user?.id) return user.id;

    const digits = form.mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      throw new Error("Enter a valid 10-digit mobile number");
    }
    if (!form.email.trim() && !digits) {
      throw new Error("Email or mobile is required to create your login");
    }
    if (form.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (form.password !== form.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const authEmail = form.email.trim() || partnerAuthEmailFromMobile(digits);
    const result = await signup({
      email: authEmail,
      password: form.password,
      full_name: form.owner_name || form.company_name,
      phone: digits,
      role: "partner",
    });
    if (!result.success) {
      throw new Error(result.error || "Could not create account");
    }

    // Sign-in may already be active after signup; refresh context
    await refreshProfile();
    await refreshRole();
    const { data: { user: created } } = await supabase.auth.getUser();
    if (!created?.id) {
      // Some projects require email confirm — try password login
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: form.password,
      });
      if (error) {
        throw new Error(
          "Account created but sign-in failed. Confirm email if required, then sign in and finish registration.",
        );
      }
    }
    const { data: { user: after } } = await supabase.auth.getUser();
    if (!after?.id) throw new Error("Authentication failed after signup");
    await assignRole("partner").catch(() => {});
    await (supabase as any)
      .from("profiles")
      .update({ phone: digits, full_name: form.owner_name || form.company_name })
      .eq("id", after.id);
    return after.id;
  };

  const submit = async () => {
    if (!form.partner_type_id || !form.company_name || !form.mobile) {
      toast.error("Fill required fields (company, mobile, partner type)");
      return;
    }
    setSaving(true);
    try {
      const userId = await ensureAuthenticated();
      await assignRole("partner").catch(() => {});

      const digits = form.mobile.replace(/\D/g, "");
      await (supabase as any)
        .from("profiles")
        .update({ phone: digits })
        .eq("id", userId);

      const { data: partner, error } = await (supabase as any)
        .from("partners")
        .insert({
          user_id: userId,
          partner_type_id: form.partner_type_id,
          status: "pending",
          state: form.state || null,
          district: form.district || null,
          city: form.city || null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: pe } = await (supabase as any)
        .from("partner_profiles_ext")
        .insert({
          partner_id: partner.id,
          company_name: form.company_name,
          owner_name: form.owner_name || null,
          mobile: digits,
          email: form.email || null,
          address: form.address || null,
          pincode: form.pincode || null,
          pan: form.pan || null,
          gst: form.gst || null,
          bank: {
            holder: form.account_holder || null,
            account: form.account_number || null,
            ifsc: form.ifsc || null,
          },
          upi: form.upi || null,
        });
      if (pe) throw pe;

      await (supabase as any).from("partner_wallets").insert({ partner_id: partner.id });

      toast.success("Registration submitted — awaiting admin approval");
      navigate("/partner/pending", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  const PortalIcon = portal?.Icon;

  return (
    <AuthSplitLayout
      audience="partner"
      activeStep={1}
      maxWidthClassName="max-w-[520px]"
      centerVertically={false}
    >
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-primary/30" />
          <span className="h-1.5 w-6 rounded-full bg-primary" />
          <span className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">Step 2 of 3</span>
        </div>
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-5">
        {lockedTypeCode && portal && PortalIcon ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
            <div className={cn("rounded-lg p-1.5", portal.accentClass)}>
              <PortalIcon className="h-4 w-4" />
            </div>
            <span className="min-w-0 truncate text-sm font-semibold">{portal.typeLabel}</span>
            <Link
              to="/partner/register"
              className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Change type
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Partner type</Label>
            <Select
              value={form.partner_type_id}
              onValueChange={(v) => set("partner_type_id", v)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select partner type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isAuthenticated && (
          <section className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div>
              <h3 className="text-sm font-semibold">Create login</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set a password now. After approval, sign in at{" "}
                <Link to={loginPath} className="font-medium text-primary hover:underline">
                  {signInLabel}
                </Link>
                .
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="h-11 pl-10 pr-9"
                    placeholder="Min 6 chars"
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
                <Label>Confirm *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    className="h-11 pl-10 pr-9"
                    placeholder="Re-enter"
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
          </section>
        )}

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{portal?.orgNameLabel ?? "Company / Center Name *"}</Label>
            <Input
              className="h-11"
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Owner name</Label>
            <Input className="h-11" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile *</Label>
            <Input
              className="h-11"
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email {!isAuthenticated ? "(recommended)" : ""}</Label>
            <Input
              className="h-11"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>State</Label>
            <Select value={form.state} onValueChange={(v) => set("state", v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>District</Label>
            <Input className="h-11" value={form.district} onChange={(e) => set("district", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input className="h-11" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pincode</Label>
            <Input className="h-11" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>PAN</Label>
            <Input
              className="h-11"
              value={form.pan}
              onChange={(e) => set("pan", e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label>GST (optional)</Label>
            <Input
              className="h-11"
              value={form.gst}
              onChange={(e) => set("gst", e.target.value.toUpperCase())}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Bank / payout</h3>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Account holder</Label>
              <Input
                className="h-11"
                value={form.account_holder}
                onChange={(e) => set("account_holder", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account number</Label>
              <Input
                className="h-11"
                value={form.account_number}
                onChange={(e) => set("account_number", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>IFSC</Label>
              <Input
                className="h-11"
                value={form.ifsc}
                onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label>UPI ID</Label>
              <Input className="h-11" value={form.upi} onChange={(e) => set("upi", e.target.value)} />
            </div>
          </div>
        </section>

        <Button
          onClick={submit}
          disabled={saving}
          className="h-11 w-full bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Submitting…" : "Submit registration"}
        </Button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to={loginPath} className="font-medium text-primary hover:underline">
            {signInLabel}
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
