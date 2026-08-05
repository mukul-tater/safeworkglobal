import { BadgeCheck, FileCheck, Landmark, Wrench } from "lucide-react";

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Verified jobs only",
    description: "Every employer and job listing is checked by our team before it goes live.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Wrench,
    title: "Your skills, proven",
    description: "Skill test, trade test, and medical checks build a profile employers can trust before they interview you.",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    icon: Landmark,
    title: "Licensed partner deployment",
    description: "Visa, emigration, and travel are handled by licensed recruitment partners, following Indian emigration rules.",
    iconBg: "bg-info/10",
    iconColor: "text-info",
  },
  {
    icon: FileCheck,
    title: "Everything in writing",
    description: "You see your job terms, salary, and deductions in a written contract before you agree to travel.",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
];

export default function WhySafeWork() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-12 sm:mb-16">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-success/10 text-success mb-4">
              Why SafeWork Global
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-4">
              Replacing unsafe agents with a{" "}
              <span className="text-gradient">compliance-first</span> platform
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Every year, Indian workers lose lakhs to fake overseas job agents — paying
              ₹50,000 to ₹2,00,000 upfront for jobs that never exist. SafeWork Global
              verifies both sides before anyone commits: your documents and skills, and
              the employer offering the job.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are building the trusted infrastructure for safe, ethical migrant
              employment — starting with UAE, Oman, and expanding across the GCC, Japan,
              and Europe.
            </p>
          </div>

          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 sm:p-8">
            <h3 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <span className="text-destructive">⚠</span> What workers face with agents
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Hidden fees of 10–30% of your salary",
                "Fake job offers and passport retention",
                "No written contract — verbal promises only",
                "No protection if employer doesn't pay",
                "Forced into unsafe, unregulated migration routes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`inline-flex p-2.5 rounded-lg ${point.iconBg} mb-3`}>
                <point.icon className={`h-5 w-5 ${point.iconColor}`} />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-1.5">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
