import ResourcePageLayout from "@/components/ResourcePageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ShieldCheck, ArrowRight, MapPin, Clock, Languages, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const UAE = {
  flag: "🇦🇪",
  name: "United Arab Emirates",
  demand: "Very High",
  avgSalary: "₹70k – ₹1.4L/mo",
  visaProcess: "Employer sponsored (typically 1–3 months)",
  languages: ["Arabic", "English", "Hindi / Urdu widely used at work"],
  cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Al Ain"],
  sectors: ["Construction", "Hospitality", "Healthcare", "Retail", "Transportation", "Skilled trades"],
  highlight: "Largest Indian workforce abroad — 3.5M+ Indians live and work here.",
  why: "Ongoing infrastructure, hospitality and services demand, plus a large existing Indian worker community.",
};

export default function CountryInsightsPage() {
  return (
    <ResourcePageLayout
      title="UAE Country Insights | SafeWork Global"
      description="Demand, salaries, cities and key sectors for Indian workers in the United Arab Emirates."
      eyebrow="Country Insights"
      heading="United Arab Emirates"
      intro="SafeWork Global is starting with the UAE — the main destination on this page for verified overseas jobs."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl" aria-hidden>
                  {UAE.flag}
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold">{UAE.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{UAE.highlight}</p>
                </div>
              </div>
              <Badge className="bg-success/10 text-success border-success/20 shrink-0">
                <TrendingUp className="h-3 w-3 mr-1" /> {UAE.demand}
              </Badge>
            </div>

            <p className="text-sm text-foreground leading-relaxed mb-6">{UAE.why}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Typical salary
                </div>
                <p className="text-base font-semibold">{UAE.avgSalary}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Visa process
                </div>
                <p className="text-base font-semibold">{UAE.visaProcess}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Cities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {UAE.cities.map((city) => (
                  <Badge key={city} variant="outline">
                    {city}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                Languages
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {UAE.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Key sectors
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {UAE.sectors.map((s) => (
                <Badge key={s} variant="outline" className="text-sm">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 text-center">
          <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-heading font-bold mb-1">Verified UAE jobs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse openings with verified employers. Job terms and salary are shown before you apply.
          </p>
          <Link to="/jobs?location=UAE">
            <Button size="lg" className="rounded-xl">
              Browse UAE jobs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </ResourcePageLayout>
  );
}
