import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { Bilingual } from "../types";

export function Bi({
  text,
  as: Tag = "p",
  className,
  hiClassName,
}: {
  text: Bilingual;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  hiClassName?: string;
}) {
  const { locale } = useI18n();
  const primary = locale === "hi" ? text.hi : text.en;
  const secondary = locale === "hi" ? text.en : text.hi;

  return (
    <Tag className={className}>
      <span className="block">{primary}</span>
      <span className={cn("block mt-1 text-[0.92em] font-normal text-muted-foreground", hiClassName)}>
        {secondary}
      </span>
    </Tag>
  );
}

export function BiInline({ text }: { text: Bilingual }) {
  const { locale } = useI18n();
  return <>{locale === "hi" ? text.hi : text.en}</>;
}
