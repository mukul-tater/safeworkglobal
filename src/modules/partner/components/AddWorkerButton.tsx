import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTNER_ADD_WORKER_PATH, partnerCanAddWorkers } from "../lib/partnerAssistedWorker";
import { useCurrentPartner } from "../hooks/useCurrentPartner";

export default function AddWorkerButton({
  className,
}: {
  className?: string;
}) {
  const { partner, loading } = useCurrentPartner();
  if (loading || !partner) return null;
  if (
    !partnerCanAddWorkers({
      partnerTypeCode: partner.partner_type_code,
      canAddWorkers: partner.can_add_workers,
    })
  ) {
    return null;
  }

  return (
    <Button asChild className={className}>
      <Link to={PARTNER_ADD_WORKER_PATH}>
        <UserPlus className="mr-1 h-4 w-4" /> Add Worker
      </Link>
    </Button>
  );
}
