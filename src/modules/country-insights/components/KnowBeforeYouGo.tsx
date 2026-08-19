import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { CountryInsight } from "../types";
import { Bi } from "./Bi";
import { SectionShell } from "./SectionShell";

export function KnowBeforeYouGo({ country }: { country: CountryInsight }) {
  const data = country.knowBeforeYouGo;
  const jobsTo = `/jobs?location=${encodeURIComponent(country.jobsQuery)}`;

  return (
    <SectionShell id="know-before-you-go" heading={data.heading}>
      <ul className="grid sm:grid-cols-2 gap-2 mb-8">
        {data.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-3">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <Bi text={item.label} className="text-sm font-medium" />
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 text-center">
        <Bi text={data.message} className="text-base sm:text-lg font-heading font-semibold mb-5" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl h-12">
            <Link to={jobsTo}>Explore Jobs | नौकरियां देखें</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl h-12">
            <Link to="/worker/quick-signup">Register as Worker | Worker Registration</Link>
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}
