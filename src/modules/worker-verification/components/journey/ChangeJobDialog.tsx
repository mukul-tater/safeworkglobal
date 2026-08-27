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
                You can only follow one job in your GCC journey at a time.
                {currentJobTitle ? (
                  <>
                    {' '}
                    You are currently on <span className="font-medium text-foreground">{currentJobTitle}</span>.
                  </>
                ) : null}
                {nextJobTitle ? (
                  <>
                    {' '}
                    Switching to <span className="font-medium text-foreground">{nextJobTitle}</span> will restart
                    skill checks for that job.
                  </>
                ) : (
                  <> Picking a different job will restart skill checks for the new job.</>
                )}
              </p>
              <p className="font-medium text-foreground">You will need to do these again:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Test 1 — work quiz</li>
                <li>Skill proof (photos and videos)</li>
                <li>Test 2 — video interview</li>
                <li>Test 3 — physical trade test (if the new job needs it)</li>
              </ul>
              <p>
                Identity, payment, medical, bond, and earlier job applications stay on file. Previous applications
                are not deleted.
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
