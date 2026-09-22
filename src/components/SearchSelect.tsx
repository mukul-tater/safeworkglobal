import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
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
  /** Shown in the mobile picker header. */
  title?: string;
}

function matchesQuery(option: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = option.toLowerCase();
  if (hay.includes(q)) return true;
  const alias = option.replace(/[()]/g, ' ').toLowerCase();
  return alias.includes(q);
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
  title = 'Select',
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const filtered = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );

  const showCustom =
    allowCustom &&
    trimmed.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmed.toLowerCase()) &&
    (!isValidCustom || isValidCustom(trimmed));

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const select = (next: string) => {
    onChange(next);
    close();
  };

  const list = (
    <div
      role="listbox"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
    >
      {showCustom ? (
        <button
          type="button"
          role="option"
          aria-selected={false}
          className="flex min-h-12 w-full items-start gap-2 px-3 py-3 text-left text-base sm:min-h-10 sm:py-2 sm:text-sm hover:bg-accent"
          onClick={() => select(trimmed)}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-0" />
          <span>
            {customHint}: <span className="font-medium">{trimmed}</span>
          </span>
        </button>
      ) : null}
      {filtered.map((option) => (
        <button
          key={option}
          type="button"
          role="option"
          aria-selected={value === option}
          className={cn(
            'flex min-h-12 w-full items-center gap-2 px-3 py-3 text-left text-base sm:min-h-10 sm:py-2 sm:text-sm hover:bg-accent',
            value === option && 'bg-accent',
          )}
          onClick={() => select(option)}
        >
          <Check className={cn('h-4 w-4 shrink-0', value === option ? 'opacity-100' : 'opacity-0')} />
          <span className="min-w-0 break-words">{option}</span>
        </button>
      ))}
      {filtered.length === 0 && !showCustom ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : null}
    </div>
  );

  const searchField = (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        inputMode={inputMode}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:h-9 sm:text-sm"
        autoFocus
      />
    </div>
  );

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      className="h-auto min-h-11 w-full min-w-0 max-w-full justify-between gap-2 px-3 py-2 text-left text-base font-normal sm:min-h-10 sm:text-sm"
    >
      <span className={cn('min-w-0 flex-1 whitespace-normal break-words', !value && 'text-muted-foreground')}>
        {value || placeholder}
      </span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <div className="min-w-0 w-full">
        <div
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        >
          {trigger}
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setQuery('');
          }}
        >
          <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 pr-12">
              <div className="min-w-0">
                <DialogTitle className="text-base">{title}</DialogTitle>
                <DialogDescription className="sr-only">Search and select an option</DialogDescription>
              </div>
            </div>
            {searchField}
            {list}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={12}
          className="z-[80] !w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg p-0 shadow-md"
        >
          <div className="flex max-h-[min(24rem,70dvh)] flex-col">
            {searchField}
            {list}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
