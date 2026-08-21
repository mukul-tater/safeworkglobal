import { FileUp, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HindiText from "@/components/indian-workforce/HindiText";
import { ackEmitraOnboardingNotice } from "../lib/emitraWorkerOnboarding";

const POINTS = [
  {
    icon: FileUp,
    en: "You can upload photos, documents and other details later. You do not have to finish everything at the eMitra centre today.",
    hi: "आप फ़ोटो, दस्तावेज़ और अन्य जानकारी बाद में भी अपलोड कर सकते हैं। आज ई-मित्र केंद्र पर सब कुछ पूरा करना ज़रूरी नहीं है।",
  },
  {
    icon: KeyRound,
    en: "The eMitra partner will set a basic password for this worker account. Please write it down with the mobile number.",
    hi: "ई-मित्र पार्टनर इस वर्कर खाते के लिए एक बेसिक पासवर्ड बनाएगा। कृपया मोबाइल नंबर के साथ इसे लिख लें।",
  },
  {
    icon: RefreshCw,
    en: "Later, sign in with that mobile number and password. You can change the password from Profile, and continue the GCC journey anytime.",
    hi: "बाद में उसी मोबाइल नंबर और पासवर्ड से साइन इन करें। प्रोफ़ाइल से पासवर्ड बदल सकते हैं, और GCC यात्रा कभी भी जारी रख सकते हैं।",
  },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Bilingual notice for workers onboarded at an eMitra kiosk. */
export default function EmitraWorkerOnboardingNoticeDialog({ open, onOpenChange }: Props) {
  const close = () => {
    ackEmitraOnboardingNotice();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        close();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>eMitra worker onboarding</DialogTitle>
          <HindiText className="text-base font-semibold text-foreground">
            ई-मित्र वर्कर ऑनबोर्डिंग
          </HindiText>
          <DialogDescription asChild>
            <div className="space-y-1 pt-1">
              <p>Please read this with the worker before creating the account.</p>
              <HindiText className="text-xs text-muted-foreground">
                खाता बनाने से पहले यह जानकारी वर्कर के साथ पढ़ें।
              </HindiText>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {POINTS.map((point) => (
            <li
              key={point.en}
              className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <point.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm leading-snug text-foreground">{point.en}</p>
                <HindiText className="text-xs leading-snug text-muted-foreground">
                  {point.hi}
                </HindiText>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" onClick={close}>
            I understand · समझ गया
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
