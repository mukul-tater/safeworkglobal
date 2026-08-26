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
            You can upload your passport later. Aadhaar card is must. Passport is not needed until
            after your skill test. A valid passport is required later for visa processing,
            emigration clearance and international travel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <div className="space-y-2">
            <p className="font-semibold">You can upload your passport later.</p>
            <p>Aadhaar card is must.</p>
            <p>
              No passport yet? You can still register and complete till trade tests. After the skill
              test we will ask for PAN and passport. A valid passport is required for visa
              processing, emigration clearance and international travel.
            </p>
            <p>If you have a passport, it should have at least 6 months’ validity.</p>
            <p>You can apply for a new passport. Generally you will get new passport in 10-15 days.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">पासपोर्ट आप बाद में अपलोड कर सकते हैं।</p>
            <p>आधार कार्ड अनिवार्य है।</p>
            <p>
              अभी पासपोर्ट नहीं है? आप रजिस्ट्रेशन और ट्रेड टेस्ट पूरा कर सकते हैं। कौशल परीक्षा के बाद हम
              पैन और पासपोर्ट माँगेंगे। वीज़ा, इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।
            </p>
            <p>अगर पासपोर्ट है, तो उसकी वैधता कम से कम 6 महीने होनी चाहिए।</p>
            <p>नया पासपोर्ट बनाने में सिर्फ़ 10-15 दिन लगते हैं।</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PanUploadLaterInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="PAN card | पैन कार्ड"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            PAN card | पैन कार्ड
          </DialogTitle>
          <DialogDescription className="sr-only">
            You can upload your PAN later. Aadhaar is required now. We will ask for PAN after your
            skill test.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <div className="space-y-2">
            <p className="font-semibold">You can upload your PAN later.</p>
            <p>Aadhaar is required now. We will ask for PAN after your skill test is complete.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">पैन कार्ड आप बाद में अपलोड कर सकते हैं।</p>
            <p>अभी आधार अनिवार्य है। कौशल परीक्षा पूरी होने के बाद हम पैन माँगेंगे।</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
