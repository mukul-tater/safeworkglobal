import { useState } from "react";
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
  CheckCircle2,
  ExternalLink,
  Search,
  LifeBuoy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/validations/common";
import {
  EMIGRATE_PORTAL_URL,
  MADAD_PORTAL_URL,
  MEA_PBSK,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from "@/config/workerSupport";

const ENQUIRY_ROLES = [
  { value: "worker", en: "Worker", hi: "श्रमिक" },
  { value: "employer", en: "Employer", hi: "नियोक्ता" },
  { value: "emitra", en: "E-Mitra Partner", hi: "ई-मित्र साझेदार" },
  { value: "iti", en: "ITI / Training Institute", hi: "ITI / प्रशिक्षण संस्थान" },
  { value: "ttc", en: "Trade Test Centre", hi: "ट्रेड टेस्ट सेंटर" },
  { value: "other", en: "Other", hi: "अन्य" },
] as const;

type EnquiryRole = (typeof ENQUIRY_ROLES)[number]["value"];

function BilingualLabel({ en, hi, htmlFor }: { en: string; hi: string; htmlFor?: string }) {
  const { locale } = useI18n();
  return (
    <Label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
      {locale === "hi" && hi ? hi : en}
    </Label>
  );
}

export default function ContactUs() {
  const { t, locale } = useI18n();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error(locale === "hi" ? "कृपया चुनें कि आप कौन हैं।" : "Please select who you are.");
      return;
    }
    if (!isValidIndianMobile(formData.mobile)) {
      toast.error(
        locale === "hi"
          ? "सही 10 अंकों का मोबाइल नंबर लिखें।"
          : "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    const roleRow = ENQUIRY_ROLES.find((r) => r.value === formData.role);
    const roleLabel = roleRow ? (locale === "hi" ? roleRow.hi : roleRow.en) : formData.role;
    const mobile = normalizeIndianMobile(formData.mobile);
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("contact_submissions").insert({
        name,
        email,
        subject,
        message: [`I am: ${roleLabel}`, `Mobile: ${mobile}`, "", message].join("\n"),
      });
      if (insertError) throw insertError;

      const { error: emailError } = await supabase.functions.invoke("contact-enquiry", {
        body: { name, email, mobile, role: roleLabel, subject, message },
      });
      if (emailError) {
        console.error("Enquiry saved but email dispatch failed:", emailError);
      }

      setSubmitted(true);
      setFormData({ name: "", mobile: "", email: "", role: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error(locale === "hi" ? "पूछताछ नहीं भेजी जा सकी।" : "Failed to send enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0 overflow-x-hidden">
      <SEOHead
        title="Contact SafeWork Global"
        description="Connect with SafeWork Global for worker registration, skill verification, employer enquiries, partnership opportunities and overseas employment support."
        canonicalUrl="https://www.safeworkglobal.com/contact"
      />
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-14 sm:py-20 md:py-24 bg-gradient-to-b from-primary/[0.06] to-background">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold font-heading text-foreground mb-2 tracking-tight leading-tight">
                {t("contact.title")}
              </h1>
              {locale === "hi" && (
              <p className="text-lg sm:text-xl font-heading text-primary/90 mb-5">
                विदेश रोजगार से जुड़ी सहायता चाहिए?
              </p>
              )}
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("contact.subtitle")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Form */}
        <section id="enquiry" className="py-12 md:py-16 scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading">{t("contact.enquiry")}</h2>
              </div>
            </ScrollReveal>

            {submitted ? (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-8 sm:p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2">{t("contact.received")}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {t("contact.thanks")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSubmitted(false)}
                  >
                    {t("contact.another")}
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
                            <SelectValue placeholder={locale === "hi" ? "चुनें" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            {ENQUIRY_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value} className="py-2.5">
                                {locale === "hi" ? role.hi : role.en}
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
                          placeholder={locale === "hi" ? "और बताएँ…" : "Tell us more…"}
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
                            {locale === "hi" ? "पूछताछ भेजें" : "Submit Enquiry"}
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
                {locale === "hi" && (
                <p className="mt-1 text-lg text-[#1e2a4a]/75 dark:text-[#e8eadf]/75">
                  आधिकारिक सरकारी सहायता
                </p>
                )}
                <p className="mt-4 text-sm sm:text-base text-[#1e2a4a]/80 dark:text-[#e8eadf]/80 max-w-2xl mx-auto leading-relaxed">
                  For official information, Recruiting Agent verification and overseas
                  employment-related assistance, workers and prospective emigrants can use the
                  Government of India&apos;s official channels.
                </p>
                {locale === "hi" && (
                <p className="mt-3 text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 max-w-2xl mx-auto leading-relaxed">
                  आधिकारिक जानकारी, Recruiting Agent सत्यापन और विदेश रोजगार से संबंधित सहायता के
                  लिए उम्मीदवार भारत सरकार के आधिकारिक माध्यमों का उपयोग कर सकते हैं।
                </p>
                )}
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="flex flex-col gap-4 md:gap-5">
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
                      {locale === "hi" && (
                      <p className="text-sm text-[#1e2a4a]/60 dark:text-[#e8eadf]/60">
                        भारत सरकार का आधिकारिक विदेश रोजगार पोर्टल
                      </p>
                      )}
                    </div>
                  </div>
                  <Button asChild className="w-full h-12 rounded-xl bg-[#1e2a4a] hover:bg-[#162038] text-white">
                    <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                      {locale === "hi" ? "eMigrate पर जाएं" : "Visit eMigrate"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </article>
              </ScrollReveal>

              <ScrollReveal>
                <article className="h-full rounded-2xl border border-[#1e2a4a]/15 bg-white dark:bg-[#12140f] dark:border-[#e8eadf]/10 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e2a4a]/8 text-[#1e2a4a] dark:bg-[#e8eadf]/10 dark:text-[#e8eadf]">
                      <LifeBuoy className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-lg text-[#1e2a4a] dark:text-[#e8eadf]">
                        MADAD Portal
                      </h3>
                      <p className="text-sm text-[#1e2a4a]/70 dark:text-[#e8eadf]/70 mt-0.5">
                        Official government MADAD portal for overseas workers
                      </p>
                      {locale === "hi" && (
                      <p className="text-sm text-[#1e2a4a]/60 dark:text-[#e8eadf]/60">
                        प्रवासी श्रमिकों के लिए आधिकारिक सरकारी मदद पोर्टल
                      </p>
                      )}
                    </div>
                  </div>
                  <Button asChild className="w-full h-12 rounded-xl bg-[#1e2a4a] hover:bg-[#162038] text-white">
                    <a href={MADAD_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                      {locale === "hi" ? "MADAD पर जाएं" : "Visit MADAD"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </article>
              </ScrollReveal>
              </div>

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
                      {locale === "hi" && (
                      <p className="text-sm text-[#1e2a4a]/60 dark:text-[#e8eadf]/60">
                        24×7 विदेश रोजगार सहायता
                      </p>
                      )}
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
                {locale === "hi" && (
                <p className="text-sm text-[#1e2a4a]/65 dark:text-[#e8eadf]/65 mb-3">
                  विदेश से / अतिरिक्त सहायता
                </p>
                )}
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
                {locale === "hi" && (
                  <p className="text-muted-foreground mt-1">SafeWork Global से संपर्क करें</p>
                )}
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-4">
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
                    <p className="text-sm font-semibold text-foreground leading-relaxed">{SAFEWORK_CONTACT.officeAddress}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
