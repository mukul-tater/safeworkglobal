import { cn } from "@/lib/utils";

type BrandLockupProps = {
  /** `onDark` is for the transparent home-hero overlay. */
  variant?: "default" | "onDark";
  className?: string;
};

const BrandLockup = ({ variant = "default", className }: BrandLockupProps) => {
  const onDark = variant === "onDark";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/safework-shield.png"
        alt=""
        width={34}
        height={40}
        className={cn(
          "h-9 w-auto lg:h-10 shrink-0 transition-transform group-hover:scale-105",
          onDark && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
        )}
      />
      <span className="flex h-9 lg:h-10 flex-col justify-between py-px">
        <span
          className={cn(
            "font-heading text-[15px] lg:text-[17px] font-bold leading-none tracking-tight transition-colors",
            onDark ? "text-white" : "text-[#0c3450] dark:text-white",
          )}
        >
          SafeWork
        </span>
        <span className="font-heading text-[12px] lg:text-[13px] font-medium leading-none tracking-wide text-[#60a074]">
          Global
        </span>
      </span>
    </span>
  );
};

export default BrandLockup;
