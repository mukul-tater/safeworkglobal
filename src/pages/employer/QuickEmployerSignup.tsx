import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { validateSchema } from "@/lib/validations/common";
import { quickEmployerSignupSchema } from "@/lib/validations/onboarding";
import GoogleAuthButton from "@/modules/worker-registration/components/GoogleAuthButton";
import SignupJourneyPanel from "@/components/SignupJourneyPanel";
import SEOHead from "@/components/SEOHead";

export default function QuickEmployerSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          emailRedirectTo: `${window.location.origin}/employer/dashboard`,
          data: {
            full_name: validation.data.fullName.trim(),
            role: "employer",
          },
        },
      });
      if (signUpError) {
        // If the email is already registered with a different role, surface a
        // clear message instead of letting Supabase's "User already registered"
        // bubble up unexplained.
        if (/already registered|already exists/i.test(signUpError.message)) {
          toast.error("This email is already registered. Please sign in instead.");
          navigate("/employer/login");
          return;
        }
        throw signUpError;
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
          navigate("/employer/login");
          return;
        }
      }

      toast.success("Welcome! Let's get you started.");
      navigate("/employer/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-muted/40">
      <SEOHead
        title="Employer Signup | SafeWork Global"
        description="Create a SafeWork Global employer account to hire skill-verified workers through a technology and workforce mobility platform."
      />
      <div className="flex h-full flex-col md:flex-row">
        <SignupJourneyPanel audience="employer" />

        <main className="relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-5 sm:justify-center sm:px-8 md:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/5 sm:p-7">
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-primary" />
                  <span className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
                  <span className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                    Step 1 of 3
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
                  Create your employer account
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Takes less than 2 minutes. No upfront fees — pay only after you hire.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

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
                    disabled={loading}
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
                      disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                  disabled={loading}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
