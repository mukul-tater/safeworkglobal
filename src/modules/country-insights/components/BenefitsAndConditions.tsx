import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, HardHat, Flame, Shield, Bus } from "lucide-react";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";

const CONDITION_ICONS = [Sun, HardHat, Flame, Shield, Bus];

export function BenefitsChecklist({ country }: { country: CountryInsight }) {
  const data = country.employerBenefits;
  return (
    <SectionShell id="employer-benefits" heading={data.heading}>
      <ul className="grid sm:grid-cols-2 gap-2 mb-6">
        {data.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-3 min-h-12">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <Bi text={item.label} className="text-sm font-medium" />
          </li>
        ))}
      </ul>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}

export function WorkingConditions({ country }: { country: CountryInsight }) {
  const data = country.workingConditions;
  return (
    <SectionShell id="working-conditions" heading={data.heading}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.cards.map((card, i) => {
          const Icon = CONDITION_ICONS[i] ?? HardHat;
          return (
            <Card key={card.id} className="overflow-hidden">
              {card.image?.src && (
                <img
                  src={card.image.src}
                  alt={card.image.alt.en}
                  loading="lazy"
                  className="h-32 w-full object-cover"
                />
              )}
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-primary mb-2" />
                <Bi text={card.title} as="h3" className="font-heading font-bold mb-2" />
                <Bi text={card.body} className="text-sm text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
