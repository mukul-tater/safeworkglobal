import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const HINDI_FONT =
  "Kohinoor Devanagari, Devanagari Sangam MN, Nirmala UI, Noto Sans Devanagari, Mangal, ui-sans-serif, system-ui, sans-serif";

/** Hindi copy with a Devanagari-capable fallback stack — does not change global fonts. */
export default function HindiText({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      lang="hi"
      className={cn("block", className)}
      style={{ fontFamily: HINDI_FONT, ...style }}
      {...props}
    />
  );
}
