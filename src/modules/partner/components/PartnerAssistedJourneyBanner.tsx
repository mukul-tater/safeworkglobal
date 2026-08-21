import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  CREATED_BY_PARTNER_LABEL,
  hasParkedPartnerSession,
  restoreParkedPartnerSession,
} from "../lib/partnerAssistedWorker";

/** Shown on the worker GCC journey while a partner is registering that worker. */
export default function PartnerAssistedJourneyBanner() {
  const { refreshProfile, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const parked = hasParkedPartnerSession();

  if (!parked) return null;

  const handleReturn = async () => {
    setBusy(true);
    try {
      const to = await restoreParkedPartnerSession();
      await refreshRole();
      await refreshProfile();
      toast.success("Returned to partner portal");
      navigate(to, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not return to partner portal");
      navigate("/partner/login", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Alert className="mb-4 border-primary/30 bg-primary/5">
      <Store className="h-4 w-4" />
      <AlertTitle>{CREATED_BY_PARTNER_LABEL}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>
          This worker is completing the full GCC onboarding journey. They already appear in My
          Workers. Return to your partner portal when you are done.
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={busy}
          onClick={handleReturn}
        >
          {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Back to My Workers
        </Button>
      </AlertDescription>
    </Alert>
  );
}
