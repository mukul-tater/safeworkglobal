import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CountryInsight } from "../types";
import { Bi, BiInline } from "./Bi";

export function CountryCard({ country }: { country: CountryInsight }) {
  return (
    <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all">
      <CardContent className="p-5 sm:p-6 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-4xl" aria-hidden>
            {country.flag}
          </span>
        </div>
        <Bi text={country.name} as="h2" className="text-lg font-heading font-bold mb-3" />
        <Bi text={country.listingDescription} className="text-sm text-muted-foreground mb-4 flex-1" />
        <div className="flex flex-wrap gap-1.5 mb-5">
          {country.listingSectors.map((s) => (
            <Badge key={s.en} variant="outline" className="text-xs">
              <BiInline text={s} />
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full rounded-xl h-11 mt-auto">
          <Link to={`/country-insights/${country.slug}`}>
            {country.exploreCta.en}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CountryListing({ countries }: { countries: CountryInsight[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {countries.map((country) => (
        <CountryCard key={country.id} country={country} />
      ))}
    </div>
  );
}
