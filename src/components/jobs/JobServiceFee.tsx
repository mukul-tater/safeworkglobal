import { Receipt } from 'lucide-react';
import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import { cn } from '@/lib/utils';

export function formatJobServiceFee(): string {
  return `₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')}/-`;
}

interface Props {
  className?: string;
  amountClassName?: string;
  hideIcon?: boolean;
}

/** Same ₹35,400 service fee on every public job listing. */
export default function JobServiceFee({ className, amountClassName, hideIcon = false }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {!hideIcon && <Receipt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span>Service fee</span>
      <span className={cn('font-semibold tabular-nums text-foreground', amountClassName)}>
        {formatJobServiceFee()}
      </span>
    </span>
  );
}
