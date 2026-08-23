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
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            Your passport should have at least 6 months’ validity. You can still register and
            complete till trade tests without a passport. A valid passport is required for visa
            processing, emigration clearance and international travel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <div className="space-y-2">
            
            <p>Your passport should have at least 6 months’ validity.</p>
            <p>
              No passport yet? Still you can register and complete till trade tests, but a valid
              passport is required for visa processing, emigration clearance and international
              travel.
            </p>
            <p>You can apply for a new passport. Generally you will get new passport in 10-15 days.</p>
          </div>
          <div className="space-y-2">
            
            <p>पासपोर्ट आवश्यक: आपके पासपोर्ट की वैधता कम से कम 6 महीने होनी चाहिए।</p>
            <p>
              अभी पासपोर्ट नहीं है? लेकिन फिर भी आप रजिस्ट्रेशन और ट्रेड टेस्ट पूरा कर सकते हैं, लेकिन
              वीज़ा प्रक्रिया, इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।
            </p>
            <p>नया पासपोर्ट बनाने में सिर्फ़ 10-15 दिन लगते हैं।</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
