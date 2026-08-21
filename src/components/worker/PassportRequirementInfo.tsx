import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { minPassportExpiryDate } from "@/lib/validations/passport";

function formatCutoffDate(locale: "en-IN" | "hi-IN", date: Date) {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PassportRequirementInfo() {
  const cutoff = minPassportExpiryDate();
  const enDate = formatCutoffDate("en-IN", cutoff);
  const hiDate = formatCutoffDate("hi-IN", cutoff);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Passport expiry | पासपोर्ट की तारीख"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            Check the expiry date | समाप्ति की तारीख देखें
          </DialogTitle>
          <DialogDescription className="sr-only">
            Your passport expiry date must be {enDate} or later. Renew first if it expires sooner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Expiry must be on or after
            </p>
            <p className="mt-1 font-heading text-base font-semibold">{enDate}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
              समाप्ति तारीख इससे पहले नहीं होनी चाहिए
            </p>
            <p className="mt-1 font-heading text-base font-semibold">{hiDate}</p>
          </div>
          <p>
            Open your passport and look at the expiry date. If it is before this date, renew the
            passport first, then continue. Visa and travel offices need at least 6 months left.
          </p>
          <p>
            पासपोर्ट खोलकर समाप्ति की तारीख देखें। अगर तारीख इससे पहले है, तो पहले नया पासपोर्ट
            बनवाएं, फिर आगे बढ़ें। वीज़ा और विदेश यात्रा के लिए पासपोर्ट में कम से कम 6 महीने बाकी
            होने चाहिए।
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
