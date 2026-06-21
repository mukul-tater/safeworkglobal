import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WorkerOnboardingData } from "../types/onboarding.types";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  readonly onboarding: WorkerOnboardingData;
}

export default function WorkerOnboardingChecklist({ onboarding }: Props) {
  const { t } = useWorkerLanguage();

  const hasPersonalDetails = Boolean(
    onboarding.dateOfBirth && onboarding.gender && onboarding.address
  );
  const hasLocation = Boolean(onboarding.stateId && onboarding.districtId);
  const hasWorkPreferences = Boolean(
    onboarding.primarySkillId && onboarding.preferredGccCountry && onboarding.experienceLevel
  );
  const hasSkillProof = onboarding.skillsWithMediaCount > 0;

  const items = [
    {
      key: "personal",
      label: t("checklist.personal"),
      done: hasPersonalDetails,
      hint: t("checklist.personalHint"),
    },
    {
      key: "location",
      label: t("checklist.location"),
      done: hasLocation,
      hint: onboarding.districtName
        ? `${onboarding.districtName}, ${onboarding.stateName}`
        : t("checklist.locationHint"),
    },
    {
      key: "work",
      label: t("checklist.work"),
      done: hasWorkPreferences,
      hint: onboarding.preferredGccCountry
        ? `${onboarding.primarySkillName} → ${onboarding.preferredGccCountry}`
        : t("checklist.workHint"),
    },
    {
      key: "skill",
      label: t("checklist.skillProof"),
      done: hasSkillProof,
      hint: hasSkillProof
        ? t("checklist.skillProofDone", { count: onboarding.skillsWithMediaCount })
        : t("checklist.skillProofEmpty"),
    },
  ];

  const remaining = items.filter((i) => !i.done).length;

  return (
    <Card className="p-4 sm:p-5 mb-5">
      <div className="mb-3">
        <h2 className="text-base font-bold font-heading">
          {remaining > 0 ? t("checklist.remaining", { count: remaining }) : t("checklist.allDone")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {remaining > 0 ? t("checklist.remainingSub") : t("checklist.completeSub")}
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5",
              item.done ? "border-success/30 bg-success/5" : "border-border bg-muted/20"
            )}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
