import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { CountryInsight } from "../types";

export function MobileStickyCta({ country }: { country: CountryInsight }) {
  const jobsTo = `/jobs?location=${encodeURIComponent(country.jobsQuery)}`;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 p-3 md:hidden">
      <div className="flex gap-2">
        <Button asChild className="flex-1 rounded-xl h-11">
          <Link to={jobsTo}>Apply / Jobs</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 rounded-xl h-11">
          <Link to="/worker/quick-signup">Register</Link>
        </Button>
      </div>
    </div>
  );
}
