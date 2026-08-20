import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMPLOYER_TRADES } from "@/lib/employerTradeSkills";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (trade: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TradeSearchSelect({
  value,
  onChange,
  disabled,
  placeholder = "Search trade…",
}: Props) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => [...EMPLOYER_TRADES], []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search job role / trade" />
          <CommandList>
            <CommandEmpty>No matching trade</CommandEmpty>
            <CommandGroup>
              {options.map((trade) => (
                <CommandItem
                  key={trade}
                  value={trade}
                  onSelect={() => {
                    onChange(trade);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === trade ? "opacity-100" : "opacity-0")} />
                  {trade}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
