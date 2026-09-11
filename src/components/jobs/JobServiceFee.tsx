import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import { cn } from '@/lib/utils';

export function formatJobServiceFee(): string {
  return `₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')}/-`;
}

interface Props {
  className?: string;
}

/** Highlighted SafeWork service fee shown on every public job. */
export default function JobServiceFee({ className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-amber-400/70 bg-amber-400 px-2.5 py-1 text-xs font-bold tracking-wide text-amber-950 shadow-sm',
        className,
      )}
    >
      SafeWork service fee {formatJobServiceFee()}
    </span>
  );
}
