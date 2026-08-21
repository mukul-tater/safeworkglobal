import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTNER_ADD_WORKER_PATH } from "../lib/partnerAssistedWorker";

export default function AddWorkerButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Button asChild className={className}>
      <Link to={PARTNER_ADD_WORKER_PATH}>
        <UserPlus className="mr-1 h-4 w-4" /> Add Worker
      </Link>
    </Button>
  );
}
