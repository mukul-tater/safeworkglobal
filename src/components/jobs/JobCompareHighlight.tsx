import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HindiText from '@/components/indian-workforce/HindiText';
import { jobCompareBenefitRows } from '@/lib/jobBenefits';
import { formatServiceChargeInr } from '@/lib/jobServiceCharge';
import { UAE_LISTED_JOB_LABELS, type UaeListedJob } from '@/lib/uaeListedJobs';
import { formatINRAmount } from '@/lib/utils';
import type { JobListItem } from '@/components/jobs/JobResultCard';

const COLUMNS = ['Job', 'Country', 'Salary', 'Contract', 'SC', 'Accom'] as const;

function salaryCeiling(job: JobListItem): number | null {
  return job.salaryMax ?? job.salaryMin;
}

function formatInrSalary(job: JobListItem): string {
  const min = job.salaryMin;
  const max = job.salaryMax;
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) {
    return `${formatINRAmount(min)} – ${formatINRAmount(max)}`;
  }
  return formatINRAmount((min ?? max) as number);
}

interface Props {
  trade: string;
  jobs: JobListItem[];
  onClear: () => void;
}

/** Highlighted comparison. Rows are only the jobs the worker ticked. */
export default function JobCompareHighlight({ trade, jobs, onClear }: Props) {
  const label = trade in UAE_LISTED_JOB_LABELS ? UAE_LISTED_JOB_LABELS[trade as UaeListedJob] : null;
  const ceilings = jobs.map(salaryCeiling).filter((value): value is number => value != null);
  const higherSalary = ceilings.length >= 2 ? Math.max(...ceilings) : null;
  const salariesDiffer = higherSalary != null && ceilings.some((value) => value < higherSalary);

  return (
    <section className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Compare countries</p>
        <h2 className="mt-1 text-lg font-semibold">
          {label ? (
            <>
              {label.en}
              <span className="font-medium text-muted-foreground"> / </span>
              <HindiText className="inline font-medium text-muted-foreground">{label.hi}</HindiText>
            </>
          ) : (
            trade
          )}
        </h2>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {jobs.length === 0
              ? 'Tick Compare on two jobs in different countries.'
              : jobs.length === 1
                ? 'Tick one more job in another country. Salary is in rupees per month.'
                : 'Salary is shown in rupees per month.'}
          </p>
          {jobs.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {jobs.length === 0 ? null : (
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
        <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className="border-b px-3 py-2 text-left font-semibold text-muted-foreground">
                  {column}
                </th>
              ))}
              <th className="border-b px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const benefits = jobCompareBenefitRows(job.benefits);
              const higher = salariesDiffer && salaryCeiling(job) === higherSalary;
              return (
                <tr key={job.id}>
                  <td className="border-b px-3 py-3 font-semibold">{job.title}</td>
                  <td className="border-b px-3 py-3">{job.country}</td>
                  <td className="border-b px-3 py-3">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-primary">{formatInrSalary(job)}</span>
                      {higher && (
                        <Badge className="border-success/20 bg-success/10 font-normal text-success">Higher</Badge>
                      )}
                    </span>
                  </td>
                  <td className="border-b px-3 py-3">{benefits.contract}</td>
                  <td className="border-b px-3 py-3">{formatServiceChargeInr(job.serviceCharge)}</td>
                  <td className="border-b px-3 py-3">{benefits.stay}</td>
                  <td className="border-b px-3 py-3">
                    <Button size="sm" asChild>
                      <Link to={`/jobs/${job.slug}`}>View job</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
