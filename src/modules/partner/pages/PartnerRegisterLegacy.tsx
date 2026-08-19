/**
 * SSVN / ITI / generic partner registration form.
 * Canonical paths: /partner/register-ssvn, /partner/register-iti
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
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
import { indianStates } from "@/lib/validations/partner";
import { partnerAuthEmailFromMobile, displayableEmail } from "@/lib/workerAuthEmail";

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
  const lockedTypeCode = pathname.includes("register-ssvn")
    ? "SSVN"
    : pathname.includes("register-iti")
      ? "ITI"
      : null;
  const loginPath = lockedTypeCode === "ITI" ? "/partner/iti/login" : "/partner/ssvn/login";
  const heading =
    lockedTypeCode === "SSVN"
      ? "Trade Test Centre (SSVN) Registration"
      : lockedTypeCode === "ITI"
        ? "ITI Partner Registration"
        : "Partner Registration";
  const subtitle =
    lockedTypeCode === "SSVN"
      ? "Apply to operate a SafeWork trade test centre. After approval, sign in at SSVN login."
      : lockedTypeCode === "ITI"
        ? "Apply as an Industrial Training Institute. After approval, sign in at ITI login."
        : "Join the SafeWork Global partner network";
  const signInLabel = lockedTypeCode === "ITI" ? "ITI sign in" : "SSVN sign in";
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {heading}
          </h1>
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <Card className="p-6 space-y-6">
          <section>
            <h2 className="font-semibold mb-3">Partner Type</h2>
            <Select
              value={form.partner_type_id}
              onValueChange={(v) => set("partner_type_id", v)}
              disabled={!!lockedTypeCode}
            >
              <SelectTrigger><SelectValue placeholder="Select partner type" /></SelectTrigger>
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
          </section>

          {!isAuthenticated && (
            <section className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h2 className="font-semibold">Create login</h2>
              <p className="text-xs text-muted-foreground">
                Set a password now. After SafeWork approves you, sign in at{" "}
                <Link to={loginPath} className="text-primary underline">
                  {loginPath}
                </Link>
                .
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Confirm password *</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{lockedTypeCode === "ITI" ? "Institute Name *" : "Company / Center Name *"}</Label>
              <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <Label>Email {!isAuthenticated ? "(recommended)" : ""}</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {indianStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>PAN</Label>
              <Input value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>GST (optional)</Label>
              <Input value={form.gst} onChange={(e) => set("gst", e.target.value.toUpperCase())} />
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Bank / Payout</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Account Holder</Label>
                <Input value={form.account_holder} onChange={(e) => set("account_holder", e.target.value)} />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input value={form.account_number} onChange={(e) => set("account_number", e.target.value)} />
              </div>
              <div>
                <Label>IFSC</Label>
                <Input value={form.ifsc} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label>UPI ID</Label>
                <Input value={form.upi} onChange={(e) => set("upi", e.target.value)} />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <p className="text-sm text-muted-foreground self-center">
              Already registered?{" "}
              <Link to={loginPath} className="text-primary font-medium hover:underline">
                {signInLabel}
              </Link>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Registration"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
