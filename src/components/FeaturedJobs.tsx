import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Clock, ArrowRight, Bookmark, Share2, Zap, Sparkles, BadgeCheck } from 'lucide-react';
import JobSalaryText from '@/components/JobSalaryText';
import { useToast } from '@/hooks/use-toast';
import { SkeletonJobGrid } from '@/components/ui/skeleton-card';

interface FeaturedJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  salary_display?: string | null;
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

function hasSalary(job: FeaturedJob): boolean {
  return Boolean(job.salary_display || job.salary_min != null || job.salary_max != null);
}

export default function FeaturedJobs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            job_skills (skill_name)
          `)
          .eq('status', 'ACTIVE')
          .order('posted_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        const employerIds = Array.from(new Set((data || []).map((j: { employer_id?: string }) => j.employer_id).filter(Boolean)));
        let companyMap: Record<string, string> = {};
        if (employerIds.length > 0) {
          const { data: companies } = await supabase
            .from('employer_company_info' as any)
            .select('user_id, company_name')
            .in('user_id', employerIds);
          companyMap = Object.fromEntries(((companies as any[]) || []).map((c: { user_id: string; company_name: string }) => [c.user_id, c.company_name]));
        }
        const enriched = (data || []).map((j: { employer_id?: string }) => ({
          ...j,
          employer_profiles: { company_name: companyMap[j.employer_id as string] || 'Verified Employer' },
        }));
        setJobs(enriched as FeaturedJob[]);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const getJobTypeBadge = (type: string) => {
    const variants = {
      'FULL_TIME': 'default',
      'PART_TIME': 'secondary',
      'CONTRACT': 'outline'
    } as const;
    return variants[type as keyof typeof variants] || 'default';
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const handleSaveJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      toast({ title: "Job removed", description: "Job removed from your saved list" });
    } else {
      newSavedJobs.add(jobId);
      toast({ title: "Job saved!", description: "Job added to your saved list" });
    }
    setSavedJobs(newSavedJobs);
  };

  const handleShareJob = async (job: FeaturedJob) => {
    const shareData = {
      title: job.title,
      text: `Check out this job: ${job.title} at ${job.employer_profiles?.company_name || 'Company'}`,
      url: `${globalThis.location.origin}/jobs/${job.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!", description: "Job has been shared" });
      } catch {
        // user cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Link copied!", description: "Job link copied to clipboard" });
    }
  };

  const handleQuickApply = (jobSlug: string) => {
    navigate(`/jobs/${jobSlug}`);
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24 relative overflow-hidden" id="jobs">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10 lg:mb-14">
            <div className="h-6 w-40 rounded-full shimmer mx-auto mb-4" />
            <div className="h-8 w-72 rounded shimmer mx-auto mb-3" />
            <div className="h-5 w-64 rounded shimmer mx-auto" />
          </div>
          <SkeletonJobGrid count={6} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden" id="jobs">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Open Positions
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-foreground mb-3 tracking-tight">
            Verified Jobs <span className="text-gradient">Abroad</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Live openings from verified employers — typically ₹50K–₹1L/month for skilled trades
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <p className="text-muted-foreground mb-4">
              New jobs are being added regularly. Sign up free to get notified when openings match your skills.
            </p>
            <Link to="/worker/quick-signup">
              <Button size="lg" className="rounded-xl gap-2">
                Sign Up Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-10 lg:mb-12">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="group h-full relative overflow-hidden bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col"
                  onClick={() => navigate(`/jobs/${job.slug || job.id}`)}
                >
                  <div className="h-1 bg-gradient-to-r from-primary via-secondary to-info opacity-60 group-hover:opacity-100 transition-opacity" />

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge className="text-xs bg-success/10 text-success border-success/20 hover:bg-success/10">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {getDaysAgo(job.posted_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold font-heading text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {job.title}
                    </h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{job.employer_profiles?.company_name}</span>
                    </p>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{job.location}, {job.country}</span>
                    </div>

                    {hasSalary(job) && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 mb-3">
                        {job.salary_display ? (
                          <p className="text-lg font-bold text-primary">{job.salary_display}</p>
                        ) : (
                          <JobSalaryText
                            min={job.salary_min}
                            max={job.salary_max}
                            currency={job.currency}
                            primaryClassName="text-lg font-bold text-primary"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">per month (approx.)</p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={getJobTypeBadge(job.job_type)} className="text-xs">
                        {job.job_type.replace('_', ' ')}
                      </Badge>
                      {job.visa_sponsorship && (
                        <Badge variant="secondary" className="text-xs bg-info/10 text-info border-info/20">
                          <Zap className="h-3 w-3 mr-1" />
                          Visa Sponsored
                        </Badge>
                      )}
                      {job.job_skills?.slice(0, 2).map((skill) => (
                        <Badge key={skill.skill_name} variant="outline" className="text-xs bg-muted/50">
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        className="flex-1 rounded-xl group/btn"
                        onClick={(e) => { e.stopPropagation(); handleQuickApply(job.slug || job.id); }}
                      >
                        View & Apply
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 rounded-xl"
                        onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }}
                      >
                        <Bookmark className={`h-4 w-4 ${savedJobs.has(job.id) ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 rounded-xl"
                        onClick={(e) => { e.stopPropagation(); handleShareJob(job); }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to="/jobs">
                <Button size="lg" className="rounded-xl px-8 gap-2 shadow-primary hover:shadow-hover transition-all">
                  View All Jobs
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
