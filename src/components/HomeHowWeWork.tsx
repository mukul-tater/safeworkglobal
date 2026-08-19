import { BadgeCheck, Handshake, Landmark } from "lucide-react";
import { useI18n } from "@/i18n";

export default function HomeHowWeWork() {
  const { t } = useI18n();

  const steps = [
    { icon: BadgeCheck, title: t("how.s1"), description: t("how.s1d") },
    { icon: Handshake, title: t("how.s2"), description: t("how.s2d") },
    { icon: Landmark, title: t("how.s3"), description: t("how.s3d") },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20 border-y border-border/60">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-3">
            {t("how.badge")}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-3">
            {t("how.title1")} <span className="text-gradient">{t("how.title2")}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t("how.intro")}</p>
        </div>

        <ol className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {t("how.step", { n: index + 1 })}
                </span>
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-1.5">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-3xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("how.note")}
        </p>
      </div>
    </section>
  );
}
