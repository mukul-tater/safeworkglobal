import { useState, useEffect, type ReactNode } from 'react';
import { formatSalaryINR } from '@/lib/utils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PublicOrWorkerPortalLayout } from '@/modules/worker-registration/components/WorkerPortalShell';
import WorkerJobsGate from '@/modules/worker-registration/components/WorkerJobsGate';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Building2, 
  CheckCircle2, ArrowLeft, Users, Shield, Calendar,
  Share2, Bookmark, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { JobDetailSkeleton } from '@/components/ui/page-skeleton';
import { withRetry } from '@/lib/retry';

interface JobData {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  job_type: string;
  status: string;
  employer_id: string;
  experience_level: string;
  benefits: string | null;
  requirements: string | null;
  responsibilities: string | null;
  openings: number;
  visa_sponsorship: boolean;
  posted_at: string;
  slug: string;
  job_skills: { skill_name: string }[];
}

interface EmployerProfile {
  company_name: string | null;
  industry: string | null;
  company_size: string | null;
  bio: string | null;
}

export default function JobDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();
  const isLoggedIn = isAuthenticated;
  const { toast } = useToast();
  
  const [job, setJob] = useState<JobData | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // Safety net: never let the page sit in "loading" forever.
    const watchdog = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    const loadData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        // Fetch job by slug with skills
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            *,
            job_skills (skill_name)
          `)
          .eq('slug', slug)
          .single();

        if (jobError || !jobData) {
          if (cancelled) return;
          toast({
            title: 'Job not found',
            description: 'This job listing does not exist',
            variant: 'destructive'
          });
          navigate('/jobs');
          return;
        }

        if (cancelled) return;
        setJob(jobData as any);

        // Fetch employer profile
        const { data: employerData } = await supabase
          .from('employer_company_info' as any)
          .select('company_name, industry, company_size, bio')
          .eq('user_id', jobData.employer_id)
          .maybeSingle();

        if (employerData && !cancelled) {
          setEmployer(employerData as any);
        }

        // Check if user has already applied and if job is saved
        if (!cancelled && user) {
            const { data: application } = await supabase
              .from('job_applications')
              .select('id')
              .eq('worker_id', user.id)
              .eq('job_id', jobData.id)
              .maybeSingle();

            setHasApplied(!!application);

            const { data: savedJob } = await supabase
              .from('saved_jobs')
              .select('id')
              .eq('user_id', user.id)
              .eq('job_id', jobData.id)
              .maybeSingle();

            setIsSaved(!!savedJob);
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(watchdog);
      }
    };

    loadData();
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]);

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      navigate('/worker/login', { state: { returnTo: `/jobs/${slug}` } });
      return;
    }
    if (role === 'employer') {
      toast({ title: 'Not Allowed', description: 'Employers cannot apply for jobs.', variant: 'destructive' });
      return;
    }
    void handleApply();
  };

  const handleApply = async () => {
    if (!job || applying) return;
    setApplying(true);

    try {
      if (!user) return;

      const inserted = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('job_applications')
            .insert({
              job_id: job.id,
              worker_id: user.id,
              employer_id: job.employer_id,
              status: 'PENDING',
              cover_letter: 'Application submitted through platform',
            })
            .select('id')
            .single();
          if (error) throw error;
          return data;
        },
        {
          onAttempt: (n) => {
            if (n > 1) toast({ title: `Retrying submission… (${n}/3)` });
          },
        }
      );

      setHasApplied(true);
      toast({ title: 'Application Submitted!', description: 'Your application has been sent to the employer' });
      if (inserted?.id) {
        navigate(`/worker/application-success/${inserted.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Could not submit application',
        description: error?.message || 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Job link has been copied to clipboard',
      });
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn) {
      navigate('/worker/login', { state: { returnTo: `/jobs/${slug}` } });
      return;
    }

    if (!user || !job) return;

    setSaving(true);

    try {
      if (isSaved) {
        // Unsave the job
        await withRetry(
          async () => {
            const { error } = await supabase
              .from('saved_jobs')
              .delete()
              .eq('user_id', user.id)
              .eq('job_id', job.id);
            if (error) throw error;
          },
          {
            onAttempt: (n) => {
              if (n > 1) toast({ title: `Retrying… (${n}/3)` });
            },
          }
        );

        setIsSaved(false);
        toast({
          title: 'Job Removed',
          description: 'Job removed from your saved list',
        });
      } else {
        // Save the job
        await withRetry(
          async () => {
            const { error } = await supabase
              .from('saved_jobs')
              .insert({ user_id: user.id, job_id: job.id });
            if (error) throw error;
          },
          {
            onAttempt: (n) => {
              if (n > 1) toast({ title: `Retrying… (${n}/3)` });
            },
          }
        );

        setIsSaved(true);
        toast({
          title: 'Job Saved',
          description: 'Job added to your saved list',
        });
      }
    } catch (error: any) {
      toast({
        title: isSaved ? 'Could not unsave job' : 'Could not save job',
        description: error?.message || 'Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const layout = (content: ReactNode, publicHead?: ReactNode) => (
    <PublicOrWorkerPortalLayout page="jobs" publicHead={publicHead}>
      <WorkerJobsGate>{content}</WorkerJobsGate>
    </PublicOrWorkerPortalLayout>
  );

  if (loading) {
    return layout(<JobDetailSkeleton />);
  }

  if (!job) {
    return layout(
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-6">This job listing may have been removed or expired.</p>
        <Button onClick={() => navigate('/jobs')}>Browse All Jobs</Button>
      </div>,
    );
  }

  const companyName = employer?.company_name || 'SafeWork Global';

  // Structured data for job posting
  const jobStructuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.posted_at,
    "validThrough": new Date(new Date(job.posted_at).setMonth(new Date(job.posted_at).getMonth() + 3)).toISOString(),
    "employmentType": job.job_type.replace('_', ' '),
    "hiringOrganization": {
      "@type": "Organization",
      "name": companyName,
      "description": employer?.bio || undefined
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": job.country
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": job.currency,
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salary_min,
        "maxValue": job.salary_max,
        "unitText": "MONTH"
      }
    },
    "experienceRequirements": job.experience_level,
    "qualifications": job.requirements || undefined,
    "responsibilities": job.responsibilities || undefined,
    "skills": job.job_skills?.map(s => s.skill_name).join(', ') || undefined
  };

  return layout(
    <>
      <Link to="/jobs">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">{job.job_type.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{job.experience_level}</Badge>
                    {job.visa_sponsorship && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Visa Sponsorship
                      </Badge>
                    )}
                    <Badge variant={job.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                  
                  <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">{companyName}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{job.location}, {job.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatSalaryINR(job.salary_min, job.salary_max, job.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{job.openings} openings</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Posted {format(new Date(job.posted_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
                </CardContent>
              </Card>

              {/* Responsibilities */}
              {job.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.benefits}</p>
                  </CardContent>
                </Card>
              )}

              {/* Required Skills */}
              {job.job_skills && job.job_skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.job_skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  {role === 'employer' ? (
                    <Alert>
                      <AlertDescription>
                        As an employer, you cannot apply for jobs.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleApplyClick}
                      disabled={hasApplied || applying || job.status !== 'ACTIVE'}
                      className="w-full"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Applying...
                        </>
                      ) : hasApplied ? (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Already Applied
                        </>
                      ) : !isLoggedIn ? (
                        'Sign Up to Apply'
                      ) : (
                        'Apply Now'
                      )}
                    </Button>
                  )}
                  
                  {hasApplied && (
                    <Alert className="bg-success/10 border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">
                        Your application is under review.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`flex-1 ${isSaved ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                      {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Company</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{companyName}</h4>
                      {employer?.industry && (
                        <p className="text-sm text-muted-foreground">{employer.industry}</p>
                      )}
                    </div>
                  </div>
                  
                  {employer?.bio && (
                    <p className="text-sm text-muted-foreground">{employer.bio}</p>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {employer?.company_size && (
                      <div>
                        <span className="text-muted-foreground block">Size</span>
                        <p className="font-medium">{employer.company_size}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block">Visa Support</span>
                      <p className="font-medium">{job.visa_sponsorship ? 'Available' : 'Not Available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Type</span>
                    <span className="font-medium">{job.job_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience Level</span>
                    <span className="font-medium">{job.experience_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{job.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Openings</span>
                    <span className="font-medium">{job.openings} positions</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </>,
    <SEOHead
      title={`${job.title} at ${companyName} | SafeWorkGlobal`}
      description={`Apply for ${job.title} in ${job.location}, ${job.country}. ${job.visa_sponsorship ? 'Visa sponsorship available.' : ''} Salary: ${formatSalaryINR(job.salary_min, job.salary_max, job.currency)}/month.`}
      keywords={`${job.title}, ${job.location} jobs, ${job.country} jobs, ${companyName} careers, ${job.job_skills?.map(s => s.skill_name).join(', ')}`}
      canonicalUrl={`${window.location.origin}/jobs/${job.slug}`}
      ogType="article"
      structuredData={jobStructuredData}
    />,
  );
}