import { cn } from '@/lib/utils';

export const ALL_JOBS_CATEGORY = 'All';

interface Props {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function JobCategoryScroller({ categories, selected, onSelect }: Props) {
  const chips = [ALL_JOBS_CATEGORY, ...categories.filter((c) => c && c !== ALL_JOBS_CATEGORY)];

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex w-max min-w-full gap-2 px-1">
        {chips.map((category) => {
          const active = selected === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-4 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
