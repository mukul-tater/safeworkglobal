import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SEOHead from "@/components/SEOHead";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  FileText,
  Handshake,
  HardHat,
  Headphones,
  MapPin,
  Network,
  Percent,
  Plane,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { UAE_PHOTOS } from "@/modules/country-insights/data/uaePhotos";

const HERO_IMAGE = UAE_PHOTOS.skyline.src;
const PROCESS_IMAGE = UAE_PHOTOS.rebar.src;
const CTA_IMAGE = UAE_PHOTOS.crane.src;

const benefits = [
  {
    icon: MapPin,
    kicker: "Pan-India Workforce",
    title: "Access India's Skilled Workforce",
    description:
      "Access skilled workers from across India through our growing network of E-Mitra/CSC channels, ITIs, training centres and skill-verification partners.",
    featured: false,
  },
  {
    icon: ShieldCheck,
    kicker: "Skill Verified",
    title: "Hire for the Actual Skill",
    description:
      "Candidates can undergo structured technical screening, online interviews and physical trade testing based on the trade and employer requirements.",
    featured: false,
  },
  {
    icon: Percent,
    kicker: "1% Employer Model",
    title: "Simple 1% Pricing",
    description:
      "Pay 1% of the worker's monthly gross salary for the duration of employment, subject to the agreed commercial terms.",
    featured: true,
    highlights: ["1% Monthly Gross Salary", "For the Duration of Employment"],
  },
  {
    icon: SlidersHorizontal,
    kicker: "Employer-Driven Hiring",
    title: "Built Around Your Requirement",
    description:
      "Share your required trade, experience, salary, location, workforce quantity and joining timeline. SafeWork builds the candidate pipeline around your specific requirement.",
    featured: false,
  },
  {
    icon: Network,
    kicker: "End-to-End Coordination",
    title: "One Workforce Partner",
    description:
      "Coordinate sourcing, skill verification, trade testing, technical interviews, documentation and deployment through one structured technology-enabled workflow.",
    featured: false,
  },
  {
    icon: Headphones,
    kicker: "Ongoing Support",
    title: "Support Beyond Hiring",
    description:
      "Receive ongoing workforce assistance and replacement coordination according to the agreed employer terms.",
    featured: false,
  },
] as const;

const processSteps = [
  {
    n: "01",
    title: "Your Requirement",
    body: "Employer submits: Trade • Experience • Salary • Location • Number of Workers • Joining Date",
    icon: ClipboardList,
  },
  {
    n: "02",
    title: "Pan-India Sourcing",
    body: "SafeWork accesses its worker onboarding ecosystem across India.",
    icon: Users,
  },
  {
    n: "03",
    title: "Skill Verification",
    body: "Candidate screening → Technical Interview → Trade Test where required",
    icon: BadgeCheck,
  },
  {
    n: "04",
    title: "Employer Interview",
    body: "Employer reviews candidates and conducts the required interview/selection process.",
    icon: Handshake,
  },
  {
    n: "05",
    title: "Recruitment & Documentation",
    body: "Applicable recruitment and documentation process is coordinated through the appropriate licensed recruitment channel.",
    icon: FileText,
  },
  {
    n: "06",
    title: "Deployment",
    body: "Selected workers complete applicable formalities and proceed for employment.",
    icon: Plane,
  },
];

const traditional = [
  "Fragmented sourcing",
  "CV-based selection",
  "Multiple intermediaries",
  "Less visibility into candidate skills",
  "High/complex recruitment costs",
  "Manual coordination",
];

const safework = [
  "Pan-India sourcing network",
  "Skill verification & trade testing",
  "Technology-enabled workflow",
  "Structured digital candidate profiles",
  "Simple 1% monthly model",
  "Centralized coordination",
];

const trades = [
  "Construction",
  "MEP",
  "Engineering",
  "Facility Management",
  "Logistics",
  "Manufacturing",
  "Hospitality",
];

export default function BenefitsForEmployers() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const postRequirement = () => {
    if (!isAuthenticated) return navigate("/employer/quick-signup");
    if (role === "employer") return navigate("/employer/dashboard");
    if (role === "worker") {
      toast.error("You're logged in as a Worker. Sign out to access employer features.");
      return;
    }
    navigate("/employer/quick-signup");
  };

  return (
    <div className="min-h-screen bg-background has-mobile-nav overflow-x-hidden">
      <SEOHead
        title="Benefits for Employers | SafeWork Global"
        description="Access India's skilled workforce through a structured, technology-enabled and skill-first pipeline. Simple 1% monthly model for UAE and GCC employers."
        canonicalUrl="https://www.safeworkglobal.com/benefits-for-employers"
      />
      <Header />

      <section className="relative overflow-hidden border-b border-border min-h-[28rem] sm:min-h-[32rem]">
        <img
          src={HERO_IMAGE}
          alt={UAE_PHOTOS.skyline.alt.en}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1222]/92 via-[#0c1222]/78 to-[#0c1222]/45" />
        <div className="container mx-auto px-4 sm:px-6 py-16 lg:py-24 relative">
          <ScrollReveal>
            <div className="max-w-3xl text-white">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wide uppercase mb-5 border border-white/15">
                <HardHat className="h-3.5 w-3.5" />
                For UAE & GCC Employers
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight leading-[1.15] mb-5">
                India&apos;s Skilled Workforce. Verified for Your Requirements. Delivered Through a Transparent Workforce Pipeline.
              </h1>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl">
                Access India&apos;s skilled workforce through a structured, technology-enabled and skill-first workforce pipeline — built for Dubai, UAE and GCC hiring.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" variant="hero" onClick={postRequirement} className="gap-2 w-full sm:w-auto whitespace-normal sm:whitespace-nowrap h-auto min-h-12 py-3">
                  Post Your Requirement
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto"
                >
                  <Link to="/contact">Talk to SafeWork</Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <ScrollReveal>
          <div className="max-w-3xl mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-3">
              Employer Benefits
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-4">
              Why Employers Choose SafeWork Global
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Access India&apos;s skilled workforce through a structured, technology-enabled and skill-first workforce pipeline.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <ScrollReveal key={b.title} delay={i * 0.04}>
                <Card
                  className={`h-full overflow-hidden transition-all duration-300 ${
                    b.featured
                      ? "border-primary/40 shadow-lg shadow-primary/10 bg-gradient-to-br from-primary to-info text-primary-foreground"
                      : "border-border/60 hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-6 sm:p-7 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                          b.featured ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className={`text-[11px] font-semibold tracking-wider uppercase ${
                          b.featured ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {b.kicker}
                      </span>
                    </div>
                    <h3 className="text-xl font-heading font-bold leading-snug mb-3">{b.title}</h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        b.featured ? "text-primary-foreground/90" : "text-muted-foreground"
                      }`}
                    >
                      {b.description}
                    </p>
                    {"highlights" in b && b.highlights && (
                      <div className="mt-6 grid grid-cols-1 gap-2">
                        {b.highlights.map((line) => (
                          <div
                            key={line}
                            className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-sm font-semibold tracking-wide"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section className="relative border-y border-border overflow-hidden">
        <img
          src={PROCESS_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-muted/40" />
        <div className="container mx-auto px-4 sm:px-6 py-16 lg:py-20 relative">
          <ScrollReveal>
            <div className="max-w-3xl mb-10 lg:mb-14">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-3">
                Workforce Pipeline
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
                From Your Requirement to Your Workforce
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 xl:gap-2">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              const last = i === processSteps.length - 1;
              return (
                <ScrollReveal key={step.n} delay={i * 0.05}>
                  <div className="relative h-full rounded-2xl border border-border/70 bg-card p-5">
                    {!last && (
                      <ArrowRight className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 z-10" />
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-semibold text-primary">{step.n}</span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                    {!last && (
                      <p className="xl:hidden text-primary/50 text-center mt-4" aria-hidden>
                        ↓
                      </p>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <ScrollReveal>
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
              Traditional Recruitment vs SafeWork Global
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">
          <ScrollReveal>
            <Card className="h-full border-border/60 bg-muted/20">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl font-heading font-bold mb-6">Traditional Recruitment</h3>
                <ul className="space-y-3">
                  {traditional.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <X className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <Card className="h-full border-primary/30 shadow-md">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl font-heading font-bold mb-6">SafeWork Global</h3>
                <ul className="space-y-3">
                  {safework.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 pb-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-border/60 overflow-hidden bg-card">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-8 sm:p-10 lg:p-12">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-4">
                  You Tell Us the Skill. We Build the Workforce.
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-xl mb-8">
                  From sourcing and skill verification to employer interviews, documentation coordination and deployment support, SafeWork Global helps employers build a structured workforce pipeline from India.
                </p>
                <div className="flex flex-wrap gap-2">
                  {trades.map((trade) => (
                    <span
                      key={trade}
                      className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-sm font-medium"
                    >
                      {trade}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative min-h-[16rem]">
                <img
                  src={UAE_PHOTOS.businessBay1.src}
                  alt={UAE_PHOTOS.businessBay1.alt.en}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl min-h-[22rem]">
            <img
              src={CTA_IMAGE}
              alt={UAE_PHOTOS.crane.alt.en}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/92 via-[#1a2a6c]/90 to-info/80" />
            <div className="relative p-8 sm:p-12 lg:p-16 text-primary-foreground max-w-2xl">
              <Building2 className="h-8 w-8 mb-5 opacity-90" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-4">
                Need Skilled Workers from India?
              </h2>
              <p className="text-base sm:text-lg text-primary-foreground/90 mb-8">
                Tell us your workforce requirement and our team will help build the candidate pipeline.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={postRequirement}
                  className="bg-background text-foreground hover:bg-background/90 gap-2 shadow-lg w-full sm:w-auto"
                >
                  Post Your Requirement
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground w-full sm:w-auto"
                >
                  <Link to="/contact">Talk to SafeWork</Link>
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-primary-foreground/70 leading-relaxed max-w-xl">
                SafeWork Global is a technology and workforce mobility platform. Where overseas recruitment is required, the applicable recruitment process is conducted through the designated licensed Recruitment Agent.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
