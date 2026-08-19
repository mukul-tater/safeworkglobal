import { BadgeCheck, FileCheck, Landmark, Wrench } from "lucide-react";
import { useI18n } from "@/i18n";

export default function WhySafeWork() {
  const { t } = useI18n();

  const trustPoints = [
    { icon: BadgeCheck, title: t("why.t1"), description: t("why.t1d"), iconBg: "bg-primary/10", iconColor: "text-primary" },
    { icon: Wrench, title: t("why.t2"), description: t("why.t2d"), iconBg: "bg-success/10", iconColor: "text-success" },
    { icon: Landmark, title: t("why.t3"), description: t("why.t3d"), iconBg: "bg-info/10", iconColor: "text-info" },
    { icon: FileCheck, title: t("why.t4"), description: t("why.t4d"), iconBg: "bg-secondary/10", iconColor: "text-secondary" },
  ];

  const agentIssues = [t("why.agent1"), t("why.agent2"), t("why.agent3"), t("why.agent4"), t("why.agent5")];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-12 sm:mb-16">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-success/10 text-success mb-4">
              {t("why.badge")}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight mb-4">
              {t("why.title1")}{" "}
              <span className="text-gradient">{t("why.title2")}</span> {t("why.title3")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t("why.p1")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("why.p2")}</p>
          </div>

          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 sm:p-8">
            <h3 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <span className="text-destructive">⚠</span> {t("why.agentsTitle")}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {agentIssues.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`inline-flex p-2.5 rounded-lg ${point.iconBg} mb-3`}>
                <point.icon className={`h-5 w-5 ${point.iconColor}`} />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-1.5">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
