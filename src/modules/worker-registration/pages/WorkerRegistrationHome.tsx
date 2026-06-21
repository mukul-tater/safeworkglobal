import { Navigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  LogIn,
  UserPlus,
  Info,
} from 'lucide-react';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import RegistrationLayout from '../components/RegistrationLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import heroImage from '@/assets/hero-workers.jpg';

const FREE_ITEMS = [
  'Create account',
  'Browse overseas (GCC) jobs',
  'Apply to jobs',
] as const;

function WorkerStartInfoPanel() {
  return (
    <Card className="border-2 border-primary/30 shadow-md overflow-hidden h-full">
      <div className="bg-primary/10 px-4 py-3 flex items-center gap-2 border-b border-primary/20 sticky top-0 z-10">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <p className="font-bold text-base sm:text-lg text-foreground">
          Important — please read before signing up
        </p>
      </div>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex gap-3 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <GraduationCap className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-snug">
                Minimum 10th pass is required
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                You must have passed Class 10 (matric / 10th standard) to create an account and apply for overseas jobs.
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-2 font-medium">
                Kam se kam 10vi pass hona zaroori hai.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-green-500/40 bg-green-50 dark:bg-green-950/25 p-4">
          <div className="flex gap-3 items-start mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-snug">
                These are 100% FREE — ₹0
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Koi paisa nahi — account, job dekhna, apply karna muft hai.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {FREE_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <span className="flex-1">{item}</span>
                <span className="text-xs font-bold text-green-700 dark:text-green-400">FREE</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border-2 border-border bg-muted/40 p-4">
          <div className="flex gap-3 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground leading-snug">
                Fee only after you are selected
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                No payment to register, browse, or apply. One-time fee only when:
              </p>
              <ol className="mt-2 space-y-1.5 text-sm sm:text-base font-medium list-decimal list-inside">
                <li>Employer selects you</li>
                <li>You clear the interview</li>
              </ol>
              <p className="mt-3 text-2xl font-bold text-primary tabular-nums">
                ₹35,400
                <span className="text-sm font-normal text-muted-foreground ml-2">one-time</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Tabhi fee jab select ho kar interview pass ho. Pehle koi charge nahi.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkerStartActionPanel() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative h-36 sm:h-44 rounded-xl overflow-hidden shrink-0">
        <img src={heroImage} alt="Skilled workers" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90 mb-1">
            GCC overseas jobs
          </p>
          <p className="text-sm font-medium">
            Welder · Electrician · Mason · Driver · HVAC & more
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-cyan-500" />
        <CardContent className="p-0">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-5 sm:p-6 flex flex-col">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold font-heading">New worker?</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">
                Free account — 10th pass required. Create your profile and apply to GCC jobs.
              </p>
              <Button size="lg" className="mt-5 w-full h-12 text-base font-medium" asChild>
                <Link to="/register">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                10th pass required · No fee to sign up
              </p>
            </div>

            <div className="p-5 sm:p-6 flex flex-col bg-muted/20 sm:bg-transparent">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold font-heading">Already registered?</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed flex-1">
                Sign in with mobile, email, or Google.
              </p>
              <Button variant="outline" size="lg" className="mt-5 w-full h-12 text-base font-medium" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default function WorkerRegistrationHome() {
  const { isAuthenticated, loading } = useWorkerAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <RegistrationLayout
      maxWidth="6xl"
      title="Find overseas jobs"
      subtitle="GCC jobs for skilled Indian workers — rules on the left, get started on the right."
      footer={
        <p className="text-center pt-4 border-t border-border text-sm text-muted-foreground">
          Questions? Visit an E-Mitra center or{' '}
          <Link to="/contact" className="font-medium text-primary hover:underline">
            contact support
          </Link>
          .{' '}
          <Link to="/jobs" className="font-medium text-primary hover:underline">
            Browse open jobs
          </Link>
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
        <div className="lg:sticky lg:top-20">
          <WorkerStartInfoPanel />
        </div>
        <div>
          <WorkerStartActionPanel />
        </div>
      </div>
    </RegistrationLayout>
  );
}
