import type { LucideIcon } from "lucide-react";
import { Store, Building2, HeartPulse, Globe2, GraduationCap, Briefcase, UsersRound } from "lucide-react";

export type PartnerSignupStatus = "live" | "coming_soon";

/**
 * Public partner signup options (Get Started → Partner).
 * Add a new entry here when a partner type gets its own onboarding route.
 * Only `status: "live"` options are shown in the chooser UI for now.
 */
export interface PartnerSignupOption {
  code: string;
  name: string;
  shortDescription: string;
  icon: LucideIcon;
  status: PartnerSignupStatus;
  /** Where to send the user after they confirm (live partners only). */
  registerPath?: string;
  accentClass: string;
}

export const PARTNER_SIGNUP_OPTIONS: PartnerSignupOption[] = [
  {
    code: "EMITRA",
    name: "E-Mitra",
    shortDescription: "CSC / E-Mitra kiosk partner — register workers for overseas jobs",
    icon: Store,
    status: "live",
    registerPath: "/emitra/register",
    accentClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    code: "SSVN",
    name: "SSVN / Safework skill verification network",
    shortDescription: "Skill verification & assessment centres / trade test centers",
    icon: Building2,
    status: "live",
    registerPath: "/partner/register-ssvn",
    accentClass: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  {
    code: "ITI",
    name: "ITI",
    shortDescription: "Industrial Training Institutes — train and onboard skilled workers",
    icon: GraduationCap,
    status: "live",
    registerPath: "/partner/register-iti",
    accentClass: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
  {
    code: "SRN",
    name: "MEA Licensed RA",
    shortDescription:
      "MEA-approved licensed recruitment agencies — overseas placement, visa & emigration",
    icon: HeartPulse,
    status: "live",
    registerPath: "/partner/register-srn",
    accentClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  {
    code: "CONSULTANT",
    name: "Consultants",
    shortDescription:
      "Placement consultants, recruitment partners, freelancers, NGOs and candidate mobilisers",
    icon: UsersRound,
    status: "live",
    registerPath: "/partner/register-consultant",
    accentClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  {
    code: "EMPLOYER",
    name: "Employer",
    shortDescription: "Hire verified workers for overseas jobs",
    icon: Briefcase,
    status: "live",
    registerPath: "/employer/quick-signup",
    accentClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    code: "SEN_GLOBAL",
    name: "SEN Global",
    shortDescription: "International employer leads & placement",
    icon: Globe2,
    status: "coming_soon",
    accentClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
];

export const DEFAULT_PARTNER_SIGNUP_CODE = "EMITRA";

export function getPartnerSignupOption(code: string): PartnerSignupOption | undefined {
  return PARTNER_SIGNUP_OPTIONS.find((o) => o.code === code);
}

export function getLivePartnerSignupOptions(): PartnerSignupOption[] {
  return PARTNER_SIGNUP_OPTIONS.filter((o) => o.status === "live");
}
