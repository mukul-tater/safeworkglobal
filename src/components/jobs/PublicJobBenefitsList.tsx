import { CheckCircle2 } from 'lucide-react';
import HindiText from '@/components/indian-workforce/HindiText';
import { listDisplayedJobBenefits } from '@/lib/uaeListedJobs';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  country?: string | null;
  benefits?: string | null;
  className?: string;
  itemClassName?: string;
  showIcon?: boolean;
}

export default function PublicJobBenefitsList({
  title,
  description = '',
  country,
  benefits,
  className,
  itemClassName,
  showIcon = false,
}: Props) {
  const lines = listDisplayedJobBenefits(title, description, country, benefits);

  return (
    <ul className={cn('space-y-2', className)}>
      {lines.map((benefit) => (
        <li key={benefit.en} className={itemClassName}>
          {showIcon ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
          <div className="min-w-0">
            <span>
              {benefit.en}
              {benefit.info ? ` — ${benefit.info}` : ''}
            </span>
            {benefit.hi ? (
              <HindiText className="mt-0.5 text-[0.92em] leading-snug">
                {benefit.hi}
                {benefit.infoHi ? ` — ${benefit.infoHi}` : ''}
              </HindiText>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
