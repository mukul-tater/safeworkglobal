import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const topics = [
  {
    icon: FileText,
    title: "Read every contract — twice",
    body: "Confirm salary, working hours, overtime, accommodation, food, leave entitlement and termination clauses in writing. Never sign a contract you haven't read in your own language. SafeWorkGlobal reviews every contract uploaded to the platform.",
  },
  {
    icon: AlertTriangle,
    title: "Beware of recruitment scams",
    body: "No legitimate employer asks workers to pay placement fees in India. If anyone — agent, sub-agent or 'consultant' — asks for ₹1L+ to 'guarantee' a job, walk away.",
  },
  {
    icon: Scale,
    title: "Know your right to file disputes",
    body: "Every destination country has a labour court or grievance system: MOHRE (UAE), MHRSD (Saudi Arabia), Ministry of Labour (Qatar), MOM (Singapore). SafeWorkGlobal can help you file complaints and connect you to legal aid in your language.",
  },
];

const helplines = [
  { country: "India (MEA)", name: "Pravasi Bharatiya Sahayata Kendra", number: "+91 11 2611 1606" },
  { country: "India (MADAD)", name: "Online complaint portal", number: "madad.gov.in" },
  { country: "UAE", name: "MOHRE helpline", number: "800 60" },
  { country: "Saudi Arabia", name: "Indian Embassy 24x7", number: "+966 11 488 4691" },
  { country: "Qatar", name: "Indian Embassy helpline", number: "+974 4425 5708" },
  { country: "Worldwide", name: "Indian Community Welfare Fund (ICWF)", number: "Apply via local embassy" },
];

export default function LegalAdvice() {
  return (
    <ResourcePageLayout
      title="Legal Advice for Overseas Indian Workers | SafeWork Global"
      description="Know your rights, avoid scams and get the right helpline numbers before you travel for overseas work."
      eyebrow="Legal Advice"
      heading="Know your rights — before you fly"
      intro="A short, practical guide to protect yourself, your contract and your earnings. This is general information, not personal legal advice."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {topics.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.title} className="hover:shadow-lg hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-heading font-bold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10">
        <CardContent className="p-6">
          <h3 className="text-lg font-heading font-bold mb-4">Emergency helplines & embassies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {helplines.map((h) => (
              <div key={h.country} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <Scale className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{h.country}</p>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-sm text-primary">{h.number}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 text-center">
        <h3 className="text-lg font-heading font-bold mb-1">Facing a dispute? We can help.</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our compliance team mediates disputes between workers and employers — at no cost.
        </p>
        <Link to="/contact">
          <Button size="lg" className="rounded-xl">
            Raise a concern <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
        Disclaimer: The information on this page is for general guidance only and does not constitute legal advice.
        For your specific case, please consult a qualified lawyer or your nearest Indian embassy.
      </p>
    </ResourcePageLayout>
  );
}
