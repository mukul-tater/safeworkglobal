import { FileCheck, ShieldCheck } from "lucide-react";

export default function HomeLicenseStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <FileCheck className="h-3.5 w-3.5" />
            Licensed & Regulated
          </div>

          <p className="text-sm sm:text-base text-foreground leading-relaxed max-w-2xl mx-auto">
            SafeWork Global is a technology and workforce mobility platform.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-3">
            Overseas Recruitment Process Conducted Through:
          </p>
          <p className="text-sm sm:text-base font-semibold font-heading mt-1">
            Vesta Immigration LLP
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registered Recruiting Agent (MEA)
          </p>

          <div className="mt-5 inline-flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-left">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                RC No.
              </p>
              <p className="text-xs sm:text-sm font-semibold font-heading tracking-tight">
                B-2069/UP/PART/1000+/5/10331/2023
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
