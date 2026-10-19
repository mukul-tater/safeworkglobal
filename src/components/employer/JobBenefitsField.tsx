import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  benefitsCatalogForTitle,
  getBenefitCatalog,
  jobBenefitInfo,
  parseJobBenefits,
  serializeJobBenefits,
} from '@/lib/jobBenefits';
import { useSiteContent } from '@/lib/siteContent';

interface JobBenefitsFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Which admin list the checkboxes come from. Defaults from the job title. */
  title?: string;
  catalog?: 'standard' | 'delivery';
}

function BenefitInfoButton({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

export default function JobBenefitsField({ value, onChange, error, title, catalog }: JobBenefitsFieldProps) {
  useSiteContent();
  const listKey = catalog ?? benefitsCatalogForTitle(title);
  const items = getBenefitCatalog()[listKey];
  const knownKey = items.map((item) => item.en).join('\n');
  const [selected, setSelected] = useState<string[]>([]);
  const [additional, setAdditional] = useState('');

  useEffect(() => {
    const parsed = parseJobBenefits(value, knownKey ? knownKey.split('\n') : []);
    setSelected(parsed.selected);
    setAdditional(parsed.additional);
  }, [value, knownKey]);

  const emitChange = (nextSelected: string[], nextAdditional: string) => {
    onChange(serializeJobBenefits({ selected: nextSelected, additional: nextAdditional }));
  };

  const toggleBenefit = (benefit: string, checked: boolean) => {
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
          Saved benefits are what workers see on this job page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, index) => {
          const id = `benefit-${listKey}-${index}`;
          const info = item.info || jobBenefitInfo(item.en);
          return (
            <div
              key={`${listKey}-${item.en}`}
              className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/40"
            >
              <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <Checkbox
                  id={id}
                  className="mt-0.5"
                  checked={selected.includes(item.en)}
                  onCheckedChange={(checked) => toggleBenefit(item.en, checked === true)}
                />
                <span className="min-w-0">
                  <span className="text-sm font-medium leading-snug">{item.en}</span>
                  {item.hi ? <span className="mt-0.5 block text-xs text-muted-foreground">{item.hi}</span> : null}
                </span>
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
