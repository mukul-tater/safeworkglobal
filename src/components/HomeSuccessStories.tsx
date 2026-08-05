import { Link } from "react-router-dom";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const stories = [
  {
    name: "Rahul S.",
    role: "Welder",
    from: "Bhilwara, Rajasthan",
    to: "Dubai, UAE",
    salaryBefore: "₹18,000",
    salaryAfter: "₹95,000",
    quote:
      "SafeWorkGlobal verified my employer before I signed anything — that gave my family peace of mind.",
  },
  {
    name: "Anita P.",
    role: "Nurse",
    from: "Kochi, Kerala",
    to: "Riyadh, Saudi Arabia",
    salaryBefore: "₹28,000",
    salaryAfter: "₹1,40,000",
    quote:
      "The platform handled my visa, medical and contract review. I landed fully prepared and started saving from month one.",
  },
  {
    name: "Vinod K.",
    role: "Construction Foreman",
    from: "Lucknow, UP",
    to: "Doha, Qatar",
    salaryBefore: "₹22,000",
    salaryAfter: "₹85,000",
    quote:
      "Zero agent fees. My contract was clear and my employer paid everything else — no middlemen taking a cut.",
  },
];

export default function HomeSuccessStories() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-success/10 text-success mb-3">
            Worker stories
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-3">
            Workers who <span className="text-gradient">made the move</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real journeys from Indian workers who found verified overseas jobs without paying agents.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {stories.map((story) => (
            <figure
              key={story.name}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
            >
              <Quote className="h-5 w-5 text-primary/40 mb-3" aria-hidden />

              <blockquote className="text-sm sm:text-[15px] text-foreground leading-relaxed flex-1">
                {story.quote}
              </blockquote>

              <div className="mt-5 flex items-baseline gap-2 border-t border-border/60 pt-4">
                <span className="text-sm text-muted-foreground line-through">
                  {story.salaryBefore}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="text-lg font-bold font-heading text-success tabular-nums">
                  {story.salaryAfter}
                </span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>

              <figcaption className="mt-3 text-sm">
                <span className="font-semibold text-foreground">{story.name}</span>
                <span className="text-muted-foreground"> · {story.role}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {story.from} → {story.to}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <Button asChild variant="outline" size="lg" className="mt-8 rounded-xl gap-2">
          <Link to="/success-stories">
            Read all stories <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
