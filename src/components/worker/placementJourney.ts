import {
  UserPlus,
  FileText,
  ClipboardList,
  Video,
  Wrench,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  UserCheck,
  FileSignature,
  Stamp,
  Plane,
  Flag,
  type LucideIcon,
} from "lucide-react";

export type PlacementStepStatus = "completed" | "current" | "waiting";

export type PlacementStepId =
  | "registration"
  | "documents"
  | "screening"
  | "tech_interview"
  | "trade_test"
  | "skill_verified"
  | "employer_matched"
  | "interview_scheduled"
  | "selected"
  | "offer_letter"
  | "visa"
  | "ready_to_fly"
  | "deployed";

export type PlacementStepDef = {
  id: PlacementStepId;
  shortLabel: string;
  fullLabel: string;
  /** Sidebar / deep-link destination */
  path: string;
  icon: LucideIcon;
};

/** Single source of truth for home tracker + My Journey sidebar. */
export const PLACEMENT_STEPS: PlacementStepDef[] = [
  {
    id: "registration",
    shortLabel: "Registration",
    fullLabel: "Registration Completed",
    path: "/worker/profile",
    icon: UserPlus,
  },
  {
    id: "documents",
    shortLabel: "Documents",
    fullLabel: "Documents Verified",
    path: "/worker/documents",
    icon: FileText,
  },
  {
    id: "screening",
    shortLabel: "Screening",
    fullLabel: "Basic Screening Passed",
    path: "/worker/journey",
    icon: ClipboardList,
  },
  {
    id: "tech_interview",
    shortLabel: "Tech Interview",
    fullLabel: "Technical Interview Completed",
    path: "/worker/interviews",
    icon: Video,
  },
  {
    id: "trade_test",
    shortLabel: "Trade Test",
    fullLabel: "Trade Test Passed",
    path: "/worker/training",
    icon: Wrench,
  },
  {
    id: "skill_verified",
    shortLabel: "Skill Verified",
    fullLabel: "Skill Verified",
    path: "/worker/journey",
    icon: BadgeCheck,
  },
  {
    id: "employer_matched",
    shortLabel: "Employer Match",
    fullLabel: "Employer Matched",
    path: "/worker/applications",
    icon: Briefcase,
  },
  {
    id: "interview_scheduled",
    shortLabel: "Interview",
    fullLabel: "Interview Scheduled",
    path: "/worker/interviews",
    icon: CalendarCheck,
  },
  {
    id: "selected",
    shortLabel: "Selected",
    fullLabel: "Selected",
    path: "/worker/applications",
    icon: UserCheck,
  },
  {
    id: "offer_letter",
    shortLabel: "Offer Letter",
    fullLabel: "Offer Letter Issued",
    path: "/worker/offers",
    icon: FileSignature,
  },
  {
    id: "visa",
    shortLabel: "Visa",
    fullLabel: "Visa Under Process",
    path: "/worker/travel",
    icon: Stamp,
  },
  {
    id: "ready_to_fly",
    shortLabel: "Ready to Fly",
    fullLabel: "Ready to Fly",
    path: "/worker/travel",
    icon: Plane,
  },
  {
    id: "deployed",
    shortLabel: "Deployed",
    fullLabel: "Successfully Deployed",
    path: "/worker/contracts",
    icon: Flag,
  },
];

/** Map flags into a linear completed → current → waiting pipeline. */
export function derivePlacementStatuses(
  done: Partial<Record<PlacementStepId, boolean>>,
): Record<PlacementStepId, PlacementStepStatus> {
  const result = {} as Record<PlacementStepId, PlacementStepStatus>;
  let locked = false;

  for (const step of PLACEMENT_STEPS) {
    if (!locked && done[step.id]) {
      result[step.id] = "completed";
      continue;
    }
    if (!locked) {
      result[step.id] = "current";
      locked = true;
    } else {
      result[step.id] = "waiting";
    }
  }

  if (!locked) {
    for (const step of PLACEMENT_STEPS) {
      result[step.id] = "completed";
    }
  }

  return result;
}

export function placementStatusLabel(status: PlacementStepStatus): string {
  if (status === "completed") return "Completed";
  if (status === "current") return "In Progress";
  return "Waiting";
}

export function placementStatusTone(
  status: PlacementStepStatus,
): "completed" | "in_progress" | "waiting" {
  if (status === "completed") return "completed";
  if (status === "current") return "in_progress";
  return "waiting";
}
