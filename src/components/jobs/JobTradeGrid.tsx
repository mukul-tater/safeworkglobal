import { HardHat } from 'lucide-react';
import HindiText from '@/components/indian-workforce/HindiText';
import {
  UAE_LISTED_JOBS,
  UAE_LISTED_JOB_LABELS,
  isHiddenPublicJob,
  type UaeListedJob,
} from '@/lib/uaeListedJobs';
import { UAE_LISTED_JOB_CARD_VISUALS } from '@/components/jobs/listedJobCardVisuals';

interface Props {
  onSelect: (job: UaeListedJob) => void;
}

export default function JobTradeGrid({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose a job</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified openings by trade. More jobs will be added soon.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UAE_LISTED_JOBS.filter((job) => !isHiddenPublicJob(job)).map((job) => {
          const card = UAE_LISTED_JOB_CARD_VISUALS[job];
          const label = UAE_LISTED_JOB_LABELS[job];
          return (
            <button
              key={job}
              type="button"
              onClick={() => onSelect(job)}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="relative h-40 w-full overflow-hidden sm:h-48">
                <img
                  src={card.image}
                  alt={`${label.en} / ${label.hi}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ objectPosition: card.position ?? 'center' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
                    <HardHat className="h-3.5 w-3.5" />
                    Job
                  </p>
                  <p className="mt-1 font-heading text-lg font-semibold leading-snug sm:text-xl">
                    {label.en}
                    <span className="font-medium text-white/85"> / </span>
                    <HindiText className="inline font-medium">{label.hi}</HindiText>
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
