import type { TradeCategory } from "./types";
import {
  UAE_LISTED_JOBS,
  UAE_LISTED_JOB_LABELS,
  isHiddenPublicJob,
} from "@/lib/uaeListedJobs";
import {
  UAE_LISTED_JOB_CARD_VISUALS,
  UAE_LISTED_JOB_SKILLS,
} from "@/components/jobs/listedJobCardVisuals";

function toTradeCategory(job: (typeof UAE_LISTED_JOBS)[number]) {
  const label = UAE_LISTED_JOB_LABELS[job];
  const visual = UAE_LISTED_JOB_CARD_VISUALS[job];
  return {
    id: job,
    name: label.en,
    hindiName: label.hi,
    image: visual.image,
    imageAlt: `${label.en} / ${label.hi}`,
    skills: UAE_LISTED_JOB_SKILLS[job],
    verification: "Skill Verification",
    objectPosition: visual.position,
  } satisfies TradeCategory;
}

/** Homepage shows these three, then Many more. Full catalog stays on Find jobs. */
const HOME_TRADE_PREVIEW_JOBS = [
  "Electrician",
  "Plumber",
  "Welder",
] as const satisfies ReadonlyArray<(typeof UAE_LISTED_JOBS)[number]>;

export const tradeCategories: TradeCategory[] = HOME_TRADE_PREVIEW_JOBS.filter(
  (job) => !isHiddenPublicJob(job),
).map(toTradeCategory);
