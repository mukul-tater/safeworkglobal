import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

export default function QuickEmployerSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !fullName.trim() || !email.trim() || password.length < 6) {
      toast.error("Please fill all fields (password min 6 chars)");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/employer/trust`,
          data: {
            full_name: fullName.trim(),
            role: "employer",
            company_name: companyName.trim(),
          },
        },
      });
      if (error) {
        // If the email is already registered with a different role, surface a
        // clear message instead of letting Supabase's "User already registered"
        // bubble up unexplained.
        if (/already registered|already exists/i.test(error.message)) {
          toast.error("This email is already registered. Please sign in instead.");
          navigate("/auth?role=employer");
          return;
        }
        throw error;
      }

      // Try immediate sign-in (works when email confirmation disabled)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInErr) {
        toast.success("Check your email to verify your account");
        navigate("/verify-email");
        return;
      }

      // Verify role matches (defends against an existing account being reused).
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (roleRow && roleRow.role !== "employer") {
          await supabase.auth.signOut();
          toast.error(
            `This account is already registered as a ${roleRow.role}. Please log in with the correct role.`
          );
          navigate("/auth");
          return;
        }
        await supabase.from("employer_profiles").update({ company_name: companyName.trim() }).eq("user_id", user.id);
      }

      toast.success("Welcome! Let's get you started.");
      navigate("/employer/trust");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
  const handleGoogle = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter your company name before continuing with Google");
      return;
    }
    setLoading(true);
    try {
      // Pre-select the Employer role so the OAuth callback can auto-assign it
      // without showing the role chooser again on /auth. Also persist the
      // company name so /auth can write it to employer_profiles post-callback.
      sessionStorage.setItem("pending_oauth_role", "employer");
      sessionStorage.setItem("pending_employer_company", companyName.trim());
      if (fullName.trim()) {
        sessionStorage.setItem("pending_employer_full_name", fullName.trim());
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        sessionStorage.removeItem("pending_oauth_role");
        sessionStorage.removeItem("pending_employer_company");
        sessionStorage.removeItem("pending_employer_full_name");
        toast.error(
          result.error instanceof Error ? result.error.message : "Google sign-in failed"
        );
        setLoading(false);
        return;
      }
      if (result.redirected) return; // Browser will redirect to Google
    } catch (err: any) {
      sessionStorage.removeItem("pending_oauth_role");
      sessionStorage.removeItem("pending_employer_company");
      sessionStorage.removeItem("pending_employer_full_name");
      toast.error(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-info/5 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-1">Hire Workers</h1>
            <p className="text-sm text-muted-foreground">
              Verified workers, escrow-secured payments — no upfront fees.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Takes less than 2 minutes</p>
          </div>

          {/* Role indicator — makes it explicit which role you're signing up as */}
          <div className="mb-4 mx-auto w-fit flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Signing up as an Employer
          </div>

          <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogle} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Continue with Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <Label htmlFor="company">Company name *</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Construction Ltd" disabled={loading} />
            </div>
            <div>
              <Label htmlFor="name">Your name *</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" disabled={loading} />
            </div>
            <div>
              <Label htmlFor="email">Work email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" disabled={loading} />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" disabled={loading} />
            </div>

            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>Escrow-secured · Pay only after you hire</span>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account?{" "}
            <button type="button" className="text-primary font-medium hover:underline" onClick={() => navigate("/auth")}>Log in</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
