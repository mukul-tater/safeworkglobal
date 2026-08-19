import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, Phone, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    q: "Is SafeWorkGlobal really free for workers?",
    a: "Yes. We charge zero placement fees from workers. Employers pay a 1% platform fee. You will never be asked to pay an agent or recruiter through our platform.",
  },
  {
    q: "How are employers verified?",
    a: "Every employer goes through company-registration checks, document verification and contract review before they can post jobs. You'll see a verified badge on profiles that have passed these checks.",
  },
  {
    q: "Who handles my visa and travel?",
    a: "Your sponsoring employer is responsible for the work visa, flight and onboarding paperwork. SafeWorkGlobal tracks each step in your dashboard so nothing slips.",
  },
  {
    q: "What if my contract terms change after I arrive?",
    a: "Report it immediately via the in-app dispute system. We hold the employer's payment in escrow until the agreed terms are met, and our compliance team intervenes within 48 hours.",
  },
  {
    q: "Can I apply if I don't have a passport yet?",
    a: "Yes — you can build your profile and shortlist jobs. You'll need a valid passport before the visa application stage. Our support team can guide you through tatkal/normal passport applications.",
  },
  {
    q: "How long does the whole process take?",
    a: "Typical timelines: 2–3 weeks to apply and get shortlisted, 2–6 weeks for interviews and offer, 4–8 weeks for visa and travel — so 8–17 weeks end-to-end depending on country.",
  },
  {
    q: "What if I want to come back to India early?",
    a: "Your contract will define notice periods. SafeWorkGlobal can mediate an amicable exit and help you find your next role on the platform.",
  },
  {
    q: "Is my personal data safe?",
    a: "Yes. Your contact details are never shared publicly. Employers only see your full profile after you accept their interest. Read our Privacy Policy for details.",
  },
];

export default function SupportCenter() {
  return (
    <ResourcePageLayout
      title="Support Center — We're Here to Help | SafeWorkGlobal"
      description="Get answers to common questions and reach our support team by email, phone or chat."
      eyebrow="Support Center"
      heading="We're here, every step of the way"
      intro="Search the most common questions or reach our team directly. We respond in your language — Hindi, Tamil, Malayalam, Bengali, Punjabi and more."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card className="hover:shadow-lg hover:border-primary/40 transition-all">
          <CardContent className="p-5 text-center">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">Email Support</h3>
            <p className="text-xs text-muted-foreground mb-3">Reply within 24 hours</p>
            <a href="mailto:mukultater@safeworkglobal.com" className="text-sm text-primary font-medium hover:underline">
              mukultater@safeworkglobal.com
            </a>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-primary/40 transition-all">
          <CardContent className="p-5 text-center">
            <div className="h-11 w-11 rounded-xl bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">WhatsApp Support</h3>
            <p className="text-xs text-muted-foreground mb-3">Mon – Sat, 9am – 8pm IST</p>
            <a href="mailto:mukultater@safeworkglobal.com" className="text-sm text-success font-medium hover:underline">
              mukultater@safeworkglobal.com
            </a>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg hover:border-primary/40 transition-all">
          <CardContent className="p-5 text-center">
            <div className="h-11 w-11 rounded-xl bg-info/10 text-info flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">Send a Message</h3>
            <p className="text-xs text-muted-foreground mb-3">In-app or contact form</p>
            <Link to="/contact" className="text-sm text-info font-medium hover:underline">
              Open contact form
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-heading font-bold mb-5">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="px-5">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Card className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 text-center">
          <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-heading font-bold mb-1">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our team typically replies within 4 working hours.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-xl">
              Contact our team <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </ResourcePageLayout>
  );
}
