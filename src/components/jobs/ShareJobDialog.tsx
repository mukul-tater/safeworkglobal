import { useEffect, useState } from "react";
import { Copy, Loader2, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { absoluteJobUrl, createJobShare, whatsappShareUrl } from "@/lib/jobShare";

export type ShareJobTarget = {
  id: string;
  slug: string | null;
  title: string;
};

type ShareJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ShareJobTarget | null;
};

export default function ShareJobDialog({ open, onOpenChange, job }: ShareJobDialogProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [tracked, setTracked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const jobId = job?.id ?? null;
  const jobSlug = job?.slug ?? null;

  useEffect(() => {
    if (!open || !jobId) {
      setUrl(null);
      setTracked(false);
      setLoading(false);
      setError(null);
      return;
    }

    const slug = jobSlug || jobId;
    if (!isAuthenticated) {
      setTracked(false);
      setError(null);
      setUrl(absoluteJobUrl(slug));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setUrl(null);
    setTracked(false);
    setError(null);

    createJobShare(jobId)
      .then((code) => {
        if (cancelled) return;
        setTracked(true);
        setUrl(absoluteJobUrl(slug, code));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not create a share link");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, jobId, jobSlug, isAuthenticated]);

  const copyLink = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: tracked ? "This link records who opens the job." : "Job link copied to clipboard",
    });
  };

  const shareNative = async () => {
    if (!url || !job || !navigator.share) return;
    try {
      await navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title}`,
        url,
      });
    } catch {
      // The person closed the share sheet.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this job</DialogTitle>
          <DialogDescription>
            {job ? job.title : "Share a job link."}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your link…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-3">
            <Input readOnly value={url ?? ""} aria-label="Job link" />
            <p className="text-xs text-muted-foreground">
              {tracked
                ? "Opens of this link are recorded for this job."
                : "Sign in to use a link that records who opened the job."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                disabled={!url}
                onClick={() => {
                  if (!url || !job) return;
                  window.open(whatsappShareUrl(job.title, url), "_blank", "noopener,noreferrer");
                }}
              >
                WhatsApp
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => void copyLink()} disabled={!url}>
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </Button>
              {canNativeShare ? (
                <Button type="button" variant="outline" className="flex-1" onClick={() => void shareNative()} disabled={!url}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
