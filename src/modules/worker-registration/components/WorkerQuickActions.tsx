import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Camera, MessageCircle, Search, User } from "lucide-react";
import { getWorkerWhatsAppUrl } from "@/config/workerSupport";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

interface Props {
  readonly canBrowseJobs: boolean;
  readonly onboardingCompleted: boolean;
  readonly preferredGccCountry?: string | null;
}

export default function WorkerQuickActions({
  canBrowseJobs,
  onboardingCompleted,
  preferredGccCountry,
}: Props) {
  const { t } = useWorkerLanguage();

  const jobsLink = preferredGccCountry
    ? `/jobs?location=${encodeURIComponent(preferredGccCountry)}`
    : "/jobs";

  const whatsappUrl = getWorkerWhatsAppUrl(t("whatsapp.message"));

  const actions = onboardingCompleted
    ? [
        {
          href: jobsLink,
          external: false,
          title: t("quickActions.browseMore"),
          desc: t("quickActions.browseMoreDesc"),
          icon: Search,
        },
        {
          href: "/onboarding",
          external: false,
          title: t("quickActions.updateProof"),
          desc: t("quickActions.updateProofDesc"),
          icon: Camera,
        },
        {
          href: whatsappUrl,
          external: true,
          title: t("quickActions.needHelp"),
          desc: t("quickActions.needHelpDesc"),
          icon: MessageCircle,
        },
      ]
    : [
        {
          href: canBrowseJobs ? jobsLink : "/onboarding",
          external: false,
          title: canBrowseJobs ? t("quickActions.browseJobs") : t("quickActions.unlockJobs"),
          desc: canBrowseJobs ? t("quickActions.browseJobsDesc") : t("quickActions.unlockJobsDesc"),
          icon: Search,
        },
        {
          href: "/onboarding",
          external: false,
          title: t("quickActions.updateProfile"),
          desc: t("quickActions.updateProfileDesc"),
          icon: User,
        },
        {
          href: whatsappUrl,
          external: true,
          title: t("quickActions.whatsapp"),
          desc: t("quickActions.whatsappDesc"),
          icon: MessageCircle,
        },
      ];

  return (
    <section className="mb-20 sm:mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {t("quickActions.more")}
      </h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const inner = (
            <Card className="group h-full hover:border-primary/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          );

          if (action.external) {
            return (
              <a
                key={action.title}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {inner}
              </a>
            );
          }

          return (
            <Link key={action.title} to={action.href} className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
