import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, MapPin, Building2, DollarSign, Briefcase, Check, Zap, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { convertSalaryToINR } from '@/lib/jobSalaryUtils';
import { formatSalaryLakh } from '@/lib/utils';

interface CompareJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  country: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  job_type: string;
  visa_sponsorship: boolean;
  posted_at: string;
  employer_profiles?: {
    company_name: string;
  } | null;
  job_skills: {
    skill_name: string;
  }[];
}

interface JobComparisonDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: CompareJob[];
  onRemoveJob: (jobId: string) => void;
  onClearAll: () => void;
}

export default function JobComparisonDrawer({
  open,
  onOpenChange,
  jobs,
  onRemoveJob,
  onClearAll,
}: JobComparisonDrawerProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500]);

  // Calculate salary bounds from jobs
  const salaryBounds = useMemo(() => {
    if (jobs.length === 0) return { min: 0, max: 500 };
    
    let minSalary = Infinity;
    let maxSalary = 0;
    
    jobs.forEach(job => {
      const inrMin = convertSalaryToINR(job.salary_min, job.currency);
      const inrMax = convertSalaryToINR(job.salary_max, job.currency);
      minSalary = Math.min(minSalary, inrMin / 1000);
      maxSalary = Math.max(maxSalary, inrMax / 1000);
    });
    
    return { 
      min: Math.floor(minSalary), 
      max: Math.ceil(maxSalary) 
    };
  }, [jobs]);

  // Reset salary range when jobs change
  useMemo(() => {
    setSalaryRange([salaryBounds.min, salaryBounds.max]);
  }, [salaryBounds.min, salaryBounds.max]);

  // Filter jobs based on criteria
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Visa sponsorship filter
      if (visaOnly && !job.visa_sponsorship) {
        return false;
      }
      
      // Salary range filter
      const inrMin = convertSalaryToINR(job.salary_min, job.currency);
      const salaryInK = inrMin / 1000;
      
      if (salaryInK < salaryRange[0] || salaryInK > salaryRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [jobs, visaOnly, salaryRange]);

  const formatSalary = (min: number, max: number, currency: string) =>
    formatSalaryLakh(min, max, currency);

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const comparisonFields = [
    { label: 'Company', key: 'company' },
    { label: 'Location', key: 'location' },
    { label: 'Salary', key: 'salary' },
    { label: 'Job Type', key: 'job_type' },
    { label: 'Visa Sponsorship', key: 'visa' },
    { label: 'Posted', key: 'posted' },
    { label: 'Skills Required', key: 'skills' },
  ];

  const getFieldValue = (job: CompareJob, key: string) => {
    switch (key) {
      case 'company':
        return job.employer_profiles?.company_name || 'N/A';
      case 'location':
        return `${job.location}, ${job.country}`;
      case 'salary':
        return formatSalary(job.salary_min, job.salary_max, job.currency);
      case 'job_type':
        return job.job_type.replace('_', ' ');
      case 'visa':
        return job.visa_sponsorship ? 'Yes' : 'No';
      case 'posted':
        return getDaysAgo(job.posted_at);
      case 'skills':
        return job.job_skills?.map(s => s.skill_name).join(', ') || 'N/A';
      default:
        return 'N/A';
    }
  };

  const resetFilters = () => {
    setVisaOnly(false);
    setSalaryRange([salaryBounds.min, salaryBounds.max]);
  };

  const hasActiveFilters = visaOnly || salaryRange[0] > salaryBounds.min || salaryRange[1] < salaryBounds.max;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh]">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-heading">Compare Jobs</SheetTitle>
              <SheetDescription>
                Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Filters Section */}
        {jobs.length > 0 && (
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="border-b">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between py-3 px-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </div>
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                {/* Visa Sponsorship Filter */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="visa-filter" className="font-medium">
                        Visa Sponsorship Only
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Show only jobs with visa support
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="visa-filter"
                    checked={visaOnly}
                    onCheckedChange={setVisaOnly}
                  />
                </div>

                {/* Salary Range Filter */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">Minimum Salary Range</Label>
                      <p className="text-xs text-muted-foreground">
                        ₹{salaryRange[0]}K - ₹{salaryRange[1]}K /month
                      </p>
                    </div>
                  </div>
                  <Slider
                    value={salaryRange}
                    min={salaryBounds.min}
                    max={salaryBounds.max}
                    step={5}
                    onValueChange={(value) => setSalaryRange(value as [number, number])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>₹{salaryBounds.min}K</span>
                    <span>₹{salaryBounds.max}K</span>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <ScrollArea className="h-[calc(100%-140px)] mt-4">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              {jobs.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No jobs to compare</p>
                  <p className="text-sm text-muted-foreground">
                    Select jobs from the list to compare them
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No jobs match your filters</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filter criteria
                  </p>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-32 sticky left-0 bg-background">
                      Criteria
                    </th>
                    {filteredJobs.map((job) => (
                      <th key={job.id} className="text-left py-3 px-4 min-w-[200px]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground line-clamp-2">
                              {job.title}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => onRemoveJob(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFields.map((field, index) => (
                    <tr
                      key={field.key}
                      className={index % 2 === 0 ? 'bg-muted/30' : ''}
                    >
                      <td className="py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-inherit">
                        <div className="flex items-center gap-2">
                          {field.key === 'company' && <Building2 className="h-4 w-4" />}
                          {field.key === 'location' && <MapPin className="h-4 w-4" />}
                          {field.key === 'salary' && <DollarSign className="h-4 w-4" />}
                          {field.key === 'job_type' && <Briefcase className="h-4 w-4" />}
                          {field.key === 'visa' && <Zap className="h-4 w-4" />}
                          {field.key === 'posted' && <Clock className="h-4 w-4" />}
                          {field.label}
                        </div>
                      </td>
                      {filteredJobs.map((job) => (
                        <td key={job.id} className="py-3 px-4">
                          {field.key === 'visa' ? (
                            <Badge
                              variant={job.visa_sponsorship ? 'default' : 'secondary'}
                              className={
                                job.visa_sponsorship
                                  ? 'bg-success/10 text-success border-success/20'
                                  : ''
                              }
                            >
                              {job.visa_sponsorship && <Check className="h-3 w-3 mr-1" />}
                              {getFieldValue(job, field.key)}
                            </Badge>
                          ) : field.key === 'skills' ? (
                            <div className="flex flex-wrap gap-1">
                              {job.job_skills?.slice(0, 4).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill.skill_name}
                                </Badge>
                              ))}
                            </div>
                          ) : field.key === 'salary' ? (
                            <span className="font-semibold text-primary">
                              {getFieldValue(job, field.key)}
                            </span>
                          ) : (
                            <span className="text-foreground">
                              {getFieldValue(job, field.key)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
