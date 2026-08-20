import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  STANDARD_JOB_BENEFITS,
  jobBenefitInfo,
  parseJobBenefits,
  serializeJobBenefits,
  type StandardJobBenefit,
} from '@/lib/jobBenefits';

interface JobBenefitsFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function BenefitInfoButton({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="More information"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 text-sm leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}

export default function JobBenefitsField({ value, onChange, error }: JobBenefitsFieldProps) {
  const [selected, setSelected] = useState<StandardJobBenefit[]>([]);
  const [additional, setAdditional] = useState('');

  useEffect(() => {
    const parsed = parseJobBenefits(value);
    setSelected(parsed.selected);
    setAdditional(parsed.additional);
  }, [value]);

  const emitChange = (nextSelected: StandardJobBenefit[], nextAdditional: string) => {
    onChange(serializeJobBenefits({ selected: nextSelected, additional: nextAdditional }));
  };

  const toggleBenefit = (benefit: StandardJobBenefit, checked: boolean) => {
    const nextSelected = checked
      ? [...selected, benefit]
      : selected.filter((b) => b !== benefit);
    setSelected(nextSelected);
    emitChange(nextSelected, additional);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Benefits</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Select what you provide. Workers see these on the job listing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STANDARD_JOB_BENEFITS.map((benefit, index) => {
          const id = `benefit-${index}`;
          const info = jobBenefitInfo(benefit);
          return (
            <div
              key={benefit}
              className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/40"
            >
              <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <Checkbox
                  id={id}
                  className="mt-0.5"
                  checked={selected.includes(benefit)}
                  onCheckedChange={(checked) => toggleBenefit(benefit, checked === true)}
                />
                <span className="text-sm font-medium leading-snug">{benefit}</span>
              </label>
              {info && <BenefitInfoButton text={info} />}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="benefits-additional">Add more</Label>
        <Input
          id="benefits-additional"
          value={additional}
          onChange={(e) => {
            const next = e.target.value;
            setAdditional(next);
            emitChange(selected, next);
          }}
          placeholder="e.g. Annual leave ticket, bonus"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">Separate multiple extras with commas</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
