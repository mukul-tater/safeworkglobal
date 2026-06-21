import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Lock, User } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkerJobAccess } from '../hooks/useWorkerJobAccess';

interface WorkerJobsGateProps {
  readonly children: ReactNode;
}

export default function WorkerJobsGate({ children }: WorkerJobsGateProps) {
  const { loading, isWorker, canBrowseJobs, onboardingPath } = useWorkerJobAccess();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isWorker && !canBrowseJobs) {
    return (
      <div className="max-w-lg mx-auto py-8 sm:py-12">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading mb-2">
              Complete your profile to view jobs
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Finish your worker profile first — then you can browse verified overseas jobs and apply.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-xl gap-2" asChild>
                <Link to={onboardingPath}>
                  <User className="h-4 w-4" />
                  Complete profile
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl gap-2" asChild>
                <Link to={isPhase1Home(onboardingPath) ? '/home' : '/worker/dashboard'}>
                  <Briefcase className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function isPhase1Home(onboardingPath: string): boolean {
  return onboardingPath === '/onboarding';
}
