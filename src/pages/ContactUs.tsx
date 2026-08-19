import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Loader2, Send, ShieldCheck, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim()
        });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Mail, title: "Email", value: "mukul@safeworkglobal.com", href: "mailto:mukul@safeworkglobal.com" },
    { icon: MapPin, title: "Office", value: "Udaipur, Rajasthan, IN", href: null },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Header />
      <MobileBottomNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
                <Send className="h-3.5 w-3.5" />
                Get in Touch
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 tracking-tight">
                Contact Us
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Have questions? We're here to help. Reach out and our team will respond within 24 hours.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <ScrollReveal>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading mb-6">Reach Out Directly</h2>
                  <div className="space-y-5">
                    {contactInfo.map((item) => (
                      <div key={item.title} className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-0.5">{item.title}</h3>
                          {item.href ? (
                            <a href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <ScrollReveal delay={0.1}>
                  <Card className="border-border/50">
                    <CardContent className="p-6 sm:p-8">
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">Name</label>
                            <Input id="name" placeholder="Your name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">Email</label>
                            <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium mb-2 text-foreground">Subject</label>
                          <Input id="subject" placeholder="How can we help?" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
                        </div>
                        <div>
                          <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">Message</label>
                          <Textarea id="message" rows={5} placeholder="Tell us more..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto px-8" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Government Helplines */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl font-bold font-heading">
                  Government Helplines for Overseas Workers
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                  Indian government toll-free helplines to protect and assist workers going abroad.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="border-border/50 max-w-xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 shrink-0">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">MEA / PBSK Helpline</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ministry of External Affairs — Pravasi Bharatiya Sahayata Kendra
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <Phone className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Toll-free (24×7)</p>
                      <a href="tel:1800113090" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                        1800-11-3090
                      </a>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      24×7 assistance for Indian workers in distress abroad, including wage disputes and contract violations.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      Report unlicensed or fraudulent recruiting agents and verify a valid MEA licence.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      Help with emigration clearance, PDOT registration, passport queries, and emergency repatriation.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      No worker should pay more than the government-prescribed recruitment charges.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      Available in Hindi, English, and major regional languages.
                    </li>
                  </ul>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
                    <a
                      href="https://emigrate.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      e-Migrate Portal →
                    </a>
                    <a
                      href="https://www.pbsk.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      PBSK Portal →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
