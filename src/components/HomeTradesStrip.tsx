import constructionImg from "@/assets/trade-construction.jpg";
import electricalImg from "@/assets/trade-electrical.jpg";
import welderImg from "@/assets/trade-welder.jpg";

const trades = [
  {
    src: constructionImg,
    label: "Construction",
    caption: "Site-ready crews for Gulf projects",
  },
  {
    src: electricalImg,
    label: "Electrical & HVAC",
    caption: "Trade-tested technicians",
  },
  {
    src: welderImg,
    label: "Welding & fabrication",
    caption: "Skilled hands employers trust",
  },
] as const;

/** Quiet photo strip of Indian skilled trades — sits below the hero, not in it. */
export default function HomeTradesStrip() {
  return (
    <section className="border-b border-border/60 bg-background py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8 max-w-xl sm:mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Indian skilled workers
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            We Verify Workers and their Skills
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Construction, electrical, welding, and more — skill-checked before they meet an employer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {trades.map((trade) => (
            <figure key={trade.label} className="group overflow-hidden rounded-xl">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={trade.src}
                  alt={`Indian ${trade.label.toLowerCase()} worker`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="font-heading text-base font-semibold text-white sm:text-lg">
                    {trade.label}
                  </p>
                  <p className="mt-0.5 text-xs text-white/75 sm:text-sm">{trade.caption}</p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
