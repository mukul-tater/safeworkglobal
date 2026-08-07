import { Button } from '@/components/ui/button';
import { BellPlus, Globe2, SearchX } from 'lucide-react';

export interface JobFacet {
  label: string;
  /** Omitted when no live jobs are loaded and the list is a static suggestion. */
  count?: number;
}

interface JobsEmptyStateProps {
  /** Human-readable names of the filters most likely to be hiding results. */
  restrictiveFilters: string[];
  categories: JobFacet[];
  countries: JobFacet[];
  onClearFilters: () => void;
  onCreateAlert: () => void;
  onSelectCategory: (category: string) => void;
  onSelectCountry: (country: string) => void;
}

export default function JobsEmptyState({
  restrictiveFilters,
  categories,
  countries,
  onClearFilters,
  onCreateAlert,
  onSelectCategory,
  onSelectCountry,
}: JobsEmptyStateProps) {
  const hint =
    restrictiveFilters.length > 0
      ? `Your ${restrictiveFilters.join(' and ')} ${restrictiveFilters.length > 1 ? 'filters are' : 'filter is'} the most restrictive. Try widening ${restrictiveFilters.length > 1 ? 'them' : 'it'}, or get notified when matching jobs are posted.`
      : 'No live jobs match this search yet. Get notified as soon as a matching job is posted.';

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/70">
          <SearchX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No jobs match your search</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hint}</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={onClearFilters}>Clear filters</Button>
          <Button variant="outline" onClick={onCreateAlert} className="gap-2">
            <BellPlus className="h-4 w-4" />
            Create job alert
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <section>
          <h4 className="mb-3 text-sm font-semibold">Popular categories</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => onSelectCategory(category.label)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="truncate text-sm font-medium">{category.label}</span>
                {category.count !== undefined && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {category.count} {category.count === 1 ? 'job' : 'jobs'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {countries.length > 0 && (
        <section>
          <h4 className="mb-3 text-sm font-semibold">Top destinations</h4>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <button
                key={country.label}
                type="button"
                onClick={() => onSelectCountry(country.label)}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
                {country.label}
                {country.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{country.count}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
