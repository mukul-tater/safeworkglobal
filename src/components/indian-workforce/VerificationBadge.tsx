import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationBadgeProps = {
  label: string;
  className?: string;
  tone?: "light" | "dark";
};

export default function VerificationBadge({
  label,
  className,
  tone = "dark",
}: VerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tracking-wide",
        tone === "dark" ? "text-success" : "text-white/90",
        className,
      )}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}
