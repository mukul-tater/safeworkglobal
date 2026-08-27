import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JobResultCard, { type JobListItem } from '@/components/jobs/JobResultCard';
import JobCountryGrid from '@/components/jobs/JobCountryGrid';
import JobCategoryScroller, { ALL_JOBS_CATEGORY } from '@/components/jobs/JobCategoryScroller';
import { supabase } from '@/integrations/supabase/client';
import { convertSalaryToINR } from '@/lib/jobSalaryUtils';
import { inferWorkerSkillFromJob } from '@/lib/inferWorkerSkillFromJob';
import { JOB_CATEGORIES } from '@/lib/constants';
import ChangeJobDialog from '@/modules/worker-verification/components/journey/ChangeJobDialog';
import {
  clearPendingJourneyJob,
  getPendingJourneyJob,
} from '@/modules/worker-verification/lib/pendingJourneyJob';
import {
  applyToJobForJourney,
  changeJourneyJob,
  listAppliedJobIds,
  listFavouriteJobIds,
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

interface Props {
  workerUserId: string;
  primarySkill?: string | null;
  journeyJobId?: string | null;
  canChangeJob?: boolean;
  onAdvanced: (next: WorkerVerification) => void;
}

export default function JourneyJobPicker({
  workerUserId,
  primarySkill,
  journeyJobId,
  canChangeJob = true,
  onAdvanced,
}: Props) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [category, setCategory] = useState(ALL_JOBS_CATEGORY);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [pickingReplacement, setPickingReplacement] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<JobListItem | null>(null);
  const autoApplyDone = useRef(false);

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

  useEffect(() => {
    if (!journeyJobId) {
      setCurrentTitle(null);
      return;
    }
    const listed = jobs.find((job) => job.id === journeyJobId);
    if (listed) {
      setCurrentTitle(listed.title);
      return;
    }
    let cancelled = false;
    void supabase
      .from('jobs')
      .select('title')
      .eq('id', journeyJobId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCurrentTitle((data as { title?: string } | null)?.title ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyJobId, jobs]);

  const locked = Boolean(journeyJobId) && !pickingReplacement;

  const countryJobs = useMemo(
    () => (country ? jobs.filter((job) => job.country.toLowerCase() === country.toLowerCase()) : jobs),
    [jobs, country],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    countryJobs.forEach((job) => {
      if (job.category && job.category !== 'Other') set.add(job.category);
    });
    return [...set].sort();
  }, [countryJobs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countryJobs.filter((job) => {
      if (favouritesOnly && !savedIds.has(job.id)) return false;
      if (category !== ALL_JOBS_CATEGORY && job.category !== category) return false;
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [countryJobs, query, favouritesOnly, savedIds, category]);

  const applyJob = async (job: JobListItem, change: boolean) => {
    setApplyingId(job.id);
    try {
      const fn = change ? changeJourneyJob : applyToJobForJourney;
      const { verification } = await fn({
        jobId: job.id,
        workerUserId,
        title: job.title,
        description: job.description,
        skills: job.skills,
        fallbackSkill: primarySkill,
      });
      setAppliedIds((prev) => new Set(prev).add(job.id));
      clearPendingJourneyJob();
      setPickingReplacement(false);
      const skill = inferWorkerSkillFromJob(job.title, job.description, job.skills);
      toast.success(
        skill !== 'Other'
          ? `Applied. Test 1 will check ${skill} work.`
          : 'Application submitted. Continue to Test 1.',
      );
      if (verification) onAdvanced(verification);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not apply';
      if (message === 'CHANGE_JOB_REQUIRED') {
        setPendingTarget(job);
        setChangeOpen(true);
      } else {
        toast.error(message);
      }
    } finally {
      setApplyingId(null);
    }
  };

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

  const requestApply = (job: JobListItem) => {
    if (journeyJobId && job.id === journeyJobId) {
      toast.info('This is already your current job.');
      return;
    }
    if (journeyJobId && job.id !== journeyJobId && !pickingReplacement) {
      setPendingTarget(job);
      setChangeOpen(true);
      return;
    }
    void applyJob(job, Boolean(journeyJobId && job.id !== journeyJobId));
  };

  useEffect(() => {
    if (loading || journeyJobId || autoApplyDone.current) return;
    const pending = getPendingJourneyJob();
    if (!pending) return;
    autoApplyDone.current = true;
    const match = jobs.find((job) => job.id === pending.jobId || job.slug === pending.slug);
    if (match) {
      void applyJob(match, false);
      return;
    }
    void (async () => {
      try {
        const { verification } = await applyToJobForJourney({
          jobId: pending.jobId,
          workerUserId,
          title: pending.title,
          fallbackSkill: primarySkill,
        });
        clearPendingJourneyJob();
        toast.success('Application submitted. Continue to Test 1.');
        if (verification) onAdvanced(verification);
      } catch (err) {
        autoApplyDone.current = false;
        toast.error(err instanceof Error ? err.message : 'Could not apply to the job you selected');
      }
    })();
  }, [loading, journeyJobId, jobs, workerUserId, primarySkill, onAdvanced]);

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
      return 'No live job postings yet. New UAE openings will appear here.';
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
      {journeyJobId && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Current job</p>
            <p className="text-sm text-muted-foreground">{currentTitle || 'Applied job is linked to your journey.'}</p>
          </div>
          {canChangeJob && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingTarget(null);
                setChangeOpen(true);
              }}
            >
              Change job
            </Button>
          )}
        </div>
      )}

      {pickingReplacement && (
        <p className="text-sm text-muted-foreground">
          Pick a new job and tap Apply. Test 1, skill proof, interview, and trade test will restart for that job.
        </p>
      )}

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

      {!country ? (
        <JobCountryGrid
          onSelect={(next) => {
            setCountry(next);
            setCategory(ALL_JOBS_CATEGORY);
          }}
        />
      ) : (
        <>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setCountry(null);
              setCategory(ALL_JOBS_CATEGORY);
            }}
          >
            ← All countries
          </button>
          <JobCategoryScroller categories={categories} selected={category} onSelect={setCategory} />

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
                const isCurrent = job.id === journeyJobId;
                const applying = applyingId === job.id;
                return (
                  <JobResultCard
                    key={job.id}
                    job={job}
                    saved={savedIds.has(job.id)}
                    savePending={pendingSaveId === job.id}
                    onToggleSave={onToggleSave}
                    onOpen={() => navigate(`/jobs/${job.slug}?from=journey`)}
                    onAction={() => requestApply(job)}
                    actionLabel={
                      applying ? 'Applying…' : isCurrent ? 'Current job' : appliedIds.has(job.id) ? 'Switch to this job' : 'Apply'
                    }
                    actionDisabled={applying || isCurrent}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <ChangeJobDialog
        open={changeOpen}
        currentJobTitle={currentTitle}
        nextJobTitle={pendingTarget?.title}
        onOpenChange={setChangeOpen}
        onConfirm={() => {
          if (!canChangeJob) {
            toast.error('This job cannot be changed after GCC ready');
            return;
          }
          if (pendingTarget) {
            void applyJob(pendingTarget, true);
            setPendingTarget(null);
            return;
          }
          setPickingReplacement(true);
        }}
      />
    </div>
  );
}
