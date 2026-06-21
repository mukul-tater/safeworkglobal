import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import JobSalaryText from '@/components/JobSalaryText';
import { MapPin, Briefcase, ArrowRight, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  slug: string | null;
  location: string;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  experience_level: string;
  visa_sponsorship: boolean | null;
}

/**
 * Instant-value page shown right after signup.
 * Workers see real jobs immediately instead of an empty dashboard.
 */
export default function WorkerDiscover() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileScore, setProfileScore] = useState(20);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Get worker's signup country to personalize
        let workerCountry: string | null = null;
        if (user) {
          const { data: wp } = await supabase
            .from('worker_profiles')
            .select('country, nationality, primary_work_type, skill_level, onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();
          workerCountry = (wp as any)?.country || (wp as any)?.nationality || null;
          setCountry(workerCountry);

          // Rough profile score
          let score = 20; // signup done
          if (profile?.full_name) score += 10;
          if (profile?.phone) score += 10;
          if ((wp as any)?.primary_work_type) score += 20;
          if ((wp as any)?.skill_level) score += 15;
          if ((wp as any)?.onboarding_completed) score += 25;
          setProfileScore(Math.min(score, 100));
        }

        // Show featured jobs (top destinations matter more than personalization here)
        const { data } = await supabase
          .from('jobs')
          .select('id, title, slug, location, country, salary_min, salary_max, currency, experience_level, visa_sponsorship')
          .eq('status', 'ACTIVE')
          .order('posted_at', { ascending: false })
          .limit(6);

        setJobs((data as any) || []);
      } catch (err) {
        console.error('Failed to load discover jobs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, profile]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/safework-global-logo.png" alt="SafeWorkGlobal" className="h-7 w-7" />
            <span className="font-heading font-bold text-sm hidden sm:inline">SafeWorkGlobal</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate('/worker/dashboard')}>
            My Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-1">
            Hi {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Here are jobs you can apply to right now.
          </p>
        </div>

        {/* Profile progress nudge */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-info/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Profile {profileScore}% complete
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete your profile to increase your chances of getting hired
                </p>
              </div>
              <Button size="sm" variant="default" onClick={() => navigate('/worker/onboarding')} className="shrink-0">
                Complete <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
            <Progress value={profileScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Trust strip */}
        <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg p-2.5 mb-6">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="font-medium">All jobs below are from verified employers · No agent fees</span>
        </div>

        {/* Jobs */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {country ? `Top jobs for workers from ${country}` : 'Available jobs'}
          </h2>
          <Link to="/jobs" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No jobs available right now. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.slug || job.id}`}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="font-semibold text-base truncate">{job.title}</h3>
                          {job.visa_sponsorship && (
                            <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20">
                              Visa support
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {job.location}, {job.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {job.experience_level}
                          </span>
                        </div>
                        {(job.salary_min != null || job.salary_max != null) && (
                          <p className="font-semibold text-sm text-primary">
                            <JobSalaryText
                              min={job.salary_min}
                              max={job.salary_max}
                              currency={job.currency}
                            />
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            Browse all jobs <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
