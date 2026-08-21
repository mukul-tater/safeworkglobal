import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  passportMinValidityHintEn,
  passportMinValidityHintHi,
} from "@/lib/validations/passport";

export default function PassportRequirementInfo() {
  const hintEn = passportMinValidityHintEn();
  const hintHi = passportMinValidityHintHi();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Passport Requirement | पासपोर्ट संबंधी जानकारी"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            Passport Requirement | पासपोर्ट संबंधी जानकारी
          </DialogTitle>
          <DialogDescription className="sr-only">{hintEn}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>{hintEn}</p>
          <p>{hintHi}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
