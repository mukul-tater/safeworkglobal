import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  listJobApplicationAnswers,
  listJobExtraFields,
  signedJobExtraPhotoUrl,
  type JobApplicationAnswer,
  type JobExtraField,
} from "@/lib/jobExtraFields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  jobId: string | null;
  workerName: string;
  jobTitle: string;
};

export default function JobApplicationAnswersDialog({
  open,
  onOpenChange,
  applicationId,
  jobId,
  workerName,
  jobTitle,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<JobExtraField[]>([]);
  const [answers, setAnswers] = useState<JobApplicationAnswer[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !applicationId || !jobId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFields([]);
    setAnswers([]);
    setPhotoUrls({});

    void (async () => {
      try {
        const [fieldRows, answerRows] = await Promise.all([
          listJobExtraFields(jobId),
          listJobApplicationAnswers(applicationId),
        ]);
        if (cancelled) return;
        setFields(fieldRows);
        setAnswers(answerRows);
        const urls: Record<string, string> = {};
        await Promise.all(
          answerRows.map(async (answer) => {
            if (!answer.file_path) return;
            const url = await signedJobExtraPhotoUrl(answer.file_path);
            if (url) urls[answer.field_id] = url;
          }),
        );
        if (!cancelled) setPhotoUrls(urls);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load requirements");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, applicationId, jobId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extra details</DialogTitle>
          <DialogDescription>
            {workerName} · {jobTitle}
          </DialogDescription>
        </DialogHeader>
        {loading || !open ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">This job does not ask for extra details.</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => {
              const answer = answers.find((row) => row.field_id === field.id);
              const photoUrl = photoUrls[field.id];
              return (
                <div key={field.id} className="space-y-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  {!answer ? (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  ) : field.value_type === "text" ? (
                    <p className="text-sm whitespace-pre-wrap">{answer.text_value}</p>
                  ) : photoUrl ? (
                    <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <img src={photoUrl} alt={field.label} className="max-h-48 rounded-md border object-contain" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Photo could not be opened</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
