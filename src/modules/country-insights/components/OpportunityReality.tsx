import { Sparkles, HardHat } from "lucide-react";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { SectionShell } from "./SectionShell";

export function OpportunityReality({ country }: { country: CountryInsight }) {
  const data = country.opportunityReality;
  return (
    <SectionShell
      id="opportunity-reality"
      heading={{ en: "08 — Opportunity vs Reality", hi: "अवसर और वास्तविकता" }}
    >
      <Bi text={data.headline} as="p" className="text-lg sm:text-xl font-heading font-semibold mb-6" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden">
          {data.opportunityImage?.src && (
            <img
              src={data.opportunityImage.src}
              alt={data.opportunityImage.alt.en}
              loading="lazy"
              className="h-44 sm:h-56 w-full object-cover"
            />
          )}
          <div className="p-5 sm:p-7">
          <Sparkles className="h-6 w-6 text-primary mb-3" />
          <Bi text={data.opportunity.title} as="h3" className="text-xl font-heading font-bold mb-4" />
          <ul className="space-y-3">
            {data.opportunity.points.map((p) => (
              <li key={p.en} className="text-sm">
                <Bi text={p} />
              </li>
            ))}
          </ul>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {data.realityImage?.src && (
            <img
              src={data.realityImage.src}
              alt={data.realityImage.alt.en}
              loading="lazy"
              className="h-44 sm:h-56 w-full object-cover"
            />
          )}
          <div className="p-5 sm:p-7">
          <HardHat className="h-6 w-6 text-foreground mb-3" />
          <Bi text={data.reality.title} as="h3" className="text-xl font-heading font-bold mb-4" />
          <ul className="space-y-3">
            {data.reality.points.map((p) => (
              <li key={p.en} className="text-sm">
                <Bi text={p} />
              </li>
            ))}
          </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
