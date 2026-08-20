import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid } from "lucide-react";
import constructionImg from "@/assets/trade-construction.jpg";
import electricalImg from "@/assets/trade-electrical.jpg";
import welderImg from "@/assets/trade-welder.jpg";
import HindiText from "./HindiText";

const mosaicImages = [
  { src: electricalImg, alt: "" },
  { src: welderImg, alt: "" },
  { src: constructionImg, alt: "" },
  {
    src: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80",
    alt: "",
  },
] as const;

const extraTrades = ["Driver", "Mason", "Painter"];

type ManyMoreTradeCardProps = {
  index: number;
};

export default function ManyMoreTradeCard({ index }: ManyMoreTradeCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.28), ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to="/job-categories"
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="View all job categories"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <div className="grid h-full w-full grid-cols-2 grid-rows-2">
            {mosaicImages.map((image, i) => (
              <img
                key={i}
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                loading="lazy"
                aria-hidden
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/45 to-foreground/25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm sm:h-14 sm:w-14">
              <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Many more
          </h3>
          <HindiText className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">
            और भी कई
          </HindiText>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {extraTrades.map((trade) => (
              <li
                key={trade}
                className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]"
              >
                {trade}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-primary">
              View all categories
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
