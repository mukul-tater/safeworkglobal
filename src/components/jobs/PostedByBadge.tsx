import { Badge } from "@/components/ui/badge";
import { Shield, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function isAdminPostedJob(role: string | null | undefined): boolean {
  return role === "admin";
}

export function postedByLabel(role: string | null | undefined): string {
  return isAdminPostedJob(role) ? "Posted by admin" : "Posted by employer";
}

export default function PostedByBadge({
  role,
  className,
}: {
  role: string | null | undefined;
  className?: string;
}) {
  const adminPosted = isAdminPostedJob(role);
  return (
    <Badge
      variant={adminPosted ? "default" : "outline"}
      className={cn("gap-1 text-xs font-medium", className)}
    >
      {adminPosted ? <Shield className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
      {postedByLabel(role)}
    </Badge>
  );
}
