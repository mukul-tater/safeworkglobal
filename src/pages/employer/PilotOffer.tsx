import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, ShieldCheck, ArrowRight, Wallet, Mail, Clock } from "lucide-react";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";

const SUPPORT_EMAIL = "mukul@safeworkglobal.com";

export default function PilotOffer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const jobId = params.get("jobId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <EmployerFlowStepper current="pilot" />
      </div>
      <Card className="w-full max-w-2xl mx-auto shadow-elegant">
        <CardContent className="p-6 sm:p-10">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-success/10 mb-3">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">Job posted! Start with a pilot</h1>
            <p className="text-sm text-muted-foreground">The lowest-risk way to test SafeWork Global</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { icon: Sparkles, text: "Fill 5–10 roles" },
              { icon: CheckCircle2, text: "Shortlists in 7–10 days" },
              { icon: ShieldCheck, text: "No upfront fees" },
              { icon: Wallet, text: "Pay only after you hire" },
            ].map((p) => (
              <div key={p.text} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{p.text}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-muted/50 p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3">How payments work</h3>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> You deposit monthly salary into escrow</li>
              <li><strong className="text-foreground">2.</strong> Funds are held securely</li>
              <li><strong className="text-foreground">3.</strong> Released after work completion</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2 italic">No full upfront payment required.</p>
          </div>

          {/* Time-to-hire highlight */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="p-1.5 rounded-lg bg-primary/15 shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs sm:text-sm">
              <span className="font-semibold">Shortlist in 7–10 days</span>
              <span className="text-muted-foreground"> — verified candidates ready to interview.</span>
            </p>
          </div>

          <Button
            size="lg"
            className="w-full h-12 gap-2"
            onClick={() => navigate("/employer/shortlist")}
          >
            Review Shortlist <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 mt-3 gap-2"
            onClick={() => navigate(jobId ? `/employer/applications?jobId=${jobId}` : "/employer/applications")}
          >
            View Applications
          </Button>

          {/* Call support */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 flex items-center justify-center gap-2 w-full h-11 rounded-md border border-border bg-card text-sm font-medium hover:bg-accent transition-colors"
          >
            <Mail className="h-4 w-4 text-primary" />
            Email us — {SUPPORT_EMAIL}
          </a>

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
