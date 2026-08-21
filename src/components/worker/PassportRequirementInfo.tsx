import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PassportRequirementInfo() {
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
          <DialogDescription className="sr-only">
            A valid passport with at least 6 months remaining is required for identity verification, emigration and travel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            A valid passport is required for identity verification. It must not be expired and must
            remain valid for at least 6 months from today (needed for emigration clearance and
            overseas travel).
          </p>
          <p>
            पहचान सत्यापन के लिए वैध पासपोर्ट आवश्यक है। यह समाप्त (expired) नहीं होना चाहिए और आज से
            कम से कम 6 महीने तक वैध होना चाहिए — इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए।
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
