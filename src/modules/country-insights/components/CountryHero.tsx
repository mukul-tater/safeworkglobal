import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HardHat, Building2, Home, Landmark } from "lucide-react";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function CountryHero({ country }: { country: CountryInsight }) {
  const jobsTo = `/jobs?location=${encodeURIComponent(country.jobsQuery)}`;

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/country-insights">Country Insights</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{country.name.en}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <p className="text-sm font-semibold text-primary mb-3">
          {country.flag} {country.name.en} | {country.name.hi}
        </p>
        <Bi
          text={country.hero.headline}
          as="h1"
          className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-4"
        />
        <Bi text={country.hero.subheading} className="text-base sm:text-lg text-muted-foreground max-w-3xl mb-6" />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button asChild size="lg" className="rounded-xl h-12">
            <Link to={jobsTo}>View Jobs | नौकरियां देखें</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl h-12">
            <Link to="/worker/quick-signup">Register as Worker | Worker Registration</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {(country.hero.collage ?? []).length > 0
            ? country.hero.collage!.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-xl border border-border/70 bg-card">
                  <img
                    src={photo.src}
                    alt={photo.alt.en}
                    loading="lazy"
                    className="h-28 sm:h-36 w-full object-cover"
                  />
                  <figcaption className="px-2 py-1.5 text-[11px] font-medium text-foreground">
                    {photo.category}
                  </figcaption>
                </figure>
              ))
            : [
                { icon: Landmark, en: "City & infrastructure", hi: "शहर और इंफ्रास्ट्रक्चर" },
                { icon: HardHat, en: "Skilled work", hi: "कुशल काम" },
                { icon: Building2, en: "Construction / worksite", hi: "निर्माण / वर्कसाइट" },
                { icon: Home, en: "Worker accommodation", hi: "Worker accommodation" },
              ].map((panel) => {
                const Icon = panel.icon;
                return (
                  <div
                    key={panel.en}
                    className="rounded-xl border border-border/70 bg-card p-4 min-h-[7.5rem] flex flex-col justify-end bg-gradient-to-br from-primary/10 via-card to-muted/50"
                  >
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-semibold text-foreground">{panel.en}</p>
                    <p className="text-[11px] text-muted-foreground">{panel.hi}</p>
                  </div>
                );
              })}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Informational photographs. They do not represent a specific SafeWork employer, camp or contract.
        </p>
        <Bi text={country.hero.philosophy} as="p" className="text-base sm:text-lg font-heading font-semibold" />
      </div>
    </section>
  );
}
