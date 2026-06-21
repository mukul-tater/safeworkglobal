import { getJobSalaryDisplay } from '@/lib/jobSalaryUtils';
import { cn } from '@/lib/utils';

interface JobSalaryTextProps {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string;
  emptyLabel?: string;
  primaryClassName?: string;
  inrClassName?: string;
  className?: string;
}

export default function JobSalaryText({
  min,
  max,
  currency = 'INR',
  emptyLabel,
  primaryClassName,
  inrClassName,
  className,
}: JobSalaryTextProps) {
  const { primary, inrLine } = getJobSalaryDisplay(min, max, currency, emptyLabel);

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={primaryClassName}>{primary}</span>
      {inrLine && (
        <span className={cn('text-xs text-muted-foreground', inrClassName)}>{inrLine}</span>
      )}
    </span>
  );
}
