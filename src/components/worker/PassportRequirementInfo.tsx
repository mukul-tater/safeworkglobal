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
          aria-label="Passport and Aadhaar Requirement | पासपोर्ट और आधार संबंधी जानकारी"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            Passport & Aadhaar Requirement | पासपोर्ट और आधार संबंधी जानकारी
          </DialogTitle>
          <DialogDescription className="sr-only">
            Aadhaar card is must. Passport is optional until your skill test is complete. You can
            still register and complete till trade tests without a passport. After the skill test we
            will ask for PAN and passport. A valid passport is required for visa processing,
            emigration clearance and international travel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <div className="space-y-2">
            
            <p>Aadhaar card is must.</p>
            <p>Passport is optional until your skill test is complete. If you have one, it should have at least 6 months’ validity.</p>
            <p>
              No passport yet? You can still register and complete till trade tests. After the skill
              test we will ask for PAN and passport. A valid passport is required for visa
              processing, emigration clearance and international travel.
            </p>
            <p>You can apply for a new passport. Generally you will get new passport in 10-15 days.</p>
          </div>
          <div className="space-y-2">
            
            <p>आधार कार्ड अनिवार्य है।</p>
            <p>कौशल परीक्षा पूरी होने तक पासपोर्ट वैकल्पिक है। अगर पासपोर्ट है, तो उसकी वैधता कम से कम 6 महीने होनी चाहिए।</p>
            <p>
              अभी पासपोर्ट नहीं है? आप रजिस्ट्रेशन और ट्रेड टेस्ट पूरा कर सकते हैं। कौशल परीक्षा के बाद हम
              पैन और पासपोर्ट माँगेंगे। वीज़ा, इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।
            </p>
            <p>नया पासपोर्ट बनाने में सिर्फ़ 10-15 दिन लगते हैं।</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
