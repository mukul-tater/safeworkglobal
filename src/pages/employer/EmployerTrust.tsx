import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Coins,
  ArrowRight,
  Clock,
  Mail,
  TrendingDown,
  X,
  Check,
} from "lucide-react";

const SUPPORT_EMAIL = "mukul@safeworkglobal.com";

export default function EmployerTrust() {
  const navigate = useNavigate();

  const points = [
    { icon: Coins, title: "Save 95%+ vs traditional agents", desc: "No upfront fees — only pay after you hire." },
    { icon: ShieldCheck, title: "Verified workers", desc: "Every worker is ID, document and skill verified." },
    { icon: CheckCircle2, title: "Escrow-secured payments", desc: "Funds held safely. Released after work completion." },
    { icon: Zap, title: "Faster hiring", desc: "Shortlists in 7–10 days for your pilot batch." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <EmployerFlowStepper current="search" />
      </div>
      <Card className="w-full max-w-3xl mx-auto shadow-elegant">
        <CardContent className="p-6 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
              Why employers choose SafeWork Global
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start with a pilot — no upfront fees
            </p>
          </div>

          {/* Cost Comparison */}
          <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-success/5 to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-success/10">
                <TrendingDown className="h-4 w-4 text-success" />
              </div>
              <h2 className="font-semibold text-sm sm:text-base">
                Cost comparison — see what you save
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2">
                  <X className="h-3.5 w-3.5" /> Traditional agents
                </div>
                <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                  ₹50K – ₹2L
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Per worker, paid upfront
                </p>
              </div>

              <div className="rounded-xl border-2 border-success/40 bg-success/5 p-4 relative">
                <span className="absolute -top-2 right-2 text-[10px] font-bold uppercase tracking-wide bg-success text-success-foreground px-2 py-0.5 rounded-full">
                  You save 95%+
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-success mb-2">
                  <Check className="h-3.5 w-3.5" /> SafeWork Global
                </div>
                <div className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                  ₹0 upfront
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Pay only after you hire
                </p>
              </div>
            </div>
          </div>

          {/* Time to Hire */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="p-2.5 rounded-xl bg-primary/15 shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">
                Shortlist in 7–10 days
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pre-verified candidates delivered to you — no waiting months for an agent.
              </p>
            </div>
          </div>

          {/* Trust points grid */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {points.map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded-xl border border-border bg-card/50">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call with us — trust boost */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-success/10 shrink-0">
              <Phone className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-sm sm:text-base">Talk to a real human</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Have questions? Call us — we'll walk you through everything.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
              <a href={`mailto:${SUPPORT_EMAIL}`}>
                <Mail className="h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
            </Button>
          </div>

          <Button
            size="lg"
            className="w-full h-12 gap-2"
            onClick={() => navigate("/employer/search-workers")}
          >
            Browse verified workers <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 mt-3 gap-2"
            onClick={() => navigate("/employer/quick-post-job")}
          >
            Skip — Post a job directly
          </Button>
          <button
            type="button"
            onClick={() => navigate("/employer/dashboard")}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Go to dashboard
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
