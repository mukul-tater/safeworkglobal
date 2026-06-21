import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeFooterCTA() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSignUp = () => {
    navigate(isAuthenticated ? "/jobs" : "/worker/quick-signup");
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-info" />

      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24 relative z-10 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight text-white">
          Ready to work abroad safely?
        </h2>
        <p className="text-white/85 mb-8 max-w-lg mx-auto text-base sm:text-lg">
          {isAuthenticated
            ? "Browse verified jobs and apply in minutes."
            : "Join 100+ workers already on SafeWork Global. Sign up free — no agent fees."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            size="lg"
            className="h-12 px-8 rounded-xl gap-2 font-semibold bg-white text-primary hover:bg-white/90"
            onClick={handleSignUp}
          >
            {isAuthenticated ? "Browse Jobs" : "Sign Up Free"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            className="h-12 px-8 rounded-xl font-semibold bg-transparent border-2 border-white text-white hover:bg-white/15"
            onClick={() => navigate("/jobs")}
          >
            View All Jobs
          </Button>
        </div>
        <a
          href="tel:+919950085843"
          className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
        >
          <Phone className="h-4 w-4" />
          Questions? Call us: +91-99500-85843
        </a>
      </div>
    </section>
  );
}
