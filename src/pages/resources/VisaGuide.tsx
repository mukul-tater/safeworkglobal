import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, FileCheck, Clock, IndianRupee, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const visas = [
  {
    country: "United Arab Emirates",
    flag: "🇦🇪",
    type: "Employment Visa (Work Permit)",
    duration: "2 years (renewable)",
    cost: "₹35,000 – ₹55,000",
    processing: "15 – 30 days",
    docs: ["Valid passport (6+ months)", "Medical fitness certificate", "Attested educational documents", "Employment contract"],
    notes: "Sponsored by employer. ECR clearance required for non-graduates.",
  },
  {
    country: "Saudi Arabia",
    flag: "🇸🇦",
    type: "Iqama (Work Residency)",
    duration: "1 – 2 years",
    cost: "₹40,000 – ₹70,000",
    processing: "30 – 45 days",
    docs: ["Passport", "Police clearance", "Medical exam (GAMCA)", "Attested degree/trade certificate"],
    notes: "Mandatory GAMCA medical at approved centres in India.",
  },
  {
    country: "Qatar",
    flag: "🇶🇦",
    type: "Work Visa",
    duration: "1 – 3 years",
    cost: "₹30,000 – ₹50,000",
    processing: "20 – 40 days",
    docs: ["Passport", "Qatar work permit (from employer)", "Medical certificate", "Biometrics"],
    notes: "Employer applies for the work permit before you travel.",
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    type: "Skilled Worker Visa",
    duration: "Up to 4 years",
    cost: "₹7,000 – ₹12,000 (visa fee)",
    processing: "8 – 12 weeks",
    docs: ["Recognised qualification", "Job contract", "Proof of language skills (B1/B2)", "Health insurance"],
    notes: "Recognition of foreign qualification (Anerkennung) is mandatory.",
  },
  {
    country: "Singapore",
    flag: "🇸🇬",
    type: "Work Permit / S Pass",
    duration: "1 – 2 years",
    cost: "₹15,000 – ₹40,000",
    processing: "1 – 4 weeks",
    docs: ["Passport", "Employer-issued IPA letter", "Medical exam on arrival", "Educational certificates"],
    notes: "Employer must hold a valid quota and pay the monthly levy.",
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    type: "Temporary Foreign Worker (LMIA-based)",
    duration: "Up to 2 years",
    cost: "₹50,000 – ₹90,000",
    processing: "2 – 6 months",
    docs: ["Job offer + LMIA", "Passport", "Police clearance", "Medical exam (panel physician)"],
    notes: "Pathway to PR via Canadian Experience Class after 1 year.",
  },
];

export default function VisaGuide() {
  return (
    <ResourcePageLayout
      title="Visa Guide for Overseas Jobs | SafeWork Global"
      description="Step-by-step visa requirements, costs and processing times for the top 6 destinations Indian workers move to."
      eyebrow="Visa Guide"
      heading="Visas, demystified — country by country"
      intro="Costs, documents and timelines for the top destinations our workers travel to. Always confirm details with the official embassy before paying any fees."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visas.map((v) => (
          <Card key={v.country} className="hover:shadow-lg hover:border-primary/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl" aria-hidden>{v.flag}</span>
                    <h3 className="text-lg font-heading font-bold">{v.country}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">{v.type}</Badge>
                </div>
                <Plane className="h-5 w-5 text-primary shrink-0" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                    <Clock className="h-3 w-3" /> Duration
                  </div>
                  <p className="font-medium">{v.duration}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                    <IndianRupee className="h-3 w-3" /> Cost
                  </div>
                  <p className="font-medium">{v.cost}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                    <FileCheck className="h-3 w-3" /> Processing
                  </div>
                  <p className="font-medium">{v.processing}</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Required documents</p>
              <ul className="text-sm space-y-1 mb-3">
                {v.docs.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground italic border-t pt-3">{v.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 text-center">
        <h3 className="text-lg font-heading font-bold mb-1">Need help with your visa application?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our verified employer partners handle paperwork end-to-end — no agent fees.
        </p>
        <Link to="/jobs">
          <Button size="lg" className="rounded-xl">
            Browse visa-sponsored jobs <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </Card>
    </ResourcePageLayout>
  );
}
