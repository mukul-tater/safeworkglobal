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

/** Homepage trade cards — same catalog as Find jobs / Choose a job. */
export const tradeCategories: TradeCategory[] = UAE_LISTED_JOBS.filter((job) => !isHiddenPublicJob(job)).map(
  (job) => {
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
    };
  },
);
