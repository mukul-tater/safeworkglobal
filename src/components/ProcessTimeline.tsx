import { UserPlus, FileText, CheckCircle, FileSignature, Plane, HeartHandshake, Users, Video, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ProcessTimeline = () => {
  const { role, isAuthenticated, loading, profileLoading } = useAuth();
  const authResolving = loading || (isAuthenticated && profileLoading);
  const isEmployer = role === "employer";

  const workerSteps = [
    { number: 1, title: "Register Free", description: "Create your profile and search verified jobs", icon: UserPlus, bgColor: "bg-primary", iconGradient: "bg-gradient-to-br from-primary to-primary/70" },
    { number: 2, title: "Apply to Jobs", description: "Submit your application to verified listings", icon: FileText, bgColor: "bg-secondary", iconGradient: "bg-gradient-to-br from-secondary to-secondary/70" },
    { number: 3, title: "Get Selected", description: "Employer reviews and shortlists you", icon: CheckCircle, bgColor: "bg-success", iconGradient: "bg-gradient-to-br from-success to-success/70" },
    { number: 4, title: "Sign Your Contract", description: "Salary and job terms in writing before you agree", icon: FileSignature, bgColor: "bg-warning", iconGradient: "bg-gradient-to-br from-warning to-warning/70" },
    { number: 5, title: "Visa & Travel", description: "Emigration and travel through a licensed partner", icon: Plane, bgColor: "bg-info", iconGradient: "bg-gradient-to-br from-info to-info/70" },
    { number: 6, title: "Support Abroad", description: "Ongoing help after you reach your destination", icon: HeartHandshake, bgColor: "bg-gradient-to-r from-primary to-info", iconGradient: "bg-gradient-to-br from-primary to-info" }
  ];

  const employerSteps = [
    { number: 1, title: "Post a Job", description: "Share role, skills, and requirements", icon: FileText, bgColor: "bg-primary", iconGradient: "bg-gradient-to-br from-primary to-primary/70" },
    { number: 2, title: "Browse Workers", description: "Search verified, pre-vetted candidates", icon: Users, bgColor: "bg-secondary", iconGradient: "bg-gradient-to-br from-secondary to-secondary/70" },
    { number: 3, title: "Shortlist", description: "Save top candidates to your shortlist", icon: CheckCircle, bgColor: "bg-success", iconGradient: "bg-gradient-to-br from-success to-success/70" },
    { number: 4, title: "Interview", description: "Schedule video interviews in one click", icon: Video, bgColor: "bg-warning", iconGradient: "bg-gradient-to-br from-warning to-warning/70" },
    { number: 5, title: "Send Offer", description: "Issue offer letter and sign contract", icon: FileSignature, bgColor: "bg-info", iconGradient: "bg-gradient-to-br from-info to-info/70" },
    { number: 6, title: "Hire & Deploy", description: "Licensed partner handles visa and deployment", icon: Wallet, bgColor: "bg-gradient-to-r from-primary to-info", iconGradient: "bg-gradient-to-br from-primary to-info" }
  ];

  // While auth resolves, default to the worker (public) steps to avoid layout
  // shift; real role-specific content swaps in once `role` is known.
  const steps = !authResolving && isEmployer ? employerSteps : workerSteps;

  const heading = !authResolving && isEmployer ? (
    <>Your Path to <span className="text-gradient">Hiring Success</span></>
  ) : (
    <>Your Path to a <span className="text-gradient">Safe Job Abroad</span></>
  );

  const subheading = !authResolving && isEmployer
    ? "A simple, transparent 6-step process to hire verified workers — no upfront fees"
    : "From sign-up to working abroad — every step is verified and protected";

  return (
    <section className="py-14 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            How it Works
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4 tracking-tight">
            {heading}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            {subheading}
          </p>
        </div>

        {/* Steps */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6 lg:gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex w-[11.5rem] shrink-0 snap-start flex-col items-center text-center group sm:w-auto"
            >
              {/* Step number */}
              <div className="relative mb-4">
                <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full ${step.bgColor} flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {step.number}
                </div>
              </div>

              {/* Icon Card */}
              <div className="w-full p-3 sm:p-4 rounded-xl bg-card border border-border/50 group-hover:border-primary/30 group-hover:shadow-md transition-all duration-300 mb-2.5">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${step.iconGradient} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>

              <h3 className="font-semibold font-heading text-foreground text-sm sm:text-base mb-1">
                {step.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-[11rem] sm:max-w-[160px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 sm:mt-14 lg:mt-20">
          <p className="text-muted-foreground text-xs sm:text-sm">
            {!authResolving && isEmployer ? "Ready to start hiring?" : "Ready to start your journey?"}
            <span className="text-primary font-medium ml-1">
              {!authResolving && isEmployer ? "Browse workers above" : "Search jobs above"}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProcessTimeline;
