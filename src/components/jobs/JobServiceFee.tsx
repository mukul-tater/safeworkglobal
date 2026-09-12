import type { MouseEvent } from 'react';
import { Info } from 'lucide-react';
import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function formatJobServiceFee(): string {
  return `₹${ASSESSMENT_FEE_INR.toLocaleString('en-IN')}/-`;
}

/** Shown on every public job. Payment is only after the video interview. */
export const SERVICE_FEE_WHEN_CHARGED =
  'Payable after you pass the video interview. Not before that.';

interface Props {
  className?: string;
  /** Show the “when charged” sentence next to the badge (apply box / job details). */
  showWhenCharged?: boolean;
}

/** SafeWork Global service fee, styled like the Visa sponsored badge. */
export default function JobServiceFee({ className, showWhenCharged = false }: Props) {
  const stopCardClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1 gap-y-1', className)} onClick={stopCardClick}>
      <Badge
        variant="outline"
        className="gap-1 border-success/30 bg-success/10 font-normal text-success"
      >
        SafeWork Global service fee {formatJobServiceFee()}
      </Badge>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="When is the SafeWork Global service fee charged?"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-success hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={stopCardClick}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3 text-sm" onClick={stopCardClick}>
          {SERVICE_FEE_WHEN_CHARGED}
        </PopoverContent>
      </Popover>
      {showWhenCharged ? (
        <span className="basis-full text-xs text-muted-foreground">{SERVICE_FEE_WHEN_CHARGED}</span>
      ) : null}
    </span>
  );
}
