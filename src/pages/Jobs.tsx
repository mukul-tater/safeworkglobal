import { useState, useEffect, useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import { PublicOrWorkerPortalLayout } from '@/modules/worker-registration/components/WorkerPortalShell';
import WorkerJobsGate from '@/modules/worker-registration/components/WorkerJobsGate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import JobSearchFilters, { type JobFilters } from '@/components/search/JobSearchFilters';
import SavedSearchDialog from '@/components/search/SavedSearchDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatSalaryLakh } from '@/lib/utils';
import { SALARY_FILTER_MIN, SALARY_FILTER_MAX, convertSalaryToINR } from '@/lib/jobSalaryUtils';

const JOBS_PER_PAGE = 24;

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  country: string;
  salary: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  category: string;
  visaSponsorship: boolean;
  postedDate: string;
  postedAt: Date;
  description: string;
  skills: string[];
}

type SortOption = 'recent' | 'salary-high' | 'salary-low' | 'country-asc' | 'country-desc';

export default function Jobs() {
  const { user, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<JobFilters>({
    keyword: '',
    location: '',
    country: 'All Countries',
    jobCategory: 'All Categories',
    salaryMin: SALARY_FILTER_MIN,
    salaryMax: SALARY_FILTER_MAX,
    visaSponsorship: false,
    skills: [],
    experienceLevel: 'All Levels'
  });
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return jobs.slice(start, start + JOBS_PER_PAGE);
  }, [jobs, currentPage]);

  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);

  // Load jobs on mount and when search params change
  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const country = searchParams.get('location') || 'All Countries'; // 'location' from homepage is actually country
    const category = searchParams.get('category') || 'All Categories';
    
    const newFilters: JobFilters = {
      ...filters,
      keyword,
      country,
      jobCategory: category
    };
    
    setFilters(newFilters);
    fetchJobsWithFilters(newFilters);
  }, [searchParams]);

  // Re-apply filters when filters change (reactive filtering)
  useEffect(() => {
    if (allJobs.length > 0) {
      applyFiltersToJobs(allJobs, filters);
    }
  }, [filters, sortOption]);

  const fetchJobsWithFilters = async (currentFilters: JobFilters) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_skills (skill_name)
        `)
        .eq('status', 'ACTIVE')
        .order('posted_at', { ascending: false });

      if (error) throw error;

      const employerIds = Array.from(new Set((data || []).map((j: any) => j.employer_id).filter(Boolean)));
      let companyMap: Record<string, string> = {};
      if (employerIds.length > 0) {
        const { data: companies } = await supabase
          .from('employer_company_info' as any)
          .select('user_id, company_name')
          .in('user_id', employerIds);
        companyMap = Object.fromEntries((companies || []).map((c: any) => [c.user_id, c.company_name]));
      }

      const formattedJobs: Job[] = (data || []).map((job: any) => {
        const salaryMinVal = job.salary_min == null ? null : convertSalaryToINR(job.salary_min, job.currency);
        const salaryMaxVal = job.salary_max == null ? null : convertSalaryToINR(job.salary_max, job.currency);
        
        return {
          id: job.id,
          slug: job.slug || job.id,
          title: job.title,
          company: companyMap[job.employer_id] || 'Company',
          location: `${job.location}, ${job.country}`,
          country: job.country,
          salary: job.salary_display || formatSalaryLakh(job.salary_min, job.salary_max, job.currency),
          salaryMin: salaryMinVal,
          salaryMax: salaryMaxVal,
          type: job.job_type === 'FULL_TIME' ? 'Full-time' : job.job_type === 'PART_TIME' ? 'Part-time' : 'Contract',
          category: job.title.includes(' - ')
          ? job.title.split(' - ').slice(-1)[0]
          : job.title.split(' ')[0],
          visaSponsorship: job.visa_sponsorship || false,
          postedDate: new Date(job.posted_at).toLocaleDateString(),
          postedAt: new Date(job.posted_at),
          description: job.description.substring(0, 150) + '...',
          skills: job.job_skills?.map((s: any) => s.skill_name) || []
        };
      });

      setAllJobs(formattedJobs);
      applyFiltersToJobs(formattedJobs, currentFilters);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      setAllJobs([]);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const sortJobs = (jobsToSort: Job[], sort: SortOption): Job[] => {
    const sorted = [...jobsToSort];
    switch (sort) {
      case 'recent':
        return sorted.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
      case 'salary-high':
        return sorted.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
      case 'salary-low':
        return sorted.sort((a, b) => (a.salaryMin ?? 0) - (b.salaryMin ?? 0));
      case 'country-asc':
        return sorted.sort((a, b) => a.country.localeCompare(b.country));
      case 'country-desc':
        return sorted.sort((a, b) => b.country.localeCompare(a.country));
      default:
        return sorted;
    }
  };

  const applyFiltersToJobs = (jobsToFilter: Job[], currentFilters: JobFilters, sort: SortOption = sortOption) => {
    let filtered = [...jobsToFilter];
    
    if (currentFilters.keyword) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(currentFilters.keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(currentFilters.keyword.toLowerCase()) ||
        job.company.toLowerCase().includes(currentFilters.keyword.toLowerCase())
      );
    }

    if (currentFilters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(currentFilters.location.toLowerCase())
      );
    }

    if (currentFilters.country && currentFilters.country !== 'All Countries') {
      filtered = filtered.filter(job =>
        job.country.toLowerCase().includes(currentFilters.country.toLowerCase())
      );
    }

    if (currentFilters.jobCategory && currentFilters.jobCategory !== 'All Categories') {
      filtered = filtered.filter(job =>
        job.category?.toLowerCase().includes(currentFilters.jobCategory.toLowerCase()) ||
        job.title.toLowerCase().includes(currentFilters.jobCategory.toLowerCase()) ||
        job.description.toLowerCase().includes(currentFilters.jobCategory.toLowerCase())
      );
    }

    if (currentFilters.visaSponsorship) {
      filtered = filtered.filter(job => job.visaSponsorship);
    }

    if (currentFilters.skills.length > 0) {
      filtered = filtered.filter(job =>
        currentFilters.skills.some(skill =>
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    const isSalaryFilterActive =
      currentFilters.salaryMin > SALARY_FILTER_MIN ||
      currentFilters.salaryMax < SALARY_FILTER_MAX;

    if (isSalaryFilterActive) {
      filtered = filtered.filter(job => {
        if (job.salaryMin == null && job.salaryMax == null) return false;
        const jobMin = job.salaryMin ?? 0;
        const jobMax = job.salaryMax ?? jobMin;
        return jobMax >= currentFilters.salaryMin && jobMin <= currentFilters.salaryMax;
      });
    }

    // Apply sorting
    const sortedJobs = sortJobs(filtered, sort);
    setJobs(sortedJobs);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  const handleSearch = () => {
    fetchJobsWithFilters(filters);
  };

  const handleSaveSearch = async (name: string, alertsEnabled: boolean, alertFrequency: string) => {
    if (!user) {
      toast.error('Please login to save searches');
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          search_type: 'jobs',
          name,
          filters: filters as any,
          alerts_enabled: alertsEnabled,
          alert_frequency: alertFrequency
        } as any);

      if (error) throw error;
      toast.success('Search saved successfully!');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      throw error;
    }
  };

  // Job Card Component for reuse
  const JobCard = ({ job }: { job: Job }) => (
    <Card 
      className="p-4 md:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/jobs/${job.slug}`)}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 line-clamp-1">{job.title}</h3>
          <p className="text-muted-foreground text-sm">{job.company}</p>
        </div>
        {job.visaSponsorship && (
          <Badge className="bg-success/10 text-success border-success/20 self-start shrink-0 text-xs">
            <Globe className="h-3 w-3 mr-1" />
            <span className="hidden xs:inline sm:hidden md:inline">Visa Sponsorship</span>
            <span className="xs:hidden sm:inline md:hidden">Visa</span>
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3 text-xs sm:text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">{job.location}</span>
        </span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          {job.salary}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          {job.type}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {job.postedDate}
        </span>
      </div>

      <p className="text-muted-foreground mb-3 text-sm line-clamp-2">{job.description}</p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
          ))}
          {job.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">+{job.skills.length - 3}</Badge>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            className="flex-1 sm:flex-none h-9 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/jobs/${job.slug}`);
            }}
          >
            View & Apply
          </Button>
        </div>
      </div>
    </Card>
  );

  const jobsContent = (
    <>
      <header className="mb-5 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2">Find Your Next Global Opportunity</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Browse thousands of international job opportunities with visa sponsorship
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-4 lg:gap-6">
        <aside className="order-2 lg:order-1">
          <JobSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            onSaveSearch={() => setShowSaveDialog(true)}
            loading={loading}
          />

          {isAuthenticated && role === 'worker' && (
            <Card className="mt-4 p-4 hidden lg:block">
              <Link to="/worker/saved-searches">
                <Button variant="outline" className="w-full">
                  View Saved Searches
                </Button>
              </Link>
            </Card>
          )}
        </aside>

        <div className="space-y-3 md:space-y-4 order-1 lg:order-2">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold">
              {loading ? 'Searching...' : `${jobs.length} Jobs Found`}
            </h2>
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-card w-full xs:w-auto"
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
            >
              <option value="recent">Most Recent</option>
              <option value="salary-high">Salary (High to Low)</option>
              <option value="salary-low">Salary (Low to High)</option>
              <option value="country-asc">Country (A-Z)</option>
              <option value="country-desc">Country (Z-A)</option>
            </select>
          </div>

          {loading ? (
            <Card className="p-8 md:p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm md:text-base">Loading jobs...</p>
            </Card>
          ) : (
            <>
              {paginatedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}

              {jobs.length === 0 && (
                <Card className="p-8 md:p-12 text-center">
                  <Briefcase className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Try adjusting your filters or search criteria
                  </p>
                </Card>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SavedSearchDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveSearch}
      />
    </>
  );

  // Structured data for job listings (public SEO only)
  const jobListingStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "International Jobs - SafeWorkGlobal",
    "description": "Browse thousands of international job opportunities with visa sponsorship",
    "numberOfItems": jobs.length,
    "itemListElement": jobs.slice(0, 10).map((job, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description,
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.company
        },
        "jobLocation": {
          "@type": "Place",
          "address": job.location
        },
        "employmentType": job.type
      }
    }))
  };

  return (
    <PublicOrWorkerPortalLayout
      page="jobs"
      publicHead={
        <SEOHead
          title="International Jobs | Find Global Opportunities | SafeWorkGlobal"
          description="Browse 900+ international job opportunities for skilled workers in construction, electrical, welding, and more. Visa sponsorship available across 40+ countries."
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