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
            Passport is optional for the trade test; a valid passport is required for emigration and travel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            Don&apos;t have a passport yet? You can still appear for the trade test. However, a valid
            passport is required for emigration clearance and international travel.
          </p>
          <p>
            अभी पासपोर्ट नहीं है? आप फिर भी ट्रेड टेस्ट दे सकते हैं। हालांकि, इमिग्रेशन क्लियरेंस और
            विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
