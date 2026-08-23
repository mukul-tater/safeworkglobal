import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Loader2, Search } from 'lucide-react';
import { DESTINATION_COUNTRIES } from '@/lib/constants';
import { ANY_COUNTRY } from '@/components/search/JobSearchFilters';

interface JobSearchHeroProps {
  keyword: string;
  country: string;
  loading?: boolean;
  quickCategories: string[];
  onKeywordChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSelectCategory: (category: string) => void;
  onSearch: () => void;
}

export default function JobSearchHero({
  keyword,
  country,
  loading = false,
  quickCategories,
  onKeywordChange,
  onCountryChange,
  onSelectCategory,
  onSearch,
}: JobSearchHeroProps) {
  return (
    <section className="mb-6 md:mb-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Find verified jobs abroad</h1>
      <p className="mt-1.5 min-w-0 break-words text-sm text-muted-foreground md:text-base">
        Verified employers, transparent salaries and visa sponsorship support.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="mt-5 flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-2 md:flex-row md:items-center md:gap-0"
      >
        <div className="flex flex-1 items-center gap-2 px-2 md:px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Job title or skill"
            aria-label="Job title or skill"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && keyword && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>

        <div className="hidden h-8 w-px bg-border md:block" />

        <div className="flex items-center gap-2 px-2 md:w-56 md:px-3">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger
              aria-label="Destination country"
              className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0 focus:ring-offset-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-72 bg-card">
              {DESTINATION_COUNTRIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === ANY_COUNTRY ? 'Any country' : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="h-10 md:ml-2 md:px-6">
          Search jobs
        </Button>
      </form>

      {quickCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {quickCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 hover:text-foreground"
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
