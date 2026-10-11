import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobExtraField } from "@/lib/jobExtraFields";
import { Loader2 } from "lucide-react";

export type JobExtraAnswerInput = {
  fieldId: string;
  text?: string;
  file?: File;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: JobExtraField[];
  submitting: boolean;
  onSubmit: (answers: JobExtraAnswerInput[]) => Promise<void>;
};

export default function JobExtraAnswersDialog({ open, onOpenChange, fields, submitting, onSubmit }: Props) {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTexts({});
    setFiles({});
    setError(null);
  }, [open]);

  const submit = async () => {
    const answers: JobExtraAnswerInput[] = [];
    for (const field of fields) {
      if (field.value_type === "text") {
        const text = (texts[field.id] ?? "").trim();
        if (!text) {
          setError(`Enter ${field.label}`);
          return;
        }
        answers.push({ fieldId: field.id, text });
      } else {
        const file = files[field.id];
        if (!file) {
          setError(`Upload a photo for ${field.label}`);
          return;
        }
        if (!file.type.startsWith("image/")) {
          setError(`${field.label} must be a photo`);
          return;
        }
        answers.push({ fieldId: field.id, file });
      }
    }
    setError(null);
    await onSubmit(answers);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Details needed for this job</DialogTitle>
          <DialogDescription>
            This job asks for a few extra details before you can apply.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`answer-${field.id}`}>
                {field.label} <span className="text-muted-foreground font-normal">({field.value_type === "photo" ? "photo" : "text"})</span>
              </Label>
              {field.value_type === "text" ? (
                <Textarea
                  id={`answer-${field.id}`}
                  rows={3}
                  maxLength={2000}
                  value={texts[field.id] ?? ""}
                  onChange={(event) => setTexts((current) => ({ ...current, [field.id]: event.target.value }))}
                />
              ) : (
                <Input
                  id={`answer-${field.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setFiles((current) => ({ ...current, [field.id]: file }));
                  }}
                />
              )}
            </div>
          ))}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
