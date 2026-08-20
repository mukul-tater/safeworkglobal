import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeUaeMobile } from "@/lib/validations/common";

interface Props {
  id: string;
  value: string;
  onChange: (nationalDigits: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** UAE mobile input with a locked +971 prefix. Stores national 9-digit form. */
export default function UaePhoneField({
  id,
  value,
  onChange,
  disabled,
  placeholder = "50 123 4567",
  className,
}: Props) {
  const national = normalizeUaeMobile(value).slice(0, 9);

  return (
    <div className={cn("flex h-11 overflow-hidden rounded-md border border-input bg-background", className)}>
      <span className="flex shrink-0 items-center border-r border-input bg-muted/50 px-3 text-sm font-medium text-muted-foreground">
        +971
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={national}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={9}
        className="h-11 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onChange={(e) => onChange(normalizeUaeMobile(e.target.value).slice(0, 9))}
      />
    </div>
  );
}
