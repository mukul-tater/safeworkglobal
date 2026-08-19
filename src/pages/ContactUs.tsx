import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MapPin,
  Loader2,
  Send,
  Phone,
  MessageCircle,
  HardHat,
  Briefcase,
  Handshake,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/validations/common";
import {
  EMIGRATE_PORTAL_URL,
  MEA_PBSK,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from "@/config/workerSupport";

const ENQUIRY_ROLES = [
  { value: "worker", label: "Worker / श्रमिक" },
  { value: "employer", label: "Employer / नियोक्ता" },
  { value: "emitra", label: "E-Mitra Partner" },
  { value: "iti", label: "ITI / Training Institute" },
  { value: "ttc", label: "Trade Test Centre" },
  { value: "other", label: "Other" },
] as const;

type EnquiryRole = (typeof ENQUIRY_ROLES)[number]["value"];

const CATEGORIES = [
  {
    key: "workers",
    icon: HardHat,
    title: "Workers",
    hindi: "श्रमिकों के लिए",
    items: [
      "Job enquiries",
      "Registration assistance",
      "Skill verification",
      "Application status",
      "Documentation assistance",
    ],
    cta: "Worker Support",
    to: "/worker/quick-signup",
    role: "worker" as EnquiryRole,
  },
  {
    key: "employers",
    icon: Briefcase,
    title: "Employers",
    hindi: "नियोक्ताओं के लिए",
    items: [
      "Skilled manpower requirements",
      "Employer onboarding",
      "Workforce enquiries",
      "Partnership discussions",
    ],
    cta: "Hire Skilled Workers",
    to: "/employer/quick-signup",
    role: "employer" as EnquiryRole,
  },
  {
    key: "partners",
    icon: Handshake,
    title: "Partners",
    hindi: "साझेदारों के लिए",
    items: [
      "E-Mitra partnership",
      "ITI partnership",
      "Trade Test Centre partnership",
      "Training Centre partnership",
    ],
    cta: "Become a Partner",
    to: "/partner/register",
    role: "emitra" as EnquiryRole,
  },
  {
    key: "general",
    icon: HelpCircle,
    title: "General Enquiries",
    hindi: "सामान्य पूछताछ",
    items: ["General information", "Business enquiries", "Other support"],
    cta: null,
    to: "#enquiry",
    role: "other" as EnquiryRole,
  },
] as const;

function BilingualLabel({ en, hi, htmlFor }: { en: string; hi: string; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
      {en}
      <span className="ml-1.5 font-normal text-muted-foreground">{hi}</span>
    </Label>
  );
}

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "" as EnquiryRole | "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollToEnquiry = (role?: EnquiryRole) => {
    if (role) setFormData((prev) => ({ ...prev, role }));
    document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error("Please select who you are. / कृपया चुनें कि आप कौन हैं।");
      return;
    }
    if (!isValidIndianMobile(formData.mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number. / सही 10 अंकों का मोबाइल नंबर लिखें।");
      return;
    }

    const roleLabel = ENQUIRY_ROLES.find((r) => r.value === formData.role)?.label ?? formData.role;
    const mobile = normalizeIndianMobile(formData.mobile);

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: [
          `I am: ${roleLabel}`,
          `Mobile: ${mobile}`,
          "",
          formData.message.trim(),
        ].join("\n"),
      });
      if (error) throw error;
      setSubmitted(true);
      setFormData({ name: "", mobile: "", email: "", role: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send enquiry. Please try again. / पूछताछ नहीं भेजी जा सकी।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-32 md:pb-0">
      <SEOHead
        title="Contact Us | SafeWork Global"
        description="Connect with SafeWork Global for worker registration, skill verification, employer enquiries, partnership opportunities and overseas employment support."
        canonicalUrl="https://safeworkglobal.com/contact"
      />
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-14 sm:py-20 md:py-24 bg-gradient-to-b from-primary/[0.06] to-background">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold font-heading text-foreground mb-2 tracking-tight leading-tight">
                Need Help With Overseas Employment?
              </h1>
              <p className="text-lg sm:text-xl font-heading text-primary/90 mb-5">
                विदेश रोजगार से जुड़ी सहायता चाहिए?
              </p>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connect with SafeWork Global for worker registration, skill verification, employer
                enquiries, partnership opportunities and overseas employment support.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-lg mx-auto sm:max-w-none">
                <Button asChild size="lg" className="h-12 rounded-xl text-base">
                  <a href={getSafeworkMailtoUrl("SafeWork Global – Call request")}>
                    <Phone className="h-5 w-5" />
                    Call Us
                  </a>
                </Button>
                <Button asChild size="lg" variant="success" className="h-12 rounded-xl text-base">
                  <a href={getSafeworkMailtoUrl("SafeWork Global – WhatsApp enquiry")}>
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl text-base"
                  onClick={() => scrollToEnquiry()}
                >
                  <Send className="h-5 w-5" />
                  Send Enquiry
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <a href={getSafeworkMailtoUrl()} className="font-medium text-primary hover:underline">
                  {SAFEWORK_CONTACT.email}
                </a>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
              {CATEGORIES.map((cat, i) => (
                <ScrollReveal key={cat.key} delay={i * 0.05}>
                  <Card className="h-full border-border/60 hover:border-primary/30 hover:shadow-md transition-all">
                    <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                          <cat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold font-heading uppercase tracking-wide">
                            {cat.title}
                          </h2>
                          <p className="text-sm text-muted-foreground">{cat.hindi}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        For
                      </p>
                      <ul className="space-y-1.5 text-sm text-foreground/80 mb-5 flex-1">
                        {cat.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {cat.cta ? (
                        <Button asChild className="w-full h-11 rounded-xl" variant={cat.key === "workers" ? "default" : "outline"}>
                          <Link to={cat.to}>{cat.cta}</Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11 rounded-xl"
                          onClick={() => scrollToEnquiry(cat.role)}
                        >
                          Send Enquiry
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="enquiry" className="py-12 md:py-16 scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading">Send an Enquiry</h2>
                <p className="text-muted-foreground mt-1">पूछताछ भेजें</p>
              </div>
            </ScrollReveal>

            {submitted ? (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-8 sm:p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2">Enquiry received</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you. Our team will review your message and get back to you shortly.
                  </p>
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    धन्यवाद। हमारी टीम आपकी पूछताछ देखकर शीघ्र संपर्क करेगी।
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another enquiry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollReveal delay={0.05}>
                <Card className="border-border/50">
                  <CardContent className="p-5 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <BilingualLabel en="Full Name" hi="पूरा नाम" htmlFor="name" />
                          <Input
                            id="name"
                            className="h-12"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <BilingualLabel en="Mobile Number" hi="मोबाइल नंबर" htmlFor="mobile" />
                          <Input
                            id="mobile"
                            className="h-12"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={formData.mobile}
                            onChange={(e) =>
                              setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
                            }
                            required
                            autoComplete="tel"
                          />
                        </div>
                      </div>

                      <div>
                        <BilingualLabel en="Email" hi="ईमेल" htmlFor="email" />
                        <Input
                          id="email"
                          type="email"
                          className="h-12"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          autoComplete="email"
                        />
                      </div>

                      <div>
                        <BilingualLabel en="I am" hi="" />
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value as EnquiryRole })}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select / चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            {ENQUIRY_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value} className="py-2.5">
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <BilingualLabel en="Subject" hi="विषय" htmlFor="subject" />
                        <Input
                          id="subject"
                          className="h-12"
                          placeholder="How can we help?"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <BilingualLabel en="Message" hi="संदेश" htmlFor="message" />
                        <Textarea
                          id="message"
                          rows={5}
                          className="min-h-[120px]"
                          placeholder="Tell us more… / और बताएँ…"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full h-12 rounded-xl text-base" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Submit Enquiry | पूछताछ भेजें
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* Official Government Resources */}
        <section
          id="government-resources"
          className="py-14 md:py-20 scroll-mt-16 border-y border-[#c4a35a]/35 bg-[#f7f4ec] dark:bg-[#1a1c18] dark:border-[#c4a35a]/20"
        >
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <ScrollReveal>
              <div className="text-center mb-10">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5c1e] dark:text-[#e0c27a] mb-3">
                  Government of India
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#1e2a4a] dark:text-[#e8eadf]">
                  Official Government Resources
                </h2>
                <p className="mt-1 text-lg text-[#1e2a4a]/75 dark:text-[#e8eadf]/75">
                  आधिकारिक सरकारी सहायता
                </p>
                <p className="mt-4 text-sm sm:text-base text-[#1e2a4a]/80 dark:text-[#e8eadf]/80 max-w-2xl mx-auto leading-relaxed">
                  For official information, Recruiting Agent verification and overseas
                  employment-related assistance, workers and prospective emigrants can use the
                  Government of India&apos;s official channels.
                </p>
                <p className="mt-3 text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 max-w-2xl mx-auto leading-relaxed">
                  आधिकारिक जानकारी, Recruiting Agent सत्यापन और विदेश रोजगार से संबंधित सहायता के
                  लिए उम्मीदवार भारत सरकार के आधिकारिक माध्यमों का उपयोग कर सकते हैं।
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <ScrollReveal>
                <article className="h-full rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e2a4a]/8 text-[#1e2a4a] dark:bg-[#e8eadf]/10 dark:text-[#e8eadf] text-xl">
                      <Search className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-lg text-[#1e2a4a] dark:text-[#e8eadf]">
                        eMigrate Portal
                      </h3>
                      <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-0.5">
                        Government of India&apos;s official overseas employment portal
                      </p>
                      <p className="text-sm text-[#1e2a4a]/60 dark:text-[#e8eadf]/60">
                        भारत सरकार का आधिकारिक विदेश रोजगार पोर्टल
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full h-12 rounded-xl bg-[#1e2a4a] hover:bg-[#162038] text-white">
                    <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                      Visit eMigrate | eMigrate पर जाएं
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </article>
              </ScrollReveal>

              <ScrollReveal delay={0.05}>
                <article className="h-full rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e2a4a]/8 text-[#1e2a4a] dark:bg-[#e8eadf]/10 dark:text-[#e8eadf]">
                      <Phone className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-lg text-[#1e2a4a] dark:text-[#e8eadf] leading-snug">
                        {MEA_PBSK.name}
                      </h3>
                      <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-0.5">
                        24×7 Overseas Employment Assistance
                      </p>
                      <p className="text-sm text-[#1e2a4a]/60 dark:text-[#e8eadf]/60">
                        24×7 विदेश रोजगार सहायता
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <a
                      href={MEA_PBSK.phoneTel}
                      className="flex items-center gap-3 rounded-xl border border-[#1e2a4a]/10 bg-[#f7f4ec] dark:bg-[#1a1c18] px-4 py-3 min-h-12"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-[#1e2a4a] dark:text-[#e8eadf]" />
                      <span className="font-bold text-base text-[#1e2a4a] dark:text-[#e8eadf]">
                        {MEA_PBSK.phoneDisplay}
                      </span>
                    </a>
                    <a
                      href={MEA_PBSK.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-[#1e2a4a]/10 bg-[#f7f4ec] dark:bg-[#1a1c18] px-4 py-3 min-h-12"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-[#1e2a4a] dark:text-[#e8eadf]" />
                      <span>
                        <span className="block text-[11px] uppercase tracking-wider text-[#1e2a4a]/55 dark:text-[#e8eadf]/55">
                          WhatsApp
                        </span>
                        <span className="font-semibold text-[#1e2a4a] dark:text-[#e8eadf]">
                          {MEA_PBSK.whatsappDisplay}
                        </span>
                      </span>
                    </a>
                    <a
                      href={`mailto:${MEA_PBSK.email}`}
                      className="flex items-center gap-3 rounded-xl border border-[#1e2a4a]/10 bg-[#f7f4ec] dark:bg-[#1a1c18] px-4 py-3 min-h-12"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-[#1e2a4a] dark:text-[#e8eadf]" />
                      <span className="font-semibold text-[#1e2a4a] dark:text-[#e8eadf] break-all">
                        {MEA_PBSK.email}
                      </span>
                    </a>
                  </div>
                </article>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <div className="mt-5 rounded-2xl border border-dashed border-[#1e2a4a]/20 bg-white/70 dark:bg-[#12140f]/70 dark:border-[#e8eadf]/15 p-5 sm:px-6">
                <h3 className="font-heading font-semibold text-[#1e2a4a] dark:text-[#e8eadf]">
                  Overseas / Chargeable Assistance
                </h3>
                <p className="text-sm text-[#1e2a4a]/65 dark:text-[#e8eadf]/65 mb-3">
                  विदेश से / अतिरिक्त सहायता
                </p>
                <p className="text-xs sm:text-sm text-[#1e2a4a]/75 dark:text-[#e8eadf]/75 mb-3 leading-relaxed">
                  Additional assistance number based on official MEA information. Standard
                  international or chargeable calling rates may apply.
                </p>
                <a
                  href={MEA_PBSK.overseasPhoneTel}
                  className="inline-flex items-center gap-2 min-h-12 rounded-xl bg-[#1e2a4a] px-4 py-2.5 text-white font-semibold"
                >
                  <Phone className="h-4 w-4" />
                  {MEA_PBSK.overseasPhoneDisplay}
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SafeWork contact */}
        <section id="safework-contact" className="py-12 md:py-16 scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading">Talk to SafeWork Global</h2>
                <p className="text-muted-foreground mt-1">SafeWork Global से संपर्क करें</p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Phone</p>
                    <a href={getSafeworkMailtoUrl("SafeWork Global – Call request")} className="text-sm font-semibold text-foreground hover:text-primary">
                      {SAFEWORK_CONTACT.email}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">Email us to request a call</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">WhatsApp</p>
                    <a href={getSafeworkMailtoUrl("SafeWork Global – WhatsApp enquiry")} className="text-sm font-semibold text-foreground hover:text-primary">
                      {SAFEWORK_CONTACT.email}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">Write to us and we will follow up</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</p>
                    <a href={getSafeworkMailtoUrl()} className="text-sm font-semibold text-foreground hover:text-primary break-all">
                      {SAFEWORK_CONTACT.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Office Address
                    </p>
                    <p className="text-sm font-semibold text-foreground">{SAFEWORK_CONTACT.officeAddress}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile-first contact actions */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-2 shadow-lg">
          <a
            href={MEA_PBSK.phoneTel}
            className="flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl px-1 py-2 text-foreground bg-muted"
          >
            <Phone className="h-5 w-5" />
            <span className="text-[10px] font-semibold leading-tight text-center">Call</span>
            <span className="text-[9px] text-muted-foreground">MEA</span>
          </a>
          <a
            href={MEA_PBSK.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl px-1 py-2 text-[#128C7E] bg-[#128C7E]/10"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] font-semibold leading-tight text-center">WhatsApp</span>
            <span className="text-[9px] text-muted-foreground">MEA</span>
          </a>
          <a
            href={getSafeworkMailtoUrl()}
            className="flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl px-1 py-2 text-primary bg-primary/10"
          >
            <Mail className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Email</span>
            <span className="text-[9px] text-muted-foreground">SafeWork</span>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
