import type { LucideIcon } from "lucide-react";
import { Store, Building2, HeartPulse, Globe2 } from "lucide-react";

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
    name: "SSVN",
    shortDescription: "Skill verification & assessment centres",
    icon: Building2,
    status: "live",
    registerPath: "/partner/register-ssvn",
    accentClass: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  {
    code: "SRN",
    name: "SRN",
    shortDescription: "Recruitment network — medical, visa & travel",
    icon: HeartPulse,
    status: "coming_soon",
    accentClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
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
