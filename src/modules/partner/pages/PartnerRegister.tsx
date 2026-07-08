import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface PartnerType {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function PartnerRegister() {
  const { user, isAuthenticated, assignRole } = useAuth();
  const navigate = useNavigate();
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partner_type_id: "",
    company_name: "",
    owner_name: "",
    mobile: "",
    email: "",
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
      .then(({ data }: any) => setTypes(data ?? []));
  }, []);

  useEffect(() => {
    if (user?.email && !form.email) setForm((f) => ({ ...f, email: user.email ?? "" }));
  }, [user]); // eslint-disable-line

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in first");
      navigate("/auth?redirect=/partner/register");
      return;
    }
    if (!form.partner_type_id || !form.company_name || !form.mobile) {
      toast.error("Fill required fields");
      return;
    }
    setSaving(true);
    try {
      // Ensure the user has partner role
      await assignRole("partner").catch(() => {});

      const { data: partner, error } = await (supabase as any)
        .from("partners")
        .insert({
          user_id: user.id,
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
          mobile: form.mobile,
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
          <h1 className="text-3xl font-bold">Partner Registration</h1>
          <p className="text-muted-foreground">Join the SafeWork Global partner network</p>
        </div>
        <Card className="p-6 space-y-6">
          <section>
            <h2 className="font-semibold mb-3">Partner Type</h2>
            <Select value={form.partner_type_id} onValueChange={(v) => set("partner_type_id", v)}>
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

          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Company / Center Name *</Label>
              <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Submitting..." : "Submit Registration"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
