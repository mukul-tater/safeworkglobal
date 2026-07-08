import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  Bell,
  FileBarChart,
  Calendar,
  UserCheck,
  Briefcase,
  Building2,
  Plane,
  HeartPulse,
  FileCheck2,
  Award,
  DollarSign,
  LifeBuoy,
  Settings,
  Receipt,
  Banknote,
  Ticket,
} from "lucide-react";

export type PartnerTypeCode = "SEN" | "SSVN" | "SRN" | "SEN_GLOBAL" | string;

export interface PartnerNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface PartnerTypeConfig {
  code: PartnerTypeCode;
  landing: string;
  navItems: PartnerNavItem[];
}

/**
 * Central registry driving the partner portal shell. Adding a new partner
 * type = adding a config entry. No layout changes required.
 */
export const partnerTypeConfig: Record<string, PartnerTypeConfig> = {
  SEN: {
    code: "SEN",
    landing: "/emitra/dashboard",
    navItems: [
      { label: "Dashboard", to: "/emitra/dashboard", icon: LayoutDashboard },
      { label: "My Workers", to: "/emitra/my-workers", icon: Users },
      { label: "Onboard Worker", to: "/emitra/onboard-worker", icon: UserCheck },
      { label: "Rewards", to: "/emitra/rewards", icon: Award },
      { label: "Withdrawals", to: "/emitra/withdrawals", icon: DollarSign },
      { label: "Notifications", to: "/emitra/notifications", icon: Bell },
      { label: "Compliance", to: "/emitra/compliance", icon: FileCheck2 },
    ],
  },
  SSVN: {
    code: "SSVN",
    landing: "/partner/ssvn/dashboard",
    navItems: [
      { label: "Dashboard", to: "/partner/ssvn/dashboard", icon: LayoutDashboard },
      { label: "Assessment Calendar", to: "/partner/ssvn/calendar", icon: Calendar },
      { label: "Today's Schedule", to: "/partner/ssvn/today", icon: ClipboardCheck },
      { label: "Candidate Check-in", to: "/partner/ssvn/checkin", icon: UserCheck },
      { label: "Assessment History", to: "/partner/ssvn/history", icon: FileBarChart },
      { label: "Reports", to: "/partner/reports", icon: FileBarChart },
      { label: "Wallet", to: "/partner/wallet", icon: Wallet },
      { label: "Invoices", to: "/partner/invoices", icon: Receipt },
      { label: "Payouts", to: "/partner/payouts", icon: Banknote },
      { label: "Tickets", to: "/partner/tickets", icon: Ticket },
      { label: "Support", to: "/partner/support", icon: LifeBuoy },
    ],
  },
  SRN: {
    code: "SRN",
    landing: "/partner/srn/dashboard",
    navItems: [
      { label: "Dashboard", to: "/partner/srn/dashboard", icon: LayoutDashboard },
      { label: "Assigned Workers", to: "/partner/srn/workers", icon: Users },
      { label: "Medical", to: "/partner/srn/medical", icon: HeartPulse },
      { label: "Visa", to: "/partner/srn/visa", icon: FileCheck2 },
      { label: "Travel", to: "/partner/srn/travel", icon: Plane },
      { label: "Deployment", to: "/partner/srn/deployment", icon: Briefcase },
      { label: "Wallet", to: "/partner/wallet", icon: Wallet },
      { label: "Invoices", to: "/partner/invoices", icon: Receipt },
      { label: "Payouts", to: "/partner/payouts", icon: Banknote },
      { label: "Tickets", to: "/partner/tickets", icon: Ticket },
    ],
  },
  SEN_GLOBAL: {
    code: "SEN_GLOBAL",
    landing: "/partner/sen-global/dashboard",
    navItems: [
      { label: "Dashboard", to: "/partner/sen-global/dashboard", icon: LayoutDashboard },
      { label: "Employer Leads", to: "/partner/sen-global/leads", icon: Building2 },
      { label: "Revenue", to: "/partner/sen-global/revenue", icon: DollarSign },
      { label: "Wallet", to: "/partner/wallet", icon: Wallet },
      { label: "Invoices", to: "/partner/invoices", icon: Receipt },
      { label: "Payouts", to: "/partner/payouts", icon: Banknote },
      { label: "Tickets", to: "/partner/tickets", icon: Ticket },
    ],
  },
};

export const defaultLanding = "/partner/pending";
