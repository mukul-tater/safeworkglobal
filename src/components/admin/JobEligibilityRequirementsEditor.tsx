import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { JobEligibilityRequirements } from '@/lib/jobEligibilityRequirements';

export default function JobEligibilityRequirementsEditor({
  value,
  onChange,
}: {
  value: JobEligibilityRequirements;
  onChange: (value: JobEligibilityRequirements) => void;
}) {
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">Journey eligibility requirements</h3>
        <p className="text-sm text-muted-foreground">These checks appear after the worker’s pre-placement declaration and before the rest of the journey.</p>
      </div>
      <div className="max-w-xs space-y-2">
        <Label htmlFor="minimum-height-inches">Minimum height (feet and inches)</Label>
        <Input
          id="minimum-height-inches"
          type="number"
          min="1"
          step="1"
          placeholder="For example, 68 for 5′8″"
          value={value.minimum_height_inches ?? ''}
          onChange={(event) => {
            const height = Number(event.target.value);
            onChange({ ...value, minimum_height_inches: height > 0 ? height : null });
          }}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={value.driving_license === true}
          onCheckedChange={(checked) => onChange({ ...value, driving_license: checked === true })}
        />
        Require driving licence issue date and photo
      </label>
    </section>
  );
}
