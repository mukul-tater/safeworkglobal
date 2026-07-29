import { Check, X } from "lucide-react";

const rows = [
  { aspect: "Fees charged", agent: "10–30% of salary (often hidden)", safework: "Transparent pricing — no hidden agent cuts" },
  { aspect: "Who pays", agent: "Workers — upfront loans & debt", safework: "No agent fees — standard govt. charges only" },
  { aspect: "Job verification", agent: "Low — many fake listings", safework: "Every employer verified first" },
  { aspect: "Contracts", agent: "Verbal, no transparency", safework: "Digital contracts you can read" },
];

export default function AgentComparison() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-destructive/10 text-destructive mb-3">
            The Problem
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-3">
            Agents vs. <span className="text-gradient">SafeWork Global</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Millions of Indian workers lose ₹50,000–₹2,00,000 to fake agents every year.
            We built a safer, transparent alternative.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 bg-muted/40 border-b border-border/60 text-xs sm:text-sm font-semibold">
            <div className="p-4 sm:p-5 text-muted-foreground">Aspect</div>
            <div className="p-4 sm:p-5 text-center text-destructive border-x border-border/60">
              Traditional Agents
            </div>
            <div className="p-4 sm:p-5 text-center text-success">SafeWork Global</div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.aspect}
              className={`grid grid-cols-3 text-xs sm:text-sm ${i < rows.length - 1 ? "border-b border-border/40" : ""}`}
            >
              <div className="p-4 sm:p-5 font-medium text-foreground">{row.aspect}</div>
              <div className="p-4 sm:p-5 border-x border-border/40 text-muted-foreground flex items-start gap-2">
                <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>{row.agent}</span>
              </div>
              <div className="p-4 sm:p-5 text-foreground flex items-start gap-2">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{row.safework}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
