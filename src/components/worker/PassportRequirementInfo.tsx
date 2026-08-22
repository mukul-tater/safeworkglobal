import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PASSPORT_REQUIREMENT_COPY = {
  titleEn: "Passport Requirement",
  titleHi: "पासपोर्ट आवश्यक",
  bodyEn: [
    "Your passport should have at least 6 months' validity.",
    "No passport yet? You can still register and complete the trade test, but a valid passport is required for visa processing, emigration clearance and international travel.",
  ],
  bodyHi: [
    "आपके पासपोर्ट की वैधता कम से कम 6 महीने होनी चाहिए।",
    "अभी पासपोर्ट नहीं है? आप रजिस्ट्रेशन और ट्रेड टेस्ट पूरा कर सकते हैं, लेकिन वीज़ा प्रक्रिया, इमिग्रेशन क्लियरेंस और विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।",
  ],
} as const;

export default function PassportRequirementInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${PASSPORT_REQUIREMENT_COPY.titleEn} | ${PASSPORT_REQUIREMENT_COPY.titleHi}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            {PASSPORT_REQUIREMENT_COPY.titleEn} | {PASSPORT_REQUIREMENT_COPY.titleHi}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {PASSPORT_REQUIREMENT_COPY.bodyEn.join(" ")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed text-foreground">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              English
            </p>
            {PASSPORT_REQUIREMENT_COPY.bodyEn.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              हिंदी
            </p>
            {PASSPORT_REQUIREMENT_COPY.bodyHi.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
