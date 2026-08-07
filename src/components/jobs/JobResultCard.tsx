import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, BriefcaseBusiness, Clock, Loader2, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import JobSalaryText from '@/components/JobSalaryText';
import { cn } from '@/lib/utils';

export interface JobListItem {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string;
  country: string;
  salaryDisplay: string | null;
  rawSalaryMin: number | null;
  rawSalaryMax: number | null;
  currency: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  category: string;
  experienceLevel: string;
  visaSponsorship: boolean;
  postedAt: Date;
  description: string;
  skills: string[];
}

function relativeTime(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function companyInitials(company: string): string {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

interface JobResultCardProps {
  job: JobListItem;
  saved?: boolean;
  savePending?: boolean;
  onToggleSave?: (job: JobListItem) => void;
}

export default function JobResultCard({ job, saved = false, savePending = false, onToggleSave }: JobResultCardProps) {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);
  const jobUrl = `/jobs/${job.slug}`;
  const showLogo = Boolean(job.companyLogoUrl) && !logoFailed;

  return (
    <article
      onClick={() => navigate(jobUrl)}
      className="group cursor-pointer rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/60 sm:h-12 sm:w-12">
          {showLogo ? (
            <img
              src={job.companyLogoUrl!}
              alt=""
              loading="lazy"
              onError={() => setLogoFailed(true)}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{companyInitials(job.company) || '—'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-snug transition-colors group-hover:text-primary sm:text-lg">
                {job.title}
              </h3>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company}</p>
            </div>

            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
                disabled={savePending}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(job);
                }}
                className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
              >
                {savePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark className={cn('h-4 w-4', saved && 'fill-primary text-primary')} />
                )}
              </Button>
            )}
          </div>

          {job.visaSponsorship && (
            <Badge variant="outline" className="mt-2 gap-1 border-success/30 bg-success/10 font-normal text-success">
              <ShieldCheck className="h-3 w-3" />
              Visa sponsored
            </Badge>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <dd className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.location}</span>
            </dd>
            <dd className="flex items-center gap-1.5 font-medium text-foreground">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {job.salaryDisplay ?? (
                <JobSalaryText min={job.rawSalaryMin} max={job.rawSalaryMax} currency={job.currency} />
              )}
            </dd>
            <dd className="flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
              {job.type}
            </dd>
            <dd className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {relativeTime(job.postedAt)}
            </dd>
          </dl>

          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="font-normal text-muted-foreground">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                navigate(jobUrl);
              }}
            >
              View job
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
