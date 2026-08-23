import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JobResultCard, { type JobListItem } from '@/components/jobs/JobResultCard';
import { supabase } from '@/integrations/supabase/client';
import { convertSalaryToINR } from '@/lib/jobSalaryUtils';
import { inferWorkerSkillFromJob } from '@/lib/inferWorkerSkillFromJob';
import { JOB_CATEGORIES } from '@/lib/constants';
import {
  applyToJobForJourney,
  completeFindJobsStep,
  listAppliedJobIds,
  listFavouriteJobIds,
  skipJobStepsToQuiz,
  toggleFavouriteJob,
} from '@/modules/worker-verification/services/jobJourneyService';
import type { WorkerVerification } from '@/modules/worker-verification/types';

const KNOWN_CATEGORIES = JOB_CATEGORIES.filter((c) => c !== 'All Categories');

function inferCategory(title: string, description: string): string {
  const haystack = `${title} ${description}`.toLowerCase();
  return KNOWN_CATEGORIES.find((category) => haystack.includes(category.toLowerCase())) ?? 'Other';
}

async function fetchActiveJobs(): Promise<JobListItem[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(80);
  if (error) throw new Error(error.message);

  const rows = data || [];
  const jobIds = rows.map((job: { id: string }) => job.id);
  const employerIds = [
    ...new Set(rows.map((job: { employer_id: string }) => job.employer_id).filter(Boolean)),
  ];

  const companyMap = new Map<string, { name: string; logoUrl: string | null }>();
  const skillsByJob = new Map<string, string[]>();

  if (employerIds.length > 0) {
    const { data: companies } = await supabase
      .from('employer_company_info' as never)
      .select('user_id, company_name, company_logo_url')
      .in('user_id', employerIds);
    (companies || []).forEach(
      (company: { user_id: string; company_name: string; company_logo_url: string | null }) => {
        companyMap.set(company.user_id, {
          name: company.company_name,
          logoUrl: company.company_logo_url ?? null,
        });
      },
    );
  }

  if (jobIds.length > 0) {
    const { data: skillRows } = await supabase
      .from('job_skills')
      .select('job_id, skill_name')
      .in('job_id', jobIds);
    (skillRows || []).forEach((row: { job_id: string; skill_name: string }) => {
      const list = skillsByJob.get(row.job_id) ?? [];
      list.push(row.skill_name);
      skillsByJob.set(row.job_id, list);
    });
  }

  return rows.map((job: Record<string, unknown>) => {
    const company = companyMap.get(String(job.employer_id));
    const description = String(job.description ?? '');
    const skills = skillsByJob.get(String(job.id)) ?? [];
    const postedRaw = job.posted_at ?? job.created_at;
    return {
      id: String(job.id),
      slug: String(job.slug || job.id),
      title: String(job.title),
      company: company?.name || 'Verified employer',
      companyLogoUrl: company?.logoUrl ?? null,
      location: `${job.location}, ${job.country}`,
      country: String(job.country),
      salaryDisplay: (job.salary_display as string | null) ?? null,
      rawSalaryMin: (job.salary_min as number | null) ?? null,
      rawSalaryMax: (job.salary_max as number | null) ?? null,
      currency: String(job.currency || 'INR'),
      salaryMin: job.salary_min == null ? null : convertSalaryToINR(Number(job.salary_min), String(job.currency)),
      salaryMax: job.salary_max == null ? null : convertSalaryToINR(Number(job.salary_max), String(job.currency)),
      type: job.job_type === 'FULL_TIME' ? 'Full-time' : job.job_type === 'PART_TIME' ? 'Part-time' : 'Contract',
      category: inferCategory(String(job.title), description),
      experienceLevel: String(job.experience_level ?? ''),
      visaSponsorship: Boolean(job.visa_sponsorship),
      postedAt: postedRaw ? new Date(String(postedRaw)) : new Date(),
      description: description.length > 180 ? `${description.slice(0, 180).trimEnd()}…` : description,
      skills,
    };
  });
}

type Mode = 'find' | 'apply';

interface Props {
  workerUserId: string;
  mode: Mode;
  primarySkill?: string | null;
  onAdvanced: (next: WorkerVerification) => void;
}

export default function JourneyJobPicker({
  workerUserId,
  mode,
  primarySkill,
  onAdvanced,
}: Props) {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  const reloadMeta = useCallback(async () => {
    const [saved, applied] = await Promise.all([
      listFavouriteJobIds(workerUserId),
      listAppliedJobIds(workerUserId),
    ]);
    setSavedIds(saved);
    setAppliedIds(applied);
  }, [workerUserId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchActiveJobs();
        if (!cancelled) setJobs(list);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        await reloadMeta();
      } catch {
        // Favourites / applied metadata must not hide the job list.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadMeta]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      if (favouritesOnly && !savedIds.has(job.id)) return false;
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
    if (mode === 'apply' && !favouritesOnly) {
      return [...filtered].sort((a, b) => Number(savedIds.has(b.id)) - Number(savedIds.has(a.id)));
    }
    return filtered;
  }, [jobs, query, favouritesOnly, savedIds, mode]);

  const alreadyApplied = appliedIds.size > 0;
  const canSkipEmptyApply = mode === 'apply' && jobs.length === 0;
  const canContinueAfterApply = mode === 'apply' && alreadyApplied;

  const onToggleSave = async (job: JobListItem) => {
    setPendingSaveId(job.id);
    try {
      const nowSaved = await toggleFavouriteJob({ jobId: job.id, workerUserId });
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (nowSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
      toast.success(nowSaved ? 'Added to favourite jobs' : 'Removed from favourites');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update favourites');
    } finally {
      setPendingSaveId(null);
    }
  };

  const onApply = async (job: JobListItem) => {
    setApplyingId(job.id);
    try {
      const { verification } = await applyToJobForJourney({
        jobId: job.id,
        workerUserId,
        title: job.title,
        description: job.description,
        skills: job.skills,
        fallbackSkill: primarySkill,
      });
      setAppliedIds((prev) => new Set(prev).add(job.id));
      const skill = inferWorkerSkillFromJob(job.title, job.description, job.skills);
      toast.success(
        skill !== 'Other'
          ? `Applied. Test 1 will check ${skill} work.`
          : 'Application submitted. Continue to Test 1.',
      );
      if (verification) onAdvanced(verification);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not apply');
    } finally {
      setApplyingId(null);
    }
  };

  const onContinueFind = async () => {
    setContinuing(true);
    try {
      const next =
        jobs.length === 0
          ? await skipJobStepsToQuiz(workerUserId)
          : await completeFindJobsStep(workerUserId);
      onAdvanced(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setContinuing(false);
    }
  };

  const onContinueToTest1 = async () => {
    setContinuing(true);
    try {
      const next = await skipJobStepsToQuiz(workerUserId);
      onAdvanced(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setContinuing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading jobs…
      </div>
    );
  }

  const emptyMessage = (() => {
    if (jobs.length === 0) {
      return mode === 'apply'
        ? 'No live job postings yet. Continue to Test 1 — it will use your primary skill from Essentials.'
        : 'No live job postings yet. You can continue; Test 1 will use your primary skill from Essentials.';
    }
    if (favouritesOnly) {
      return 'No favourite jobs yet. Turn off Favourites to see all live jobs, or tap the bookmark on a job to save it.';
    }
    if (query.trim()) {
      return 'No matching jobs right now. Try a different search.';
    }
    return 'No matching jobs right now.';
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, employer, or skill"
            className="h-11 pl-10"
          />
        </div>
        <Button
          type="button"
          variant={favouritesOnly ? 'default' : 'outline'}
          className="h-11 shrink-0"
          onClick={() => setFavouritesOnly((v) => !v)}
        >
          <Bookmark className="mr-1.5 h-4 w-4" />
          Favourites{savedIds.size ? ` (${savedIds.size})` : ''}
        </Button>
      </div>

      {jobs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {favouritesOnly
            ? `${visible.length} favourite ${visible.length === 1 ? 'job' : 'jobs'}`
            : `${visible.length} live ${visible.length === 1 ? 'job' : 'jobs'}`}
          {query.trim() ? ' matching your search' : ''}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {favouritesOnly && jobs.length > 0 && (
            <Button type="button" variant="outline" onClick={() => setFavouritesOnly(false)}>
              Show all jobs
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((job) => {
            const applied = appliedIds.has(job.id);
            return (
              <div key={job.id} className="relative">
                <JobResultCard
                  job={job}
                  saved={savedIds.has(job.id)}
                  savePending={pendingSaveId === job.id}
                  onToggleSave={onToggleSave}
                  onOpen={mode === 'apply' ? onApply : undefined}
                  actionLabel={
                    mode === 'apply'
                      ? applyingId === job.id
                        ? 'Applying…'
                        : applied
                          ? 'Applied'
                          : 'Apply'
                      : 'View job'
                  }
                />
                {mode === 'apply' && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={applied || applyingId === job.id}
                      onClick={() => void onApply(job)}
                    >
                      {applyingId === job.id && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                      {applied ? 'Applied' : 'Apply to this job'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === 'find' && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => void onContinueFind()} disabled={continuing}>
            {continuing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {jobs.length === 0 ? 'Continue to Test 1' : 'Continue to apply'}
          </Button>
        </div>
      )}

      {(canSkipEmptyApply || canContinueAfterApply) && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => void onContinueToTest1()} disabled={continuing}>
            {continuing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Continue to Test 1
          </Button>
        </div>
      )}
    </div>
  );
}
