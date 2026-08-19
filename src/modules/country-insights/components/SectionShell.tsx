import type { ReactNode } from "react";
import type { Bilingual } from "../types";
import { Bi } from "./Bi";
import { cn } from "@/lib/utils";

export function DisclaimerBox({ text, className }: { text: Bilingual; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed", className)}>
      <Bi text={text} />
    </div>
  );
}

export function SectionShell({
  id,
  heading,
  subheading,
  children,
}: {
  id: string;
  heading: Bilingual;
  subheading?: Bilingual;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 sm:scroll-mt-28 py-10 sm:py-14 border-t border-border">
      <Bi text={heading} as="h2" className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2" />
      {subheading && <Bi text={subheading} className="text-sm sm:text-base text-muted-foreground mb-6 max-w-3xl" />}
      {children}
    </section>
  );
}
