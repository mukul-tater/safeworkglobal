import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  User, FileText, Briefcase, Building2,
  CheckCircle2, ChevronRight, X, Mail, CalendarClock, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  completed: boolean;
}

interface OnboardingStepperProps {
  onDismiss?: () => void;
}

export default function OnboardingStepper({ onDismiss }: OnboardingStepperProps) {
  const { user, role, profile, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (user && role) {
      checkOnboardingProgress();
    }
  }, [user, role, profile, isEmailVerified]);

  const checkOnboardingProgress = async () => {
    if (!user) return;

    try {
      const emailStep: OnboardingStep = {
        id: 'email',
        title: 'Verify Email',
        shortTitle: 'Email',
        description: 'Confirm your email address',
        icon: <Mail className="h-3.5 w-3.5" />,
        route: '/verify-email?send=1',
        completed: isEmailVerified,
      };

      if (role === 'worker') {
        const [profileRes, docsRes, skillsRes] = await Promise.all([
          supabase.from('worker_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('worker_documents').select('id').eq('worker_id', user.id),
          supabase.from('worker_skills').select('id').eq('worker_id', user.id),
        ]);

        const workerProfile = profileRes.data;
        const hasBasicInfo = !!profile?.full_name && !!profile?.phone;
        const hasBio = !!workerProfile?.bio;
        const hasDocs = (docsRes.data?.length || 0) > 0;
        const hasSkills = (skillsRes.data?.length || 0) > 0;
        const hasAvailability = !!workerProfile?.availability;

        setSteps([
          emailStep,
          {
            id: 'basic',
            title: 'Complete Basic Profile',
            shortTitle: 'Profile',
            description: 'Add your name, phone, and bio',
            icon: <User className="h-3.5 w-3.5" />,
            route: '/worker/profile',
            completed: hasBasicInfo && hasBio,
          },
          {
            id: 'documents',
            title: 'Upload Documents',
            shortTitle: 'Documents',
            description: 'Add passport, ID, and certificates',
            icon: <FileText className="h-3.5 w-3.5" />,
            route: '/worker/documents',
            completed: hasDocs,
          },
          {
            id: 'skills',
            title: 'Add Your Skills',
            shortTitle: 'Skills',
            description: 'Add skills with photos or videos',
            icon: <GraduationCap className="h-3.5 w-3.5" />,
            route: '/worker/profile#skills',
            completed: hasSkills,
          },
          {
            id: 'availability',
            title: 'Set Availability',
            shortTitle: 'Availability',
            description: 'Tell employers when you can start',
            icon: <CalendarClock className="h-3.5 w-3.5" />,
            route: '/worker/profile#preferences',
            completed: hasAvailability,
          },
        ]);
      } else if (role === 'employer') {
        const [profileRes, jobsRes] = await Promise.all([
          supabase.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('jobs').select('id').eq('employer_id', user.id),
        ]);

        const employerProfile = profileRes.data;
        const hasBasicInfo = !!profile?.full_name;
        const hasCompanyInfo = !!employerProfile?.company_name;
        const hasJobs = (jobsRes.data?.length || 0) > 0;

        setSteps([
          emailStep,
          {
            id: 'basic',
            title: 'Complete Your Profile',
            shortTitle: 'Profile',
            description: 'Add your name and contact info',
            icon: <User className="h-3.5 w-3.5" />,
            route: '/employer/profile',
            completed: hasBasicInfo,
          },
          {
            id: 'company',
            title: 'Company Information',
            shortTitle: 'Company',
            description: 'Add company name and details',
            icon: <Building2 className="h-3.5 w-3.5" />,
            route: '/employer/company',
            completed: hasCompanyInfo,
          },
          {
            id: 'job',
            title: 'Post Your First Job',
            shortTitle: 'First Job',
            description: 'Create a job listing to attract workers',
            icon: <Briefcase className="h-3.5 w-3.5" />,
            route: '/employer/post-job',
            completed: hasJobs,
          },
        ]);
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const isComplete = progress === 100;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed || isComplete || steps.length === 0) return null;

  const nextStep = steps.find((s) => !s.completed);
  const nextIndex = nextStep ? steps.findIndex((s) => s.id === nextStep.id) : -1;

  return (
    <div className="mb-6 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 border-b border-border/40 bg-muted/20">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Profile setup</p>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {steps.length} complete
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {nextStep && (
            <Button size="sm" className="h-8 text-xs hidden sm:inline-flex" onClick={() => navigate(nextStep.route)}>
              Continue
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 space-y-4">
        <Progress value={progress} className="h-1.5" />

        <div className="flex items-start justify-between gap-1">
          {steps.map((step, index) => {
            const isCurrent = index === nextIndex;
            const isPast = step.completed;
            const isFuture = !isPast && !isCurrent;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => !step.completed && navigate(step.route)}
                disabled={step.completed}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1.5 min-w-0 group',
                  !step.completed && 'cursor-pointer',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    isPast && 'border-emerald-500 bg-emerald-500 text-white',
                    isCurrent && 'border-primary bg-primary text-primary-foreground shadow-sm',
                    isFuture && 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
                </div>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-medium text-center leading-tight truncate w-full px-0.5',
                    isPast && 'text-emerald-600 dark:text-emerald-400',
                    isCurrent && 'text-primary',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {step.shortTitle}
                </span>
              </button>
            );
          })}
        </div>

        {nextStep && (
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Next: {nextStep.title}</p>
              <p className="text-xs text-muted-foreground truncate">{nextStep.description}</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 shrink-0 sm:hidden" onClick={() => navigate(nextStep.route)}>
              Go
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
