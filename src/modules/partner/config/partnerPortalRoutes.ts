import type { LucideIcon } from "lucide-react";
import { Building2, GraduationCap, HeartPulse, UsersRound } from "lucide-react";

export type LockedPartnerPortal = {
  code: string;
  typeLabel: string;
  loginPath: string;
  registerPath: string;
  dashboardPath: string;
  heading: string;
  subtitle: string;
  signInLabel: string;
  orgNameLabel: string;
  loginTitle: string;
  loginBlurb: string;
  applyNoun: string;
  missingOrg: string;
  accentClass: string;
  Icon: LucideIcon;
};

export const LOCKED_PARTNER_PORTALS: Record<string, LockedPartnerPortal> = {
  SSVN: {
    code: "SSVN",
    typeLabel: "SSVN",
    loginPath: "/partner/ssvn/login",
    registerPath: "/partner/register-ssvn",
    dashboardPath: "/partner/ssvn/dashboard",
    heading: "Trade Test Centre (SSVN) Registration",
    subtitle: "Apply to operate a SafeWork trade test centre. After approval, sign in at SSVN login.",
    signInLabel: "SSVN sign in",
    orgNameLabel: "Company / Center Name *",
    loginTitle: "Trade Test Centre Sign In",
    loginBlurb: "SSVN partners — run assessments for SafeWork-allocated candidates.",
    applyNoun: "trade test centre",
    missingOrg: "No trade test centre (SSVN) registration found for this account. Apply first.",
    accentClass: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    Icon: Building2,
  },
  ITI: {
    code: "ITI",
    typeLabel: "ITI",
    loginPath: "/partner/iti/login",
    registerPath: "/partner/register-iti",
    dashboardPath: "/partner/iti/dashboard",
    heading: "ITI Partner Registration",
    subtitle: "Apply as an Industrial Training Institute. After approval, sign in at ITI login.",
    signInLabel: "ITI sign in",
    orgNameLabel: "Institute Name *",
    loginTitle: "ITI Partner Sign In",
    loginBlurb: "ITI partners — train and onboard skilled workers for SafeWork.",
    applyNoun: "ITI",
    missingOrg: "No ITI partner registration found for this account. Apply first.",
    accentClass: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    Icon: GraduationCap,
  },
  SRN: {
    code: "SRN",
    typeLabel: "MEA Licensed RA",
    loginPath: "/partner/srn/login",
    registerPath: "/partner/register-srn",
    dashboardPath: "/partner/srn/dashboard",
    heading: "MEA Licensed Recruitment Agency Registration",
    subtitle:
      "Apply as an MEA-approved licensed recruiting agent (RC). After approval, sign in at RA login.",
    signInLabel: "MEA Licensed RA sign in",
    orgNameLabel: "Agency Name *",
    loginTitle: "MEA Licensed RA Sign In",
    loginBlurb: "Licensed recruitment agencies — overseas placement, visa and emigration.",
    applyNoun: "MEA licensed RA",
    missingOrg: "No MEA licensed recruitment agency registration found for this account. Apply first.",
    accentClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    Icon: HeartPulse,
  },
  CONSULTANT: {
    code: "CONSULTANT",
    typeLabel: "Consultant",
    loginPath: "/partner/consultant/login",
    registerPath: "/partner/register-consultant",
    dashboardPath: "/partner/consultant/dashboard",
    heading: "Consultant Partner Registration",
    subtitle:
      "Apply as a placement consultant, recruitment partner, freelancer, NGO or candidate mobiliser. After approval, sign in at consultant login.",
    signInLabel: "Consultant sign in",
    orgNameLabel: "Organisation / Name *",
    loginTitle: "Consultant Sign In",
    loginBlurb:
      "Placement consultants, recruitment partners, freelancers, NGOs and candidate mobilisers.",
    applyNoun: "consultant",
    missingOrg: "No consultant partner registration found for this account. Apply first.",
    accentClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    Icon: UsersRound,
  },
};

export function lockedPartnerFromPath(pathname: string): LockedPartnerPortal | null {
  if (pathname.includes("register-ssvn") || pathname.includes("/partner/ssvn/")) {
    return LOCKED_PARTNER_PORTALS.SSVN;
  }
  if (pathname.includes("register-iti") || pathname.includes("/partner/iti/")) {
    return LOCKED_PARTNER_PORTALS.ITI;
  }
  if (pathname.includes("register-srn") || pathname.includes("/partner/srn/")) {
    return LOCKED_PARTNER_PORTALS.SRN;
  }
  if (pathname.includes("register-consultant") || pathname.includes("/partner/consultant/")) {
    return LOCKED_PARTNER_PORTALS.CONSULTANT;
  }
  return null;
}
