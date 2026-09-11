import { getJobSalaryDisplay } from '@/lib/jobSalaryUtils';
import { getPublicJobSalary } from '@/lib/uaeListedJobs';
import { cn } from '@/lib/utils';

interface JobSalaryTextProps {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string;
  title?: string;
  description?: string;
  emptyLabel?: string;
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
  primaryClassName,
  inrClassName,
  className,
}: JobSalaryTextProps) {
  const listed = title ? getPublicJobSalary(title, description) : null;
  const { primary, inrLine } = getJobSalaryDisplay(
    listed?.salary_min ?? min,
    listed?.salary_max ?? max,
    listed ? 'INR' : currency,
    emptyLabel,
  );

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={primaryClassName}>{primary}</span>
      {inrLine && (
        <span className={cn('text-xs text-muted-foreground', inrClassName)}>{inrLine}</span>
      )}
    </span>
  );
}
