import { FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  WORKER_TERMS_SECTIONS,
  WORKER_TERMS_VERSION,
} from '@/modules/worker-verification/constants';

type WorkerTermsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
  description?: string;
  agreeLabel?: string;
};

export default function WorkerTermsDialog({
  open,
  onOpenChange,
  onAgree,
  description = 'Please read carefully. Agreeing confirms medical fitness and platform rules.',
  agreeLabel = 'I agree',
}: WorkerTermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="space-y-3 border-b border-border/80 px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="font-heading text-lg leading-snug tracking-tight sm:text-xl">
                Worker terms &amp; declarations
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <FileText className="h-3 w-3" />
            Version {WORKER_TERMS_VERSION}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ol className="space-y-4">
            {WORKER_TERMS_SECTIONS.map((section, index) => (
              <li
                key={section.id}
                className="rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4"
              >
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <DialogFooter className="gap-2 border-t border-border/80 bg-muted/30 px-6 py-4 sm:justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block sm:max-w-[220px]">
            By agreeing you accept these declarations for your worker account.
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-primary to-info font-semibold text-white hover:opacity-95 sm:flex-none"
              onClick={() => {
                onAgree();
                onOpenChange(false);
              }}
            >
              {agreeLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
