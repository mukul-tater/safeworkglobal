import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Clock, Briefcase, Bell, Sparkles } from 'lucide-react';

/**
 * Shown immediately after a worker successfully applies to a job.
 * Reinforces success + nudges next action (track / explore more / complete profile).
 */
export default function ApplicationSuccess() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState<string>('the position');
  const [companyName, setCompanyName] = useState<string>('the employer');

  useEffect(() => {
    const load = async () => {
      if (!applicationId) return;
      const { data } = await supabase
        .from('job_applications')
        .select('jobs:job_id(title, employer_id)')
        .eq('id', applicationId)
        .maybeSingle();
      const j: any = (data as any)?.jobs;
      if (j?.title) setJobTitle(j.title);
      if (j?.employer_id) {
        const { data: emp } = await supabase
          .from('employer_profiles')
          .select('company_name')
          .eq('user_id', j.employer_id)
          .maybeSingle();
        if ((emp as any)?.company_name) setCompanyName((emp as any).company_name);
      }
    };
    load();
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4 animate-bounce-subtle">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">
            Application submitted! 🎉
          </h1>
          <p className="text-muted-foreground">
            You applied for <span className="font-semibold text-foreground">{jobTitle}</span>
            {companyName !== 'the employer' && <> at <span className="font-semibold text-foreground">{companyName}</span></>}
          </p>
        </div>

        <Card className="shadow-lg border-border/60 mb-5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">What happens next</p>
                <p className="text-sm text-muted-foreground">
                  The employer will review your profile within 2–5 days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-info/10 shrink-0">
                <Bell className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="font-semibold text-sm">You'll be notified</p>
                <p className="text-sm text-muted-foreground">
                  We'll alert you the moment they respond — check your dashboard for updates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-success/10 shrink-0">
                <Sparkles className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-sm">Boost your chances</p>
                <p className="text-sm text-muted-foreground">
                  Complete your profile to stand out from other applicants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2.5">
          <Button
            className="w-full h-12 font-semibold gap-2"
            onClick={() => navigate('/worker/applications')}
          >
            Track your application <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 font-medium gap-2"
            onClick={() => navigate('/jobs')}
          >
            <Briefcase className="h-4 w-4" /> Apply to more jobs
          </Button>
          <Link to="/worker/journey" className="block text-center text-sm text-muted-foreground hover:text-foreground pt-2">
            Complete my profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
