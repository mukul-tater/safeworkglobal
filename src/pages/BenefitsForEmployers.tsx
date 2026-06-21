import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  PiggyBank,
  Zap,
  ShieldCheck,
  Lock,
  Banknote,
  Target,
  BarChart3,
  TrendingUp,
  Brain,
  HeadphonesIcon,
  ArrowRight,
  Rocket,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    icon: PiggyBank,
    title: "Reduce Hiring Cost by 80–90%",
    bullets: [
      "Traditional agents: 20–30% upfront fees",
      "SafeWork Global: Only 1% of salary",
    ],
    highlight: "Direct cost savings per worker",
    accent: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Zap,
    title: "Faster Hiring (7–10 Days)",
    bullets: ["Pre-screened candidates", "Quick shortlisting", "Faster deployment"],
    highlight: "No long agent delays",
    accent: "from-amber-500/10 to-amber-500/5",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "Verified & Job-Ready Workers",
    bullets: ["Skill-checked candidates", "Profile verification", "Relevant experience"],
    highlight: "Better hiring quality",
    accent: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Lock,
    title: "Zero Upfront Risk",
    bullets: ["No advance payments", "Pay only after hiring"],
    highlight: "Completely low-risk model",
    accent: "from-purple-500/10 to-purple-500/5",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Banknote,
    title: "Escrow-Based Payment Protection",
    bullets: ["Salary secured before deployment", "Payment released after work"],
    highlight: "Ensures accountability on both sides",
    accent: "from-teal-500/10 to-teal-500/5",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    icon: Target,
    title: "Full Hiring Control",
    bullets: ["Employers review candidates", "Conduct interviews", "Select final hires"],
    highlight: "No blind dependency on agents",
    accent: "from-rose-500/10 to-rose-500/5",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: BarChart3,
    title: "Transparent Hiring Process",
    bullets: ["Track candidates", "Clear status updates", "No hidden fees"],
    highlight: "Full visibility",
    accent: "from-cyan-500/10 to-cyan-500/5",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: TrendingUp,
    title: "Scalable Workforce Hiring",
    bullets: ["Hire 5 → 50 → 500 workers", "Repeat hiring becomes easier"],
    highlight: "Built for long-term scaling",
    accent: "from-indigo-500/10 to-indigo-500/5",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: Brain,
    title: "Reduced Dependency on Agents",
    bullets: ["Direct access to workforce", "Lower long-term hiring cost"],
    highlight: "Strategic advantage",
    accent: "from-fuchsia-500/10 to-fuchsia-500/5",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    icon: HeadphonesIcon,
    title: "End-to-End Support",
    bullets: ["Candidate sourcing", "Shortlisting", "Hiring coordination"],
    highlight: "Minimal effort for employer",
    accent: "from-orange-500/10 to-orange-500/5",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

export default function BenefitsForEmployers() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleHire = () => {
    if (!isAuthenticated) return navigate("/employer/quick-signup");
    if (role === "employer") return navigate("/employer/dashboard");
    if (role === "worker") {
      toast.error("You're logged in as a Worker. Sign out to access employer features.");
      return;
    }
    navigate("/employer/quick-signup");
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SEOHead
        title="Benefits for Employers | SafeWorkGlobal"
        description="Hire faster, safer, and at a fraction of traditional costs with SafeWork Global. Only 1% fee, escrow-protected, fully transparent."
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-info/5" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-info/10 blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 py-16 lg:py-24 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              For Employers
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-foreground mb-5 flex items-center gap-3 flex-wrap">
              <Rocket className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              Key Benefits for Employers
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Hire faster, safer, and at a fraction of traditional costs with SafeWork Global.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="hero" onClick={handleHire} className="gap-2">
                Hire Workers Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight">
            Built for modern, large-scale hiring
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to source, verify, and deploy a global workforce — without the
            traditional friction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <Card
                key={b.title}
                className="group relative overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${b.accent} opacity-60 group-hover:opacity-100 transition-opacity`}
                />
                <CardContent className="relative p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-sm ${b.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground/60">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold leading-snug">
                    {b.title}
                  </h3>

                  <ul className="space-y-1.5">
                    {b.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm font-semibold text-foreground flex items-start gap-2">
                      <span className="text-primary">👉</span>
                      <span>{b.highlight}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-info text-primary-foreground p-8 sm:p-12 lg:p-16">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-4">
              Start Hiring Smarter Today
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/90 mb-8 max-w-xl">
              Join employers cutting hiring costs by up to 90% with verified workers, escrow
              protection, and full transparency.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleHire}
                className="bg-background text-foreground hover:bg-background/90 gap-2 shadow-lg"
              >
                Hire Workers Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
