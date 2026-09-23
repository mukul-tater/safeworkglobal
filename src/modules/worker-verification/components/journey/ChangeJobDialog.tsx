import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  currentJobTitle?: string | null;
  nextJobTitle?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ChangeJobDialog({
  open,
  currentJobTitle,
  nextJobTitle,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change job?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You follow one job at a time.
                {currentJobTitle ? (
                  <>
                    {' '}
                    <span className="font-medium text-foreground">{currentJobTitle}</span> will be closed and kept
                    on file.
                  </>
                ) : null}
                {nextJobTitle ? (
                  <>
                    {' '}
                    <span className="font-medium text-foreground">{nextJobTitle}</span> becomes your only active job.
                    Coming back to a previous job reopens that same application.
                  </>
                ) : (
                  <> The job you pick becomes your only active job. A previous job stays closed until you return to it.</>
                )}
              </p>
              <p>
                Test 1, skill proof, interview, and trade test are saved on the job you leave and restored if you
                come back. Your trade, the employer, and whether a trade test is required update to the active job.
                Identity, payment, medical, and the agreement stay with you.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep current job</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Change job</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
