import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AUTH_CONTINUE_MESSAGES, portalAuthPath, type AuthPortalRole } from '@/lib/authContinueCore';

export default function AuthConflictPanel({
  message,
  portal,
  onUseSingleIdentifier,
}: {
  message?: string;
  portal?: AuthPortalRole | null;
  onUseSingleIdentifier?: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription className="text-sm">{message || AUTH_CONTINUE_MESSAGES.conflict}</AlertDescription>
      </Alert>
      {portal ? (
        <Button asChild className="h-11 w-full">
          <Link to={portalAuthPath(portal)}>Continue on the {portal} portal</Link>
        </Button>
      ) : null}
      {onUseSingleIdentifier ? (
        <button
          type="button"
          data-inline
          onClick={onUseSingleIdentifier}
          className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Continue with one identifier
        </button>
      ) : null}
    </div>
  );
}
