import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { DisclaimerBox, SectionShell } from "./SectionShell";
import { EMIGRATE_PORTAL_URL } from "@/config/workerSupport";

export function CountryRules({ country }: { country: CountryInsight }) {
  const data = country.countryRules;
  return (
    <SectionShell id="country-rules" heading={data.heading}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {data.cards.map((card) => (
          <Card key={card.id}>
            <CardContent className="p-4">
              <Bi text={card.title} as="h3" className="font-heading font-bold mb-2" />
              <Bi text={card.body} className="text-sm text-muted-foreground" />
              {card.officialUrl && (
                <a
                  href={card.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                >
                  Official reference <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Button asChild className="rounded-xl">
          <a href={EMIGRATE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
            Know Your Rights | अपने अधिकार जानें
          </a>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/legal-advice">Legal Advice</Link>
        </Button>
      </div>
      <DisclaimerBox text={data.disclaimer} />
    </SectionShell>
  );
}
