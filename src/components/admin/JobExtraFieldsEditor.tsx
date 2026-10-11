import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newJobExtraFieldDraft, type JobExtraFieldDraft, type JobExtraValueType } from "@/lib/jobExtraFields";
import { Plus, X } from "lucide-react";

type Props = {
  value: JobExtraFieldDraft[];
  onChange: (next: JobExtraFieldDraft[]) => void;
};

export default function JobExtraFieldsEditor({ value, onChange }: Props) {
  const update = (key: string, patch: Partial<JobExtraFieldDraft>) => {
    onChange(value.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Extra details from the worker</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add as many as this job needs. Each one is a photo or a short text answer, and the worker must provide all of them to apply.
        </p>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">No extra requirements. Apply stays as it is today.</p>
      ) : (
        <div className="space-y-3">
          {value.map((row, index) => (
            <div key={row.key} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-2 items-end">
              <div>
                <Label htmlFor={`extra-label-${row.key}`} className="text-xs text-muted-foreground">
                  Label {index + 1}
                </Label>
                <Input
                  id={`extra-label-${row.key}`}
                  value={row.label}
                  maxLength={120}
                  placeholder="Driving license"
                  onChange={(event) => update(row.key, { label: event.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={row.valueType}
                  onValueChange={(next) => update(row.key, { valueType: next as JobExtraValueType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${row.label || "requirement"}`}
                onClick={() => onChange(value.filter((item) => item.key !== row.key))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, newJobExtraFieldDraft()])}>
        <Plus className="h-4 w-4 mr-1" />
        Add requirement
      </Button>
    </div>
  );
}
