import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { TradeCategory } from "./types";
import HindiText from "./HindiText";
import VerificationBadge from "./VerificationBadge";

type TradeCategoryCardProps = {
  trade: TradeCategory;
  index: number;
};

export default function TradeCategoryCard({ trade, index }: TradeCategoryCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.28), ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={`/jobs?category=${encodeURIComponent(trade.name)}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`${trade.name}: ${trade.skills.join(", ")}. ${trade.verification}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={trade.image}
            alt={trade.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
            style={{ objectPosition: trade.objectPosition ?? "center" }}
            loading="lazy"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/5 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {trade.name}
          </h3>
          <HindiText className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">
            {trade.hindiName}
          </HindiText>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {trade.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]"
              >
                {skill}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-3">
            <VerificationBadge label={trade.verification} />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
