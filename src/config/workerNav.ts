import { LayoutDashboard, User, BadgeCheck, Briefcase, Bookmark, FileText, FileCheck, CalendarCheck, Calendar, FileSignature, GraduationCap, Plane, Shield, DollarSign, Upload, MessageSquare, Bell, History } from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";

export const workerNavGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      { path: "/worker/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/worker/profile", icon: User, label: "Profile" },
      { path: "/worker/journey", icon: BadgeCheck, label: "My progress" },
    ],
  },
  {
    label: "Jobs",
    defaultOpen: true,
    items: [
      { path: "/jobs", icon: Briefcase, label: "Job Search" },
      { path: "/worker/saved-jobs", icon: Bookmark, label: "Saved Jobs" },
      { path: "/worker/saved-searches", icon: Bookmark, label: "Saved Searches" },
      { path: "/worker/applications", icon: FileText, label: "Applications" },
      { path: "/worker/application-tracking", icon: FileCheck, label: "Track Applications" },
    ],
  },
  {
    label: "Hiring Process",
    items: [
      { path: "/worker/interviews", icon: CalendarCheck, label: "Interviews" },
      { path: "/worker/calendar", icon: Calendar, label: "Calendar" },
      { path: "/worker/offers", icon: FileSignature, label: "Job Offers" },
      { path: "/worker/training", icon: GraduationCap, label: "Training & PDOT" },
    ],
  },
  {
    label: "Post-Hiring",
    items: [
      { path: "/worker/contracts", icon: FileSignature, label: "Contracts" },
      { path: "/worker/contract-history", icon: History, label: "Contract History" },
      { path: "/worker/travel", icon: Plane, label: "Travel & Visa" },
      { path: "/worker/insurance", icon: Shield, label: "Insurance" },
      { path: "/worker/payments", icon: DollarSign, label: "Payments" },
    ],
  },
  {
    label: "Account",
    items: [
      { path: "/worker/documents", icon: Upload, label: "Documents" },
      { path: "/worker/messaging", icon: MessageSquare, label: "Messages" },
      { path: "/worker/notifications", icon: Bell, label: "Notifications" },
    ],
  },
];

export const workerProfileMenu = [
  { label: "My Profile", icon: User, path: "/worker/profile" },
];
