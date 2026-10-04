import { formatJobSalaryAedAndInr, getJobSalaryDisplay } from '@/lib/jobSalaryUtils';
import { getPublicJobSalary } from '@/lib/uaeListedJobs';
import { cn } from '@/lib/utils';

interface JobSalaryTextProps {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string;
  title?: string;
  description?: string;
  emptyLabel?: string;
  /** Shown after a real range. Pass a translation on localized screens. */
  periodLabel?: string;
  primaryClassName?: string;
  inrClassName?: string;
  className?: string;
}

export default function JobSalaryText({
  min,
  max,
  currency = 'INR',
  title,
  description,
  emptyLabel,
  periodLabel = 'per month',
  primaryClassName,
  inrClassName,
  className,
}: JobSalaryTextProps) {
  const listed = title ? getPublicJobSalary(title, description) : null;
  if (listed?.salary_display) {
    const monthly = listed.salary_min != null || listed.salary_max != null;
    return (
      <span className={cn('inline-flex flex-col', className)}>
        <span className={primaryClassName}>
          {listed.salary_display}
          {monthly ? (
            <span className="font-normal text-muted-foreground"> {periodLabel}</span>
          ) : null}
        </span>
      </span>
    );
  }
  const dual = formatJobSalaryAedAndInr(min, max, currency);
  if (dual && (min != null || max != null)) {
    return (
      <span className={cn('inline-flex flex-col', className)}>
        <span className={primaryClassName}>
          {dual}
          <span className="font-normal text-muted-foreground"> {periodLabel}</span>
        </span>
      </span>
    );
  }
  const resolvedEmpty = emptyLabel ?? 'Salary on application';
  const { primary, inrLine } = getJobSalaryDisplay(
    min,
    max,
    currency,
    emptyLabel,
  );
  const showPeriod = primary !== resolvedEmpty;

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={primaryClassName}>
        {primary}
        {showPeriod ? (
          <span className="font-normal text-muted-foreground"> {periodLabel}</span>
        ) : null}
      </span>
      {inrLine && (
        <span className={cn('text-xs text-muted-foreground', inrClassName)}>{inrLine}</span>
      )}
    </span>
  );
}
