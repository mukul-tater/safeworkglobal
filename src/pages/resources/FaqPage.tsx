import { Link } from "react-router-dom";
import { Mail, ExternalLink, ArrowRight, Send } from "lucide-react";
import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EMIGRATE_PORTAL_URL,
  RECRUITMENT_PARTNER,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from "@/config/workerSupport";
import { FAQ_GROUPS, type FaqEntry } from "./faqContent";

function FaqAnswer({ item }: { item: FaqEntry }) {
  return (
    <div className="space-y-3 pb-2">
      <p className="text-sm text-foreground leading-relaxed">{item.aEn}</p>
      {item.bulletsEn && (
        <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-foreground list-disc pl-5">
          {item.bulletsEn.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{item.aHi}</p>
      {item.extra === "vesta-ra" && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground mb-1">Overseas Recruitment Process Conducted Through:</p>
          <p className="text-foreground">{RECRUITMENT_PARTNER.name}</p>
          <p className="text-muted-foreground">{RECRUITMENT_PARTNER.designation}</p>
          <p className="text-muted-foreground">RC No.: {RECRUITMENT_PARTNER.rcNo}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <ResourcePageLayout
      title="FAQ | SafeWork Global"
      description="Frequently asked questions for workers about SafeWork Global registration, trade tests, documents, fees, overseas recruitment and safety."
      eyebrow="FAQ"
      heading="SafeWork Global — Frequently Asked Questions"
      intro="श्रमिकों के लिए अक्सर पूछे जाने वाले प्रश्न। English and Hindi answers are shown together."
    >
      <div className="max-w-3xl mx-auto space-y-10">
        {FAQ_GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-20">
            <h2 className="text-lg sm:text-xl font-heading font-bold mb-4">
              {group.titleEn}{" "}
              <span className="text-muted-foreground font-medium">| {group.titleHi}</span>
            </h2>
            <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl">
              {group.items.map((item) => (
                <AccordionItem key={item.n} value={`faq-${item.n}`} className="px-5">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="pr-3 flex-1 min-w-0">
                      <span className="block font-semibold text-foreground">
                        {item.n}. {item.qEn}
                      </span>
                      <span className="block text-sm font-normal text-muted-foreground mt-1">
                        {item.qHi}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <FaqAnswer item={item} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <section id="government-resources" className="scroll-mt-20">
          <h2 className="text-lg sm:text-xl font-heading font-bold mb-2">
            Official Government Resources{" "}
            <span className="text-muted-foreground font-medium">| आधिकारिक सरकारी सहायता</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            SafeWork Global is not a Government of India agency. Workers should independently
            verify recruitment and employment information through official Government of India channels.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-heading font-bold">eMigrate</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  विदेशी रोजगार से संबंधित आधिकारिक जानकारी और Recruitment Agent verification के लिए
                  Government of India&apos;s eMigrate portal का उपयोग करें.
                </p>
                <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
                  <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                    Visit eMigrate
                    <ExternalLink className="h-4 w-4 ml-1.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-heading font-bold">MEA / PBSK</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  विदेश रोजगार से संबंधित सहायता और जानकारी के लिए Ministry of External Affairs के
                  official channels का उपयोग करें।
                </p>
                <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
                  <Link to="/contact#government-resources">
                    Government Assistance & Helpline
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="need-help"
          className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 sm:p-8 text-center"
        >
          <h2 className="text-lg sm:text-xl font-heading font-bold mb-1">
            Need Help? | सहायता चाहिए?
          </h2>
          <p className="text-sm font-medium text-foreground mb-1">SafeWork Global Support</p>
          <a
            href={getSafeworkMailtoUrl("SafeWork Global – FAQ")}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
          >
            <Mail className="h-4 w-4" />
            {SAFEWORK_CONTACT.email}
          </a>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            <a
              href={SAFEWORK_CONTACT.websiteUrl}
              className="hover:text-foreground hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {SAFEWORK_CONTACT.websiteDisplay}
            </a>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            आपके सवाल का जवाब नहीं मिला? Send an enquiry | हमसे संपर्क करें
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button asChild className="rounded-xl">
              <Link to="/contact">
                <Send className="h-4 w-4" />
                Send Enquiry
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <a href={getSafeworkMailtoUrl("SafeWork Global – FAQ")}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          </div>
        </section>
      </div>
    </ResourcePageLayout>
  );
}
