import { useState, useEffect, useMemo, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import { PublicOrWorkerPortalLayout } from '@/modules/worker-registration/components/WorkerPortalShell';
import WorkerJobsGate from '@/modules/worker-registration/components/WorkerJobsGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link, useSearchParams } from 'react-router-dom';
import { BookmarkCheck, ChevronLeft, ChevronRight, Save, SlidersHorizontal, X } from 'lucide-react';
import JobSearchFilters, {
  ANY_CATEGORY,
  ANY_COUNTRY,
  ANY_EXPERIENCE,
  EMPTY_JOB_FILTERS,
  JOB_EXPERIENCE_OPTIONS,
  countActiveFilters,
  isSalaryFilterActive,
  type JobFilters,
} from '@/components/search/JobSearchFilters';
import SavedSearchDialog from '@/components/search/SavedSearchDialog';
import JobSearchHero from '@/components/jobs/JobSearchHero';
import JobResultCard, { type JobListItem } from '@/components/jobs/JobResultCard';
import JobsEmptyState, { type JobFacet } from '@/components/jobs/JobsEmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { JOB_CATEGORIES } from '@/lib/constants';
import { SALARY_FILTER_MIN, SALARY_FILTER_MAX, convertSalaryToINR } from '@/lib/jobSalaryUtils';
import { formatINRAmount } from '@/lib/utils';

const JOBS_PER_PAGE = 20;
const QUICK_CATEGORIES = ['Welding', 'Construction', 'Electrical', 'Plumbing', 'HVAC'];
const SUGGESTED_CATEGORIES = ['Construction', 'Welding', 'Electrical', 'Plumbing', 'HVAC', 'Manufacturing'];
const SUGGESTED_COUNTRIES = ['UAE', 'Saudi Arabia', 'Qatar', 'Japan', 'Germany', 'Australia'];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'salary-high', label: 'Salary: high to low' },
  { value: 'salary-low', label: 'Salary: low to high' },
  { value: 'country-asc', label: 'Country: A–Z' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

const KNOWN_CATEGORIES = JOB_CATEGORIES.filter((c) => c !== ANY_CATEGORY);

/** Best-effort category inference, since jobs have no category column. */
function inferCategory(title: string, description: string): string {
  const haystack = `${title} ${description}`.toLowerCase();
  return KNOWN_CATEGORIES.find((category) => haystack.includes(category.toLowerCase())) ?? 'Other';
}

function experienceLabel(value: string): string {
  return JOB_EXPERIENCE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function filterJobs(jobs: JobListItem[], filters: JobFilters): JobListItem[] {
  const keyword = filters.keyword.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();

  return jobs.filter((job) => {
    if (keyword) {
      const matches =
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword) ||
        job.skills.some((skill) => skill.toLowerCase().includes(keyword));
      if (!matches) return false;
    }

    if (location && !job.location.toLowerCase().includes(location)) return false;

    if (filters.country !== ANY_COUNTRY && job.country.toLowerCase() !== filters.country.toLowerCase()) {
      return false;
    }

    if (filters.jobCategory !== ANY_CATEGORY && job.category !== filters.jobCategory) return false;

    if (filters.experienceLevel !== ANY_EXPERIENCE && job.experienceLevel !== filters.experienceLevel) {
      return false;
    }

    if (filters.visaSponsorship && !job.visaSponsorship) return false;

    if (filters.skills.length > 0) {
      const hasSkill = filters.skills.some((skill) =>
        job.skills.some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase())),
      );
      if (!hasSkill) return false;
    }

    if (isSalaryFilterActive(filters)) {
      if (job.salaryMin == null && job.salaryMax == null) return false;
      const jobMin = job.salaryMin ?? 0;
      const jobMax = job.salaryMax ?? jobMin;
      if (jobMax < filters.salaryMin || jobMin > filters.salaryMax) return false;
    }

    return true;
  });
}

function sortJobs(jobs: JobListItem[], sort: SortOption): JobListItem[] {
  const sorted = [...jobs];
  switch (sort) {
    case 'salary-high':
      return sorted.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
    case 'salary-low':
      return sorted.sort((a, b) => (a.salaryMin ?? 0) - (b.salaryMin ?? 0));
    case 'country-asc':
      return sorted.sort((a, b) => a.country.localeCompare(b.country));
    default:
      return sorted.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  }
}

function topFacets(jobs: JobListItem[], key: 'category' | 'country', limit: number): JobFacet[] {
  const counts = new Map<string, number>();
  jobs.forEach((job) => {
    const value = job[key];
    if (!value || value === 'Other') return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export default function Jobs() {
  const { user, isAuthenticated, role } = useAuth();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<JobFilters>(EMPTY_JOB_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<JobListItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savePendingId, setSavePendingId] = useState<string | null>(null);

  const debouncedKeyword = useDebounce(keywordInput, 400);

  useEffect(() => {
    setFilters((prev) => (prev.keyword === debouncedKeyword ? prev : { ...prev, keyword: debouncedKeyword }));
  }, [debouncedKeyword]);

  // Seed filters from homepage search links.
  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const country = searchParams.get('location') || ANY_COUNTRY;
    const category = searchParams.get('category') || ANY_CATEGORY;

    setKeywordInput(keyword);
    setFilters((prev) => ({ ...prev, keyword, country, jobCategory: category }));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('jobs')
          .select('*, job_skills (skill_name)')
          .eq('status', 'ACTIVE')
          .order('posted_at', { ascending: false });

        if (error) throw error;

        const employerIds = [...new Set((data || []).map((job: any) => job.employer_id).filter(Boolean))];
        const companyMap = new Map<string, { name: string; logoUrl: string | null }>();

        if (employerIds.length > 0) {
          const { data: companies } = await supabase
            .from('employer_company_info' as any)
            .select('user_id, company_name, company_logo_url')
            .in('user_id', employerIds);

          (companies || []).forEach((company: any) => {
            companyMap.set(company.user_id, {
              name: company.company_name,
              logoUrl: company.company_logo_url ?? null,
            });
          });
        }

        const formatted: JobListItem[] = (data || []).map((job: any) => {
          const company = companyMap.get(job.employer_id);
          const description: string = job.description ?? '';

          return {
            id: job.id,
            slug: job.slug || job.id,
            title: job.title,
            company: company?.name || 'Verified employer',
            companyLogoUrl: company?.logoUrl ?? null,
            location: `${job.location}, ${job.country}`,
            country: job.country,
            salaryDisplay: job.salary_display ?? null,
            rawSalaryMin: job.salary_min ?? null,
            rawSalaryMax: job.salary_max ?? null,
            currency: job.currency || 'INR',
            salaryMin: job.salary_min == null ? null : convertSalaryToINR(job.salary_min, job.currency),
            salaryMax: job.salary_max == null ? null : convertSalaryToINR(job.salary_max, job.currency),
            type: job.job_type === 'FULL_TIME' ? 'Full-time' : job.job_type === 'PART_TIME' ? 'Part-time' : 'Contract',
            category: inferCategory(job.title, description),
            experienceLevel: job.experience_level ?? '',
            visaSponsorship: job.visa_sponsorship || false,
            postedAt: new Date(job.posted_at),
            description: description.length > 180 ? `${description.slice(0, 180).trimEnd()}…` : description,
            skills: job.job_skills?.map((s: any) => s.skill_name) || [],
          };
        });

        if (!cancelled) setAllJobs(formatted);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        if (!cancelled) {
          toast.error('Failed to load jobs');
          setAllJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedJobIds(new Set());
      return;
    }

    let cancelled = false;
    supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!cancelled && data) setSavedJobIds(new Set(data.map((row: any) => row.job_id)));
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const jobs = useMemo(() => sortJobs(filterJobs(allJobs, filters), sortOption), [allJobs, filters, sortOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOption]);

  const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(
    () => jobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE),
    [jobs, currentPage],
  );

  const activeFilterCount = countActiveFilters(filters);

  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];

    if (filters.country !== ANY_COUNTRY) {
      chips.push({ label: filters.country, clear: () => setFilters((f) => ({ ...f, country: ANY_COUNTRY })) });
    }
    if (filters.location.trim()) {
      chips.push({ label: filters.location, clear: () => setFilters((f) => ({ ...f, location: '' })) });
    }
    if (filters.jobCategory !== ANY_CATEGORY) {
      chips.push({ label: filters.jobCategory, clear: () => setFilters((f) => ({ ...f, jobCategory: ANY_CATEGORY })) });
    }
    if (filters.experienceLevel !== ANY_EXPERIENCE) {
      chips.push({
        label: experienceLabel(filters.experienceLevel),
        clear: () => setFilters((f) => ({ ...f, experienceLevel: ANY_EXPERIENCE })),
      });
    }
    if (filters.visaSponsorship) {
      chips.push({ label: 'Visa sponsored', clear: () => setFilters((f) => ({ ...f, visaSponsorship: false })) });
    }
    if (isSalaryFilterActive(filters)) {
      chips.push({
        label: `${formatINRAmount(filters.salaryMin)} – ${formatINRAmount(filters.salaryMax)}`,
        clear: () => setFilters((f) => ({ ...f, salaryMin: SALARY_FILTER_MIN, salaryMax: SALARY_FILTER_MAX })),
      });
    }
    filters.skills.forEach((skill) => {
      chips.push({
        label: skill,
        clear: () => setFilters((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) })),
      });
    });

    return chips;
  }, [filters]);

  /** Names the filters whose removal would surface the most results. */
  const restrictiveFilters = useMemo(() => {
    if (allJobs.length === 0) return [];

    const candidates: { name: string; relaxed: JobFilters }[] = [];
    if (isSalaryFilterActive(filters)) {
      candidates.push({
        name: 'salary',
        relaxed: { ...filters, salaryMin: SALARY_FILTER_MIN, salaryMax: SALARY_FILTER_MAX },
      });
    }
    if (filters.visaSponsorship) {
      candidates.push({ name: 'visa', relaxed: { ...filters, visaSponsorship: false } });
    }
    if (filters.country !== ANY_COUNTRY) {
      candidates.push({ name: 'country', relaxed: { ...filters, country: ANY_COUNTRY } });
    }
    if (filters.jobCategory !== ANY_CATEGORY) {
      candidates.push({ name: 'category', relaxed: { ...filters, jobCategory: ANY_CATEGORY } });
    }
    if (filters.experienceLevel !== ANY_EXPERIENCE) {
      candidates.push({ name: 'experience', relaxed: { ...filters, experienceLevel: ANY_EXPERIENCE } });
    }
    if (filters.skills.length > 0) {
      candidates.push({ name: 'skills', relaxed: { ...filters, skills: [] } });
    }

    return candidates
      .map((candidate) => ({ name: candidate.name, unlocked: filterJobs(allJobs, candidate.relaxed).length }))
      .filter((candidate) => candidate.unlocked > 0)
      .sort((a, b) => b.unlocked - a.unlocked)
      .slice(0, 2)
      .map((candidate) => candidate.name);
  }, [allJobs, filters]);

  // Falls back to static suggestions so the empty state stays useful before any jobs are live.
  const categoryFacets = useMemo(() => {
    const facets = topFacets(allJobs, 'category', 6);
    return facets.length > 0 ? facets : SUGGESTED_CATEGORIES.map((label) => ({ label }));
  }, [allJobs]);

  const countryFacets = useMemo(() => {
    const facets = topFacets(allJobs, 'country', 6);
    return facets.length > 0 ? facets : SUGGESTED_COUNTRIES.map((label) => ({ label }));
  }, [allJobs]);

  const resetFilters = useCallback(() => {
    setKeywordInput('');
    setFilters(EMPTY_JOB_FILTERS);
  }, []);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = async (job: JobListItem) => {
    if (!user) {
      toast.error('Sign in to save jobs');
      return;
    }

    const alreadySaved = savedJobIds.has(job.id);
    setSavePendingId(job.id);

    try {
      if (alreadySaved) {
        const { error } = await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', job.id);
        if (error) throw error;
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
        toast.success('Removed from saved jobs');
      } else {
        const { error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: job.id });
        if (error) throw error;
        setSavedJobIds((prev) => new Set(prev).add(job.id));
        toast.success('Saved for later');
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
      toast.error('Could not update saved jobs');
    } finally {
      setSavePendingId(null);
    }
  };

  const handleSaveSearch = async (name: string, alertsEnabled: boolean, alertFrequency: string) => {
    if (!user) {
      toast.error('Please sign in to save searches');
      return;
    }

    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        search_type: 'jobs',
        name,
        filters: filters as any,
        alerts_enabled: alertsEnabled,
        alert_frequency: alertFrequency,
      } as any);

      if (error) throw error;
      toast.success('Search saved');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      throw error;
    }
  };

  const jobsContent = (
    <>
      <JobSearchHero
        keyword={keywordInput}
        country={filters.country}
        loading={loading}
        quickCategories={QUICK_CATEGORIES}
        onKeywordChange={setKeywordInput}
        onCountryChange={(country) => setFilters((f) => ({ ...f, country }))}
        onSelectCategory={(category) => setFilters((f) => ({ ...f, jobCategory: category }))}
        onSearch={() => setFilters((f) => ({ ...f, keyword: keywordInput }))}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[288px_1fr] xl:grid-cols-[312px_1fr]">
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
          <JobSearchFilters filters={filters} onFiltersChange={setFilters} />

          {isAuthenticated && role === 'worker' && (
            <Button variant="outline" asChild className="mt-3 w-full gap-2">
              <Link to="/worker/saved-searches">
                <BookmarkCheck className="h-4 w-4" />
                Saved searches
              </Link>
            </Button>
          )}
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {loading ? 'Searching…' : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} found`}
            </p>

            <div className="flex items-center gap-2">
              <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-sm">
                  <SheetHeader className="border-b border-border/60 px-5 py-4">
                    <SheetTitle className="text-base">Filters</SheetTitle>
                  </SheetHeader>
                  <JobSearchFilters filters={filters} onFiltersChange={setFilters} className="rounded-none border-0" />
                  <div className="sticky bottom-0 border-t border-border/60 bg-card p-4">
                    <Button className="w-full" onClick={() => setFiltersSheetOpen(false)}>
                      Show {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4" />
                Save search
              </Button>

              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="h-9 w-[168px] text-sm" aria-label="Sort jobs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <Badge key={chip.label} variant="secondary" className="gap-1.5 py-1 pl-3 pr-2 font-normal">
                  {chip.label}
                  <button type="button" aria-label={`Remove ${chip.label} filter`} onClick={chip.clear}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={resetFilters}>
                Clear all
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2.5">
                      <Skeleton className="h-5 w-2/5" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <JobsEmptyState
              restrictiveFilters={restrictiveFilters}
              categories={categoryFacets}
              countries={countryFacets}
              onClearFilters={resetFilters}
              onCreateAlert={() => setShowSaveDialog(true)}
              onSelectCategory={(category) => setFilters({ ...EMPTY_JOB_FILTERS, jobCategory: category })}
              onSelectCountry={(country) => setFilters({ ...EMPTY_JOB_FILTERS, country })}
            />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedJobs.map((job) => (
                  <JobResultCard
                    key={job.id}
                    job={job}
                    saved={savedJobIds.has(job.id)}
                    savePending={savePendingId === job.id}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SavedSearchDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onSave={handleSaveSearch} />
    </>
  );

  const jobListingStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'International Jobs - SafeWorkGlobal',
    description: 'Browse international job opportunities with visa sponsorship',
    numberOfItems: jobs.length,
    itemListElement: jobs.slice(0, 10).map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        hiringOrganization: { '@type': 'Organization', name: job.company },
        jobLocation: { '@type': 'Place', address: job.location },
        employmentType: job.type,
      },
    })),
  };

  return (
    <PublicOrWorkerPortalLayout
      page="jobs"
      publicHead={
        <SEOHead
          title="SafeWork Global | International Jobs | Find Global Opportunities"
          description="Browse international job opportunities for skilled workers in construction, electrical, welding and more. Visa sponsorship available across 40+ countries."
          keywords="international jobs, overseas jobs, visa sponsorship jobs, construction jobs abroad, welding jobs overseas, skilled worker jobs, gulf jobs, middle east jobs"
          canonicalUrl={`${window.location.origin}/jobs`}
          ogType="website"
          structuredData={jobListingStructuredData}
        />
      }
    >
      <WorkerJobsGate>{jobsContent}</WorkerJobsGate>
    </PublicOrWorkerPortalLayout>
  );
}
