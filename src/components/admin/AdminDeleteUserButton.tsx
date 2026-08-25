import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { adminDeleteUser } from "@/services/AdminService";

interface AdminDeleteUserButtonProps {
  userId: string;
  userLabel: string;
  userRole?: string | null;
  onDeleted?: () => void;
  variant?: "outline" | "destructive" | "ghost";
  size?: "icon" | "sm" | "default";
  label?: string;
}

export default function AdminDeleteUserButton({
  userId,
  userLabel,
  userRole,
  onDeleted,
  variant = "outline",
  size = "sm",
  label = "Delete",
}: AdminDeleteUserButtonProps) {
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (userId === currentUser?.id || userRole === "admin") {
    return null;
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await adminDeleteUser(userId);
      if (error) throw new Error(error);
      toast.success(`${userLabel} has been deleted`);
      setOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      console.error("Error deleting user:", error);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        title="Delete user and all related data"
        className={
          variant === "outline" || variant === "ghost"
            ? "text-destructive hover:text-destructive hover:bg-destructive/10"
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        {size !== "icon" && <span>{label}</span>}
      </Button>

      <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {userLabel}? This removes their account, profile, jobs,
              applications, verification data, and uploaded files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? "Deleting..." : "Delete user"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
