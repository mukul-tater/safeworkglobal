import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useWorkerLanguage } from "@/modules/worker-registration";
import { pick } from "@/pages/about/copy";
import {
  EMIGRATE_PORTAL_URL,
  MADAD_PORTAL_URL,
  MEA_PBSK,
  SAFEWORK_CONTACT,
} from "@/config/workerSupport";
import {
  ArrowDown,
  BadgeCheck,
  Building2,
  Check,
  ClipboardCheck,
  ExternalLink,
  FileCheck,
  Globe2,
  GraduationCap,
  Handshake,
  Landmark,
  MapPin,
  Network,
  Phone,
  Scale,
  Shield,
  Sparkles,
  Store,
  UserPlus,
  Video,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

function BilingualHeading({
  as: Tag = "h2",
  en,
  hi,
  align = "center",
  className,
}: {
  as?: "h1" | "h2" | "h3";
  en: string;
  hi: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <Tag
        className={cn(
          "font-bold font-heading tracking-tight text-foreground",
          Tag === "h1" && "text-3xl sm:text-4xl md:text-[2.75rem] leading-tight",
          Tag === "h2" && "text-2xl sm:text-3xl lg:text-4xl leading-tight",
          Tag === "h3" && "text-lg sm:text-xl leading-snug",
        )}
      >
        {en}
      </Tag>
      <p
        lang="hi"
        className={cn(
          "font-heading text-primary/85 mt-1.5",
          Tag === "h1" && "text-lg sm:text-xl",
          Tag === "h2" && "text-base sm:text-lg",
          Tag === "h3" && "text-sm",
        )}
      >
        {hi}
      </p>
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.16em] uppercase bg-primary/10 text-primary mb-4">
      {children}
    </span>
  );
}

export default function AboutUs() {
  const { locale } = useWorkerLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const isHi = locale === "hi";

  const goFindJobs = () => {
    if (!isAuthenticated) return navigate("/jobs");
    if (role === "employer") {
      toast.error(
        pick(locale, "This is an employer account. Switch to a worker account to browse jobs.", "यह एक नियोक्ता खाता है। नौकरियाँ देखने के लिए worker खाते से साइन इन करें।"),
      );
      return;
    }
    navigate("/jobs");
  };

  const goRegisterWorker = () => {
    if (!isAuthenticated) return navigate("/worker/quick-signup");
    if (role === "worker") return navigate("/worker/dashboard");
    if (role === "employer") {
      toast.error(
        pick(locale, "You're signed in as an employer. Sign out to register as a worker.", "आप नियोक्ता के रूप में साइन इन हैं। Worker के रूप में रजिस्टर करने के लिए साइन आउट करें।"),
      );
      return;
    }
    navigate("/worker/quick-signup");
  };

  const goHire = () => {
    if (!isAuthenticated) return navigate("/employer/quick-signup");
    if (role === "employer") return navigate("/employer/dashboard");
    if (role === "worker") {
      toast.error(
        pick(locale, "You're signed in as a worker. Sign out to hire from India.", "आप worker के रूप में साइन इन हैं। भारत से भर्ती के लिए साइन आउट करें।"),
      );
      return;
    }
    navigate("/employer/quick-signup");
  };

  const onboardingFeatures = [
    { en: "Digital registration", hi: "डिजिटल पंजीकरण" },
    { en: "Worker profile", hi: "श्रमिक प्रोफ़ाइल" },
    { en: "Document upload", hi: "दस्तावेज़ अपलोड" },
    { en: "KYC workflow", hi: "KYC प्रक्रिया" },
    { en: "Skill & experience information", hi: "कौशल और अनुभव की जानकारी" },
  ];

  const skillWorkflow = [
    { en: "Registration", hi: "पंजीकरण" },
    { en: "KYC", hi: "KYC" },
    { en: "Technical Screening", hi: "तकनीकी स्क्रीनिंग" },
    { en: "Skill / Trade Test", hi: "कौशल / ट्रेड टेस्ट" },
    { en: "Digital Scorecard", hi: "डिजिटल स्कोरकार्ड" },
    { en: "Verified Profile", hi: "सत्यापित प्रोफ़ाइल" },
  ];

  const indiaCards = [
    { title: "E-MITRA", hi: "ई-मित्र", desc: pick(locale, "Local-level worker registration", "स्थानीय स्तर पर श्रमिक पंजीकरण"), icon: Store },
    { title: "CSC NETWORK", hi: "CSC नेटवर्क", desc: pick(locale, "Rural & semi-urban reach", "ग्रामीण और अर्ध-शहरी पहुँच"), icon: Network },
    { title: "ITIs", hi: "आईटीआई", desc: pick(locale, "Training + skilled workforce", "प्रशिक्षण और कुशल कार्यबल"), icon: GraduationCap },
    { title: "TRADE TEST CENTRES", hi: "ट्रेड टेस्ट सेंटर", desc: pick(locale, "Practical skill verification", "व्यावहारिक कौशल सत्यापन"), icon: Wrench },
    { title: "TRAINING CENTRES", hi: "प्रशिक्षण केंद्र", desc: pick(locale, "Skill development ecosystem", "कौशल विकास पारिस्थितिकी"), icon: Sparkles },
  ];

  const verifySteps = [
    { en: "Profile", hi: "प्रोफ़ाइल", icon: UserPlus },
    { en: "Video KYC", hi: "वीडियो KYC", icon: Video },
    { en: "Technical Interview", hi: "तकनीकी इंटरव्यू", icon: Landmark },
    { en: "Trade Test", hi: "ट्रेड टेस्ट", icon: Wrench },
    { en: "Digital Scorecard", hi: "डिजिटल स्कोरकार्ड", icon: FileCheck },
    { en: "Verified Skill Profile", hi: "सत्यापित कौशल प्रोफ़ाइल", icon: BadgeCheck },
  ];

  const workerJourney = [
    { en: "Local Skill", hi: "स्थानीय कौशल" },
    { en: "Verified Skill", hi: "सत्यापित कौशल" },
    { en: "Global Opportunity", hi: "वैश्विक अवसर" },
    { en: "International Employment", hi: "अंतरराष्ट्रीय रोजगार" },
  ];

  const employerServices = [
    { en: "Workforce sourcing", hi: "कार्यबल सोर्सिंग" },
    { en: "Skill verification", hi: "कौशल सत्यापन" },
    { en: "Trade testing", hi: "ट्रेड टेस्टिंग" },
    { en: "Technical screening", hi: "तकनीकी स्क्रीनिंग" },
    { en: "Candidate profiles", hi: "उम्मीदवार प्रोफ़ाइल" },
    { en: "Documentation coordination", hi: "दस्तावेज़ समन्वय" },
    { en: "Deployment support", hi: "तैनाती सहायता" },
    { en: "Replacement support, where agreed", hi: "सहमति पर replacement सहायता" },
  ];

  const principles = [
    { en: "Safe", hi: "सुरक्षित", icon: Shield, desc: pick(locale, "Worker safety and informed decision-making come first.", "श्रमिक सुरक्षा और सूचित निर्णय सबसे पहले आते हैं।") },
    { en: "Transparent", hi: "पारदर्शी", icon: FileCheck, desc: pick(locale, "Clear information about jobs, processes, requirements and applicable charges.", "नौकरी, प्रक्रिया, आवश्यकताओं और लागू शुल्कों की स्पष्ट जानकारी।") },
    { en: "Skill-First", hi: "कौशल प्रथम", icon: Wrench, desc: pick(locale, "Focus on what a worker can actually do—not just what a resume says.", "ध्यान इस पर कि श्रमिक वास्तव में क्या कर सकता है—सिर्फ़ CV पर क्या लिखा है, उस पर नहीं।") },
    { en: "Ethical", hi: "नैतिक", icon: Handshake, desc: pick(locale, "Building responsible relationships with workers, institutions and employers.", "श्रमिकों, संस्थानों और नियोक्ताओं के साथ ज़िम्मेदार संबंध।") },
    { en: "India-First", hi: "भारत प्रथम", icon: MapPin, desc: pick(locale, "Building opportunities for skilled workers across India's cities, towns and villages.", "भारत के शहरों, कस्बों और गाँवों के कुशल श्रमिकों के लिए अवसर।") },
    { en: "Global", hi: "वैश्विक", icon: Globe2, desc: pick(locale, "Connecting Indian skills with international workforce demand.", "भारतीय कौशल को अंतरराष्ट्रीय माँग से जोड़ना।") },
  ];

  const whyPoints = [
    { en: "India-wide worker onboarding ecosystem", hi: "भारत-व्यापी श्रमिक पंजीकरण नेटवर्क" },
    { en: "Skill-first worker profiles", hi: "कौशल-प्रथम प्रोफ़ाइल" },
    { en: "Standardized skill verification approach", hi: "मानकीकृत कौशल सत्यापन" },
    { en: "Technology-enabled workflow", hi: "तकनीक-आधारित वर्कफ़्लो" },
    { en: "Global employer connectivity", hi: "वैश्विक नियोक्ता कनेक्टिविटी" },
    { en: "Partner-driven physical infrastructure", hi: "साझेदार-आधारित भौतिक इंफ्रास्ट्रक्चर" },
    { en: "Transparent workforce mobility process", hi: "पारदर्शी workforce mobility प्रक्रिया" },
    { en: "Licensed recruitment partner model", hi: "लाइसेंस्ड भर्ती-साझेदार मॉडल" },
  ];

  const trustPoints = [
    { en: "Transparent process", hi: "पारदर्शी प्रक्रिया" },
    { en: "Verified opportunities", hi: "सत्यापित अवसर" },
    { en: "Clear employment information", hi: "स्पष्ट रोजगार जानकारी" },
    { en: "Skill verification", hi: "कौशल सत्यापन" },
    { en: "Documentation support", hi: "दस्तावेज़ सहायता" },
    { en: "No false job promises", hi: "झूठे नौकरी वादे नहीं" },
    { en: "Recruitment through applicable legal channels", hi: "लागू कानूनी माध्यमों से भर्ती" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <SEOHead
        title="About SafeWork Global"
        description="SafeWork Global is a technology and workforce mobility platform connecting India's skilled workforce with global employment opportunities through worker onboarding, skill verification and a transparent workforce ecosystem."
        keywords="SafeWork Global, workforce mobility, skilled workers India, overseas employment, skill verification, GCC jobs"
        canonicalUrl="https://www.safeworkglobal.com/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About SafeWork Global",
          url: "https://www.safeworkglobal.com/about",
          description:
            "SafeWork Global is a technology and workforce mobility platform connecting India's skilled workforce with global employment opportunities.",
          mainEntity: {
            "@type": "Organization",
            name: "SafeWork Global",
            legalName: SAFEWORK_CONTACT.operatingCompany,
            url: SAFEWORK_CONTACT.websiteUrl,
            founder: { "@type": "Person", name: SAFEWORK_CONTACT.founderName },
          },
        }}
      />
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-14 sm:py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(230_85%_55%/0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(192_95%_48%/0.08),transparent_45%)]" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  About SafeWork Global
                </p>
                <p lang="hi" className="text-sm text-primary mb-5">
                  हमारे बारे में
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight leading-[1.15] mb-3">
                  <span lang="hi">भारत का हुनर, दुनिया के रोज़गार।</span>
                </h1>
                <p className="text-xl sm:text-2xl font-heading font-semibold text-primary mb-6">
                  Indian Skills. Global Opportunities.
                </p>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-5">
                  {pick(locale, "India's Workforce Mobility Infrastructure", "भारत का Workforce Mobility Infrastructure")}
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                  {pick(
                    locale,
                    "SafeWork Global is a technology and workforce mobility platform built to connect India's skilled workforce with trusted global employment opportunities through a structured, transparent and skill-first ecosystem.",
                    "SafeWork Global एक तकनीक और workforce mobility प्लेटफ़ॉर्म है, जो भारत के कुशल कार्यबल को विश्वसनीय वैश्विक रोजगार से जोड़ता है — एक व्यवस्थित, पारदर्शी और कौशल-प्रथम व्यवस्था के ज़रिए।",
                  )}
                </p>
                <p className="text-base text-muted-foreground leading-relaxed mb-8">
                  {pick(
                    locale,
                    "We believe that skilled electricians, plumbers, welders, fitters, HVAC technicians, drivers, construction workers and other skilled professionals should have access to a transparent pathway to global employment.",
                    "हम मानते हैं कि कुशल इलेक्ट्रीशियन, प्लंबर, वेल्डर, फिटर, HVAC तकनीशियन, ड्राइवर, निर्माण श्रमिक और अन्य कुशल पेशेवरों को वैश्विक रोजगार का एक पारदर्शी रास्ता मिलना चाहिए।",
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-12 rounded-xl" onClick={goFindJobs}>
                    Find Jobs | नौकरी खोजें
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 rounded-xl" asChild>
                    <Link to="/partner/register">Partner With Us | साझेदार बनें</Link>
                  </Button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.08}>
                <div className="relative rounded-3xl border border-border/60 bg-card/80 p-6 sm:p-8 overflow-hidden">
                  <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-info/10 blur-3xl" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6 relative">
                    {pick(locale, "A structured pathway", "एक व्यवस्थित मार्ग")}
                  </p>
                  <div className="relative space-y-3">
                    {[
                      { label: "INDIA", hi: "भारत", icon: MapPin, note: pick(locale, "Skilled workforce", "कुशल कार्यबल") },
                      { label: "VERIFIED SKILLS", hi: "सत्यापित कौशल", icon: BadgeCheck, note: pick(locale, "Evidence, not just a CV", "सिर्फ़ CV नहीं — प्रमाण") },
                      { label: "GLOBAL EMPLOYERS", hi: "वैश्विक नियोक्ता", icon: Globe2, note: pick(locale, "Trusted demand", "विश्वसनीय माँग") },
                    ].map((node, i) => (
                      <div key={node.label}>
                        <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/80 p-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shrink-0">
                            <node.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-heading font-semibold tracking-wide">{node.label}</p>
                            <p lang="hi" className="text-xs text-primary/80">
                              {node.hi}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{node.note}</p>
                          </div>
                        </div>
                        {i < 2 && (
                          <div className="flex justify-center py-1 text-primary/40" aria-hidden>
                            <ArrowDown className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-8">
                <SectionEyebrow>Our Mission | हमारा मिशन</SectionEyebrow>
                <BilingualHeading en="Our Mission" hi="हमारा मिशन" />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-info/[0.05] max-w-4xl mx-auto">
                <CardContent className="p-6 sm:p-10">
                  <p className="text-xl sm:text-2xl font-heading font-semibold text-foreground leading-snug">
                    {pick(
                      locale,
                      "To make global employment safer, more transparent and more accessible for India's skilled workforce.",
                      "भारत के skilled workers के लिए global employment को अधिक सुरक्षित, पारदर्शी और सुलभ बनाना।",
                    )}
                  </p>
                  {!isHi && (
                    <p lang="hi" className="text-base text-primary/80 mt-4 leading-relaxed">
                      भारत के skilled workers के लिए global employment को अधिक सुरक्षित, पारदर्शी और सुलभ बनाना।
                    </p>
                  )}
                  <p className="text-muted-foreground mt-6 leading-relaxed">
                    {pick(
                      locale,
                      "SafeWork aims to reduce information gaps between workers and employers, improve visibility of genuine skills, and create a structured pathway from Indian skill to global employment.",
                      "SafeWork का उद्देश्य श्रमिकों और नियोक्ताओं के बीच जानकारी की कमी कम करना, वास्तविक कौशल को दिखाना, और भारतीय कौशल से वैश्विक रोजगार तक एक व्यवस्थित मार्ग बनाना है।",
                    )}
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* What we do */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <BilingualHeading en="What We Do" hi="हम क्या करते हैं" />
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
              <ScrollReveal>
                <Card className="h-full border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-4">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg">Worker Onboarding</h3>
                    <p lang="hi" className="text-sm text-primary/80 mb-3">
                      श्रमिक पंजीकरण
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {pick(
                        locale,
                        "Workers can register through our digital platform and our growing network of onboarding partners including E-Mitra centres, CSC-linked channels, ITIs and training institutions.",
                        "श्रमिक हमारे डिजिटल प्लेटफ़ॉर्म और ई-मित्र केंद्र, CSC-संबद्ध माध्यम, ITI और प्रशिक्षण संस्थानों सहित बढ़ते साझेदार नेटवर्क से पंजीकरण कर सकते हैं।",
                      )}
                    </p>
                    <ul className="space-y-1.5">
                      {onboardingFeatures.map((f) => (
                        <li key={f.en} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          {pick(locale, f.en, f.hi)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.05}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    <div className="inline-flex p-2.5 rounded-xl bg-info/10 mb-4">
                      <ClipboardCheck className="h-5 w-5 text-info" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg">Skill Verification</h3>
                    <p lang="hi" className="text-sm text-primary/80 mb-3">
                      कौशल सत्यापन
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {pick(
                        locale,
                        "A worker's experience should be more than a statement on a CV.",
                        "श्रमिक का अनुभव सिर्फ़ CV पर लिखी बात नहीं होना चाहिए।",
                      )}
                    </p>
                    <ol className="space-y-2">
                      {skillWorkflow.map((step, i) => (
                        <li key={step.en} className="flex items-center gap-2 text-sm">
                          <span className="h-6 w-6 rounded-full bg-muted text-[11px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span>{pick(locale, step.en, step.hi)}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    <div className="inline-flex p-2.5 rounded-xl bg-secondary/10 mb-4">
                      <Building2 className="h-5 w-5 text-secondary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg leading-snug">Global Employer Connectivity</h3>
                    <p lang="hi" className="text-sm text-primary/80 mb-3">
                      वैश्विक नियोक्ता कनेक्टिविटी
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pick(
                        locale,
                        "We work with employers and manpower organizations in international markets to understand workforce requirements and build verified candidate pipelines from India.",
                        "हम अंतरराष्ट्रीय बाज़ारों के नियोक्ताओं और manpower संगठनों के साथ काम करते हैं, उनकी ज़रूरतें समझते हैं, और भारत से सत्यापित उम्मीदवार पाइपलाइन तैयार करते हैं।",
                      )}
                    </p>
                    <p className="text-sm text-foreground/80 mt-4 rounded-xl bg-muted/60 px-3 py-2">
                      {pick(locale, "Initial focus: GCC markets, including UAE.", "शुरुआती ध्यान: GCC बाज़ार, जिसमें UAE शामिल है।")}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.15}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    <div className="inline-flex p-2.5 rounded-xl bg-success/10 mb-4">
                      <Scale className="h-5 w-5 text-success" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg">Recruitment & Deployment</h3>
                    <p lang="hi" className="text-sm text-primary/80 mb-3">
                      भर्ती एवं तैनाती
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pick(
                        locale,
                        "Where overseas recruitment requires a registered Recruitment Agent, the regulated recruitment process is conducted through our designated licensed recruitment partner.",
                        "जहाँ विदेश भर्ती के लिए पंजीकृत Recruitment Agent आवश्यक है, वह नियमित प्रक्रिया हमारे designated लाइसेंस्ड भर्ती साझेदार के माध्यम से होती है।",
                      )}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Built for India */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <BilingualHeading en="Built for India" hi="भारत के लिए बनाया गया" />
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {pick(
                    locale,
                    "India has millions of skilled workers across cities, towns and villages. Our approach is therefore India-first and network-driven.",
                    "भारत में शहरों, कस्बों और गाँवों में लाखों कुशल श्रमिक हैं। इसलिए हमारा दृष्टिकोण भारत-प्रथम और नेटवर्क-आधारित है।",
                  )}
                </p>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {indiaCards.map((card, i) => (
                <ScrollReveal key={card.title} delay={i * 0.04}>
                  <Card className="h-full border-border/50">
                    <CardContent className="p-5">
                      <card.icon className="h-5 w-5 text-primary mb-3" />
                      <h3 className="font-heading font-semibold text-sm tracking-wide">{card.title}</h3>
                      <p lang="hi" className="text-xs text-primary/80 mb-2">
                        {card.hi}
                      </p>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Skill verification */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-10">
                <BilingualHeading
                  en="Don't Just Tell Employers Your Skill. Show Them."
                  hi="अपने कौशल की सिर्फ़ जानकारी न दें — उसे साबित करें।"
                />
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {pick(
                    locale,
                    "SafeWork's skill-verification ecosystem is designed to create structured evidence of a worker's practical capabilities. Candidates may undergo steps as required by the trade, employer or process — not every candidate automatically receives every test.",
                    "SafeWork का कौशल-सत्यापन तंत्र श्रमिक की व्यावहारिक क्षमता का व्यवस्थित प्रमाण बनाने के लिए है। उम्मीदवार trade, नियोक्ता या प्रक्रिया के अनुसार चरणों से गुज़र सकते हैं — हर उम्मीदवार को हर टेस्ट अपने आप नहीं मिलता।",
                  )}
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {verifySteps.map((step, i) => (
                <ScrollReveal key={step.en} delay={i * 0.04}>
                  <div className="rounded-2xl border border-border/50 bg-card p-4 text-center h-full">
                    <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold font-heading">{pick(locale, step.en, step.hi)}</p>
                    {i < verifySteps.length - 1 && (
                      <p className="lg:hidden text-[10px] text-primary/50 mt-2">↓</p>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal>
              <Card className="border-border/50 max-w-3xl mx-auto">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-1">SafeWork Skill Verification Network</h3>
                  <p lang="hi" className="text-sm text-primary/80 mb-3">
                    SafeWork कौशल सत्यापन नेटवर्क
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick(
                      locale,
                      "Partners can include ITIs, training institutions, Trade Test Centres and assessment partners.",
                      "साझेदारों में ITI, प्रशिक्षण संस्थान, ट्रेड टेस्ट सेंटर और आकलन साझेदार शामिल हो सकते हैं।",
                    )}
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* For workers */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <ScrollReveal>
                <BilingualHeading
                  align="left"
                  en="Your Skill. Your Identity. Your Global Career."
                  hi="आपकी Skill, आपकी पहचान, आपका Global Career."
                />
                <p className="text-muted-foreground mt-4 leading-relaxed mb-6">
                  {pick(
                    locale,
                    "SafeWork aims to help workers build a structured digital profile and access verified international employment opportunities through a transparent process.",
                    "SafeWork का उद्देश्य श्रमिकों को एक व्यवस्थित डिजिटल प्रोफ़ाइल बनाने और पारदर्शी प्रक्रिया से सत्यापित अंतरराष्ट्रीय रोजगार तक पहुँचने में मदद करना है।",
                  )}
                </p>
                <Button size="lg" className="h-12 rounded-xl w-full sm:w-auto" onClick={goRegisterWorker}>
                  Register as Worker | Worker के रूप में रजिस्टर करें
                </Button>
              </ScrollReveal>
              <ScrollReveal delay={0.08}>
                <div className="grid grid-cols-2 gap-3">
                  {workerJourney.map((step, i) => (
                    <div key={step.en} className="rounded-2xl border border-border/50 bg-card p-5">
                      <p className="text-xs font-semibold text-primary mb-2">0{i + 1}</p>
                      <p className="font-heading font-semibold">{pick(locale, step.en, step.hi)}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* For employers */}
        <section className="py-14 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <BilingualHeading en="Verified Indian Workforce. One Platform." hi="Verified Indian Workforce. एक Platform." />
              </div>
            </ScrollReveal>
            <div className="grid lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              <ScrollReveal className="lg:col-span-2">
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold mb-4">
                      {pick(locale, "Employer services", "नियोक्ता सेवाएँ")}
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-2.5">
                      {employerServices.map((s) => (
                        <li key={s.en} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          {pick(locale, s.en, s.hi)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>
              <ScrollReveal delay={0.08}>
                <Card className="h-full border-primary/20 bg-primary/[0.04]">
                  <CardContent className="p-6 flex flex-col justify-center h-full">
                    <Button className="w-full h-12 rounded-xl" onClick={goHire}>
                      Hire from India | भारत से भर्ती करें
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <BilingualHeading en="Our Principles" hi="हमारे सिद्धांत" />
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {principles.map((p, i) => (
                <ScrollReveal key={p.en} delay={i * 0.04}>
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <p.icon className="h-5 w-5 text-primary mb-3" />
                      <h3 className="font-heading font-semibold text-lg uppercase tracking-wide">{p.en}</h3>
                      <p lang="hi" className="text-sm text-primary/80 mb-2">
                        {p.hi}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(230_25%_10%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(230_85%_55%/0.22),transparent_50%),radial-gradient(ellipse_at_bottom_left,hsl(192_95%_48%/0.12),transparent_45%)]" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
            <ScrollReveal>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-white tracking-tight">
                Building India's Workforce Mobility Infrastructure
              </h2>
              <p className="text-white/70 mt-6 leading-relaxed">
                {pick(
                  locale,
                  "We envision a future where every skilled worker can build a verified digital skill profile, every employer can access reliable and assessed talent, and every worker can understand the employment process before making a decision.",
                  "हम एक ऐसा भविष्य देखते हैं जहाँ हर कुशल श्रमिक एक सत्यापित डिजिटल कौशल प्रोफ़ाइल बना सके, हर नियोक्ता विश्वसनीय और मूल्यांकित प्रतिभा तक पहुँच सके, और हर श्रमिक निर्णय से पहले प्रक्रिया समझ सके।",
                )}
              </p>
              <p className="text-xl sm:text-2xl font-heading font-semibold text-white mt-10">
                India's skills should not be limited by geography.
              </p>
              <p lang="hi" className="text-base sm:text-lg text-white/75 mt-2">
                भारत का कौशल सिर्फ़ सीमाओं तक सीमित नहीं होना चाहिए।
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Why SafeWork */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <BilingualHeading en="Why SafeWork Global?" hi="SafeWork Global क्यों?" />
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-3">
              {whyPoints.map((p) => (
                <div key={p.en} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">{pick(locale, p.en, p.hi)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust + government */}
        <section className="py-14 md:py-20 border-y border-[#c4a35a]/35 bg-[#f7f4ec] dark:bg-[#1a1c18] dark:border-[#c4a35a]/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#1e2a4a] dark:text-[#e8eadf]">
                  Safe Migration. SafeWork.
                </h2>
                <p lang="hi" className="text-lg text-[#1e2a4a]/75 dark:text-[#e8eadf]/75 mt-1">
                  सुरक्षित विदेश रोजगार के लिए हमारी प्रतिबद्धता
                </p>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
              {trustPoints.map((p) => (
                <div
                  key={p.en}
                  className="rounded-xl border border-[#1e2a4a]/10 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 px-4 py-3 text-sm text-[#1e2a4a] dark:text-[#e8eadf]"
                >
                  {pick(locale, p.en, p.hi)}
                </div>
              ))}
            </div>

            <ScrollReveal>
              <h3 className="font-heading font-semibold text-lg text-[#1e2a4a] dark:text-[#e8eadf] mb-1">
                Government Resources
              </h3>
              <p lang="hi" className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mb-4">
                सरकारी संसाधन
              </p>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <a
                href={EMIGRATE_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] p-5 hover:border-primary/40 transition-colors"
              >
                <p className="font-heading font-semibold text-[#1e2a4a] dark:text-[#e8eadf]">eMigrate Portal</p>
                <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-1">
                  {pick(locale, "Official overseas employment portal", "आधिकारिक विदेश रोजगार पोर्टल")}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                  Visit <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
              <a
                href={MADAD_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] p-5 hover:border-primary/40 transition-colors"
              >
                <p className="font-heading font-semibold text-[#1e2a4a] dark:text-[#e8eadf]">MADAD Portal</p>
                <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-1">
                  {pick(locale, "Official grievance / help channel", "आधिकारिक शिकायत / सहायता माध्यम")}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                  Visit <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
              <div className="rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] p-5">
                <p className="font-heading font-semibold text-[#1e2a4a] dark:text-[#e8eadf]">{MEA_PBSK.name}</p>
                <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-1">
                  {pick(locale, "MEA overseas employment assistance", "विदेश मंत्रालय विदेश रोजगार सहायता")}
                </p>
                <a href={MEA_PBSK.phoneTel} className="inline-flex items-center gap-2 text-sm font-semibold mt-3 text-[#1e2a4a] dark:text-[#e8eadf]">
                  <Phone className="h-4 w-4" />
                  {MEA_PBSK.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
