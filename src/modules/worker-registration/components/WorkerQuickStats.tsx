import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Briefcase, FileText, Globe, LucideIcon } from "lucide-react";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  to: string;
}

interface Props {
  readonly applications: number;
  readonly skillsWithMediaCount: number;
  readonly gccTarget: string;
  readonly showApplications: boolean;
}

export default function WorkerQuickStats({
  applications,
  skillsWithMediaCount,
  gccTarget,
  showApplications,
}: Props) {
  const { t } = useWorkerLanguage();

  const stats: StatItem[] = [
    ...(showApplications
      ? [
          {
            label: t("stats.applications"),
            value: applications,
            icon: Briefcase,
            color: "text-primary",
            bg: "bg-primary/10",
            to: "/home",
          } as StatItem,
        ]
      : []),
    {
      label: t("stats.skills"),
      value: skillsWithMediaCount,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      to: "/onboarding",
    },
    {
      label: t("stats.country"),
      value: gccTarget,
      icon: Globe,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      to: "/onboarding",
    },
  ];

  return (
    <div className={`grid gap-3 mb-5 ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {stats.map((stat) => (
        <Link key={stat.label} to={stat.to} aria-label={stat.label}>
          <Card className="p-3 text-center hover:border-primary/30 transition-all h-full">
            <div className={`inline-flex p-1.5 rounded-lg ${stat.bg} mb-1.5`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold truncate px-1">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stat.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
