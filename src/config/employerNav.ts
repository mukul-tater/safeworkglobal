import { LayoutDashboard, User, Building2, PlusCircle, Briefcase, Users, Bookmark, UserCheck, Star, Calendar, FileSignature, FileCheck, History, BarChart3, MessageSquare } from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";

export const employerNavGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      { path: "/employer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/employer/profile", icon: User, label: "My Profile" },
      { path: "/employer/company", icon: Building2, label: "Company & KYC" },
    ],
  },
  {
    label: "Jobs & Hiring",
    defaultOpen: true,
    items: [
      { path: "/employer/post-job", icon: PlusCircle, label: "Post a Job" },
      { path: "/employer/manage-jobs", icon: Briefcase, label: "Manage Jobs" },
      { path: "/employer/search-workers", icon: Users, label: "Search Workers" },
      { path: "/employer/saved-searches", icon: Bookmark, label: "Saved Searches" },
    ],
  },
  {
    label: "Applications",
    items: [
      { path: "/employer/applications", icon: UserCheck, label: "Applications" },
      { path: "/employer/shortlist", icon: Star, label: "Shortlist" },
      { path: "/employer/interviews", icon: Calendar, label: "Interviews" },
      { path: "/employer/offers", icon: FileSignature, label: "Offers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/employer/formalities", icon: FileCheck, label: "Formalities" },
      { path: "/employer/contracts", icon: FileSignature, label: "Contracts" },
      { path: "/employer/contract-history", icon: History, label: "Contract History" },
    ],
  },
  {
    label: "Reports",
    items: [
      { path: "/employer/reports", icon: BarChart3, label: "Analytics" },
      { path: "/employer/messaging", icon: MessageSquare, label: "Messages" },
    ],
  },
];

export const employerProfileMenu = [
  { label: "My Account", icon: User, path: "/employer/profile" },
  { label: "Company Profile", icon: Building2, path: "/employer/company" },
];
