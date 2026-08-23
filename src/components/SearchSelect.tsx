import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyText?: string;
  allowCustom?: boolean;
  isValidCustom?: (query: string) => boolean;
  customHint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

export default function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  searchPlaceholder = 'Search…',
  disabled,
  emptyText = 'No matches',
  allowCustom = false,
  isValidCustom,
  customHint = 'Use this value',
  inputMode,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const showCustom =
    allowCustom &&
    trimmed.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmed.toLowerCase()) &&
    (!isValidCustom || isValidCustom(trimmed));

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="min-w-0 w-full">
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
      modal
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-10 w-full min-w-0 max-w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        className="z-[80] !w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg p-0 shadow-md"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            inputMode={inputMode}
          />
          <CommandList className="max-h-52">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {showCustom ? (
                <CommandItem value={trimmed} onSelect={() => select(trimmed)}>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span>
                    {customHint}: <span className="font-medium">{trimmed}</span>
                  </span>
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => select(option)}>
                  <Check className={cn('mr-2 h-4 w-4', value === option ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </div>
  );
}
