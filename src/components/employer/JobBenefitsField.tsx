import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  STANDARD_JOB_BENEFITS,
  parseJobBenefits,
  serializeJobBenefits,
  type StandardJobBenefit,
} from '@/lib/jobBenefits';

interface JobBenefitsFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
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
        {STANDARD_JOB_BENEFITS.map((benefit) => {
          const id = `benefit-${benefit.toLowerCase()}`;
          return (
            <label
              key={benefit}
              htmlFor={id}
              className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
            >
              <Checkbox
                id={id}
                checked={selected.includes(benefit)}
                onCheckedChange={(checked) => toggleBenefit(benefit, checked === true)}
              />
              <span className="text-sm font-medium">{benefit}</span>
            </label>
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
          placeholder="e.g. Food allowance, annual leave ticket"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">Separate multiple extras with commas</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
