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

          <h2 className="text-lg sm:text-xl font-bold font-heading tracking-tight mb-2">
            Technology platform. Licensed recruitment.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            SafeWork Global is a technology and workforce mobility platform.
            Overseas recruitment is conducted through{" "}
            <span className="text-foreground font-medium">Vesta Immigration LLP</span>,
            a Registered Recruiting Agent (MEA).
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
