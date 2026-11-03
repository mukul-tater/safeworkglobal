import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Building2 } from "lucide-react";
import { newJobCustomField, type JobCustomField } from "@/lib/jobCustomFields";

type Props = {
  value: JobCustomField[];
  onChange: (next: JobCustomField[]) => void;
};

export default function JobCustomFieldsEditor({ value, onChange }: Props) {
  const updateField = (id: string, patch: Partial<JobCustomField>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeField = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const addField = (defaultLabel = "Company Name") => {
    onChange([...value, newJobCustomField(defaultLabel, "")]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Label className="text-base font-semibold flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            Company & Custom Details
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add one or more companies (a job can have multiple companies) and custom label-value fields shown on the job.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addField("Company Name")}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Company
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addField("")}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Custom Field
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No company or custom fields added yet. Click &quot;Add Company&quot; or &quot;Custom Field&quot; to add one.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {value.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 items-center bg-muted/30 p-2.5 rounded-lg border border-border/50"
            >
              <div>
                <Label htmlFor={`custom-label-${field.id}`} className="text-[11px] text-muted-foreground block mb-1">
                  Label {index + 1}
                </Label>
                <Input
                  id={`custom-label-${field.id}`}
                  value={field.label}
                  placeholder="e.g. Company Name"
                  className="h-9 text-sm"
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`custom-value-${field.id}`} className="text-[11px] text-muted-foreground block mb-1">
                  Value
                </Label>
                <Input
                  id={`custom-value-${field.id}`}
                  value={field.value}
                  placeholder="e.g. Al Habtoor Group LLC"
                  className="h-9 text-sm"
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                />
              </div>
              <div className="sm:self-end sm:mb-0.5 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove field"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
