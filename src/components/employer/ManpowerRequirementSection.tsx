import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import TradeSearchSelect from "@/components/employer/TradeSearchSelect";
import {
  EXPERIENCE_RANGES,
  GENDER_PREFERENCES,
  PROJECT_DURATIONS,
  skillsForTrade,
} from "@/lib/employerTradeSkills";
import type { ManpowerRequirementForm } from "@/lib/validations/employerRegistration";
import { Pencil, Plus, Trash2 } from "lucide-react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function displayTrade(item: ManpowerRequirementForm) {
  return item.trade === "Other" ? item.customTrade || "Other" : item.trade || "New requirement";
}

interface Props {
  requirements: ManpowerRequirementForm[];
  editingId: string | null;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (next: ManpowerRequirementForm[]) => void;
  onEditingIdChange: (id: string | null) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function ManpowerRequirementSection({
  requirements,
  editingId,
  errors,
  disabled,
  onChange,
  onEditingIdChange,
  onAdd,
  onRemove,
}: Props) {
  const update = (id: string, patch: Partial<ManpowerRequirementForm>) => {
    onChange(requirements.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const fieldError = (id: string, key: string) =>
    errors[`${id}.${key}`] || errors[`requirements.${requirements.findIndex((r) => r.id === id)}.${key}`];

  return (
    <div className="space-y-4">
      {requirements.map((item, index) => {
        const isEditing = editingId === item.id;
        const tradeSkills = skillsForTrade(item.trade);

        if (!isEditing) {
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Requirement #{index + 1}
                </p>
                <p className="truncate font-heading text-sm font-semibold">{displayTrade(item)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.numberOfWorkers || 0} {Number(item.numberOfWorkers) === 1 ? "Worker" : "Workers"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onEditingIdChange(item.id)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div key={item.id} className="space-y-3.5 rounded-xl border border-primary/20 bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Requirement #{index + 1}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Job Role / Trade *</Label>
                <TradeSearchSelect
                  value={item.trade}
                  disabled={disabled}
                  onChange={(trade) => update(item.id, { trade, technicalSkills: [], customTrade: trade === "Other" ? item.customTrade : "" })}
                />
                <FieldError message={fieldError(item.id, "trade")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`workers-${item.id}`}>Number of Workers Required *</Label>
                <Input
                  id={`workers-${item.id}`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="h-11"
                  value={item.numberOfWorkers}
                  disabled={disabled}
                  onChange={(e) => update(item.id, { numberOfWorkers: e.target.value })}
                  placeholder="e.g. 20"
                />
                <FieldError message={fieldError(item.id, "numberOfWorkers")} />
              </div>
            </div>

            {item.trade === "Other" && (
              <div className="space-y-1.5">
                <Label htmlFor={`custom-trade-${item.id}`}>Specify trade *</Label>
                <Input
                  id={`custom-trade-${item.id}`}
                  className="h-11"
                  value={item.customTrade || ""}
                  disabled={disabled}
                  onChange={(e) => update(item.id, { customTrade: e.target.value })}
                  placeholder="e.g. Tower Crane Operator"
                />
                <FieldError message={fieldError(item.id, "customTrade")} />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Minimum Experience Required</Label>
                <Select
                  value={item.experience || undefined}
                  onValueChange={(v) => update(item.id, { experience: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`location-${item.id}`}>Work Location *</Label>
                <Input
                  id={`location-${item.id}`}
                  className="h-11"
                  value={item.location}
                  disabled={disabled}
                  onChange={(e) => update(item.id, { location: e.target.value })}
                />
                <FieldError message={fieldError(item.id, "location")} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`project-${item.id}`}>Project Name</Label>
                <Input
                  id={`project-${item.id}`}
                  className="h-11"
                  value={item.projectName || ""}
                  disabled={disabled}
                  onChange={(e) => update(item.id, { projectName: e.target.value })}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`join-${item.id}`}>Required Joining Date</Label>
                <Input
                  id={`join-${item.id}`}
                  type="date"
                  className="h-11"
                  value={item.joiningDate || ""}
                  disabled={disabled}
                  onChange={(e) => update(item.id, { joiningDate: e.target.value })}
                />
                <FieldError message={fieldError(item.id, "joiningDate")} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Project Duration</Label>
                <Select
                  value={item.projectDuration || undefined}
                  onValueChange={(v) => update(item.id, { projectDuration: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_DURATIONS.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gender Preference</Label>
                <RadioGroup
                  value={item.gender}
                  onValueChange={(v) => update(item.id, { gender: v })}
                  className="flex flex-wrap gap-4 pt-2"
                  disabled={disabled}
                >
                  {GENDER_PREFERENCES.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={`gender-${item.id}-${option}`} />
                      <Label htmlFor={`gender-${item.id}-${option}`} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {tradeSkills.length > 0 && (
              <div className="space-y-2">
                <Label>Required Technical Skills</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {tradeSkills.map((skill) => {
                    const checked = item.technicalSkills.includes(skill);
                    return (
                      <label
                        key={skill}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(next) => {
                            const skills = next
                              ? [...item.technicalSkills, skill]
                              : item.technicalSkills.filter((s) => s !== skill);
                            update(item.id, { technicalSkills: skills });
                          }}
                        />
                        {skill}
                      </label>
                    );
                  })}
                </div>
                <FieldError message={fieldError(item.id, "technicalSkills")} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`notes-${item.id}`}>Job Description / Additional Requirements</Label>
              <Textarea
                id={`notes-${item.id}`}
                rows={3}
                value={item.additionalRequirements || ""}
                disabled={disabled}
                onChange={(e) => update(item.id, { additionalRequirements: e.target.value })}
                placeholder="Site conditions, certifications, shift timing…"
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => onEditingIdChange(null)}>
                Done
              </Button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" className="h-11 w-full" disabled={disabled} onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Another Requirement
      </Button>

      <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Total Workers Required: </span>
        <Badge variant="secondary" className="font-semibold">
          {requirements.reduce((sum, item) => sum + (Number(item.numberOfWorkers) || 0), 0)}
        </Badge>
      </div>
      <FieldError message={errors.requirements || errors._form} />
    </div>
  );
}
