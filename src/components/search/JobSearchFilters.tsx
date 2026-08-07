import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, X } from 'lucide-react';
import { DESTINATION_COUNTRIES, JOB_CATEGORIES, POPULAR_SKILLS } from '@/lib/constants';
import { SALARY_FILTER_MIN, SALARY_FILTER_MAX, SALARY_FILTER_STEP } from '@/lib/jobSalaryUtils';
import { formatINRAmount } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export interface JobFilters {
  keyword: string;
  location: string;
  country: string;
  jobCategory: string;
  salaryMin: number;
  salaryMax: number;
  visaSponsorship: boolean;
  skills: string[];
  experienceLevel: string;
}

export const ANY_COUNTRY = 'All Countries';
export const ANY_CATEGORY = 'All Categories';
export const ANY_EXPERIENCE = 'All Levels';

/** Values match the `experience_level` codes stored on the jobs table. */
export const JOB_EXPERIENCE_OPTIONS = [
  { value: ANY_EXPERIENCE, label: 'All levels' },
  { value: 'ENTRY', label: 'Entry level' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'EXPERT', label: 'Expert' },
];

export const EMPTY_JOB_FILTERS: JobFilters = {
  keyword: '',
  location: '',
  country: ANY_COUNTRY,
  jobCategory: ANY_CATEGORY,
  salaryMin: SALARY_FILTER_MIN,
  salaryMax: SALARY_FILTER_MAX,
  visaSponsorship: false,
  skills: [],
  experienceLevel: ANY_EXPERIENCE,
};

export function isSalaryFilterActive(filters: JobFilters): boolean {
  return filters.salaryMin > SALARY_FILTER_MIN || filters.salaryMax < SALARY_FILTER_MAX;
}

/** Counts only the filters shown in this panel, so the mobile badge matches it. */
export function countActiveFilters(filters: JobFilters): number {
  let count = 0;
  if (filters.location.trim()) count += 1;
  if (filters.jobCategory !== ANY_CATEGORY) count += 1;
  if (filters.experienceLevel !== ANY_EXPERIENCE) count += 1;
  if (filters.visaSponsorship) count += 1;
  if (isSalaryFilterActive(filters)) count += 1;
  count += filters.skills.length;
  return count;
}

interface FilterSectionProps {
  label: string;
  children: React.ReactNode;
}

function FilterSection({ label, children }: FilterSectionProps) {
  return (
    <div className="border-t border-border/60 px-5 py-4 first:border-t-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

interface CollapsibleSectionProps extends FilterSectionProps {
  defaultOpen?: boolean;
  summary?: string;
}

function CollapsibleSection({ label, summary, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border/60 px-5 py-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          {!open && summary && <span className="text-xs text-muted-foreground">{summary}</span>}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

interface JobSearchFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  className?: string;
}

export default function JobSearchFilters({ filters, onFiltersChange, className }: JobSearchFiltersProps) {
  const [skillInput, setSkillInput] = useState('');
  const [localLocation, setLocalLocation] = useState(filters.location);
  const debouncedLocation = useDebounce(localLocation, 400);

  useEffect(() => {
    if (debouncedLocation !== filters.location) {
      onFiltersChange({ ...filters, location: debouncedLocation });
    }
  }, [debouncedLocation]);

  useEffect(() => {
    if (filters.location !== localLocation && filters.location !== debouncedLocation) {
      setLocalLocation(filters.location);
    }
  }, [filters.location]);

  const activeCount = countActiveFilters(filters);

  const handleAddSkill = (skill: string) => {
    const value = skill.trim();
    if (value && !filters.skills.includes(value)) {
      onFiltersChange({ ...filters, skills: [...filters.skills, value] });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    onFiltersChange({ ...filters, skills: filters.skills.filter((s) => s !== skill) });
  };

  const salarySummary = isSalaryFilterActive(filters)
    ? `${formatINRAmount(filters.salaryMin)} – ${formatINRAmount(filters.salaryMax)}`
    : 'Any';

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card', className)}>
      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeCount > 0 && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onFiltersChange({ ...EMPTY_JOB_FILTERS, keyword: filters.keyword, country: filters.country })}
          >
            Clear all
          </Button>
        )}
      </div>

      <FilterSection label="City or region">
        <Input
          id="location"
          placeholder="e.g. Dubai, Riyadh"
          value={localLocation}
          onChange={(e) => setLocalLocation(e.target.value)}
        />
      </FilterSection>

      <FilterSection label="Job category">
        <Select
          value={filters.jobCategory}
          onValueChange={(value) => onFiltersChange({ ...filters, jobCategory: value })}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 max-h-72 bg-card">
            {JOB_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category === ANY_CATEGORY ? 'All categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection label="Experience level">
        <Select
          value={filters.experienceLevel}
          onValueChange={(value) => onFiltersChange({ ...filters, experienceLevel: value })}
        >
          <SelectTrigger id="experience">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-card">
            {JOB_EXPERIENCE_OPTIONS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
        <Label htmlFor="visa" className="cursor-pointer text-sm font-medium">
          Visa sponsored only
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Employer supports your work visa
          </span>
        </Label>
        <Switch
          id="visa"
          checked={filters.visaSponsorship}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, visaSponsorship: checked })}
        />
      </div>

      <CollapsibleSection label="Salary range" summary={salarySummary} defaultOpen>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-medium tabular-nums">
            <span>{formatINRAmount(filters.salaryMin)}</span>
            <span>
              {formatINRAmount(filters.salaryMax)}
              {filters.salaryMax >= SALARY_FILTER_MAX ? '+' : ''}
            </span>
          </div>
          <Slider
            min={SALARY_FILTER_MIN}
            max={SALARY_FILTER_MAX}
            step={SALARY_FILTER_STEP}
            value={[filters.salaryMin, filters.salaryMax]}
            onValueChange={([min, max]) => onFiltersChange({ ...filters, salaryMin: min, salaryMax: max })}
          />
          <p className="text-xs text-muted-foreground">Monthly, in Indian rupees</p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        label="Skills"
        summary={filters.skills.length > 0 ? `${filters.skills.length} selected` : 'Any'}
        defaultOpen={filters.skills.length > 0}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => handleAddSkill(skillInput)}>
              Add
            </Button>
          </div>

          {filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filters.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 font-normal">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => handleRemoveSkill(skill)}
                    className="rounded-full hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs text-muted-foreground">Popular</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.filter((s) => !filters.skills.includes(s))
                .slice(0, 10)
                .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    {skill}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

export { DESTINATION_COUNTRIES };
