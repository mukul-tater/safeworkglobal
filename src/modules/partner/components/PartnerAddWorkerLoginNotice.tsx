import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import HindiText from "@/components/indian-workforce/HindiText";

type Props = {
  onContinue: () => void;
};

/** Shown before every partner add-worker flow so the worker knows they can log in later. */
export default function PartnerAddWorkerLoginNotice({ onContinue }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-7">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Smartphone className="h-5 w-5" />
      </div>
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Worker login after registration
      </h2>
      <HindiText className="mt-0.5 text-base font-semibold text-foreground">
        रजिस्ट्रेशन के बाद वर्कर लॉगिन
      </HindiText>
      <p className="mt-2 text-sm text-muted-foreground">
        Please tell the worker this before creating their account.
      </p>
      <HindiText className="text-xs text-muted-foreground">
        खाता बनाने से पहले यह जानकारी वर्कर को बताएँ।
      </HindiText>

      <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm leading-relaxed text-foreground">
          After creating an account and completing the basic skill test, workers can log in
          anytime using their registered mobile number through the SafeWork Global website or
          app to view, update, track and manage their application progress.
        </p>
        <HindiText className="text-sm leading-relaxed text-muted-foreground">
          अकाउंट बनाने और बेसिक स्किल टेस्ट पूरा करने के बाद, worker अपने registered mobile
          number से SafeWork Global की website या app पर कभी भी login करके अपनी application देख,
          update और उसकी progress को track एवं manage कर सकता/सकती है।
        </HindiText>
      </div>

      <Button type="button" className="mt-6 w-full sm:w-auto" onClick={onContinue}>
        Continue · आगे बढ़ें
      </Button>
    </div>
  );
}
