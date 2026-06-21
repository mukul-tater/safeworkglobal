import {
  LayoutDashboard, TrendingUp, Users, FileCheck, CreditCard, Plane, CheckCircle, Shield,
  BarChart3, AlertTriangle, Mail, Store, HardHat, Building2, FileText, Briefcase, UserCog,
  MessageSquare, ShieldAlert, IndianRupee,
} from "lucide-react";
import type { NavGroup } from "@/components/layout/DashboardSidebar";

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/investor-dashboard", icon: TrendingUp, label: "Investor Dashboard" },
      { path: "/admin/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    label: "People",
    defaultOpen: true,
    items: [
      { path: "/admin/users", icon: Users, label: "All Users" },
      { path: "/admin/workers", icon: HardHat, label: "Workers" },
      { path: "/admin/employers", icon: Building2, label: "Employers" },
      { path: "/admin/partners", icon: Store, label: "Partners" },
      { path: "/admin/partner-workers", icon: UserCog, label: "E-Mitra Workers" },
      { path: "/admin/partner-rewards", icon: IndianRupee, label: "Partner Rewards" },
    ],
  },
  {
    label: "Jobs & Applications",
    defaultOpen: true,
    items: [
      { path: "/admin/jobs", icon: Briefcase, label: "All Jobs" },
      { path: "/admin/applications", icon: FileText, label: "Applications" },
      { path: "/admin/job-verification", icon: CheckCircle, label: "Job Verification" },
    ],
  },
  {
    label: "Verification",
    items: [
      { path: "/admin/document-verification", icon: FileCheck, label: "Documents" },
      { path: "/admin/id-verification", icon: CreditCard, label: "ID Verification" },
      { path: "/admin/ecr-management", icon: Plane, label: "ECR Management" },
      { path: "/admin/compliance", icon: Shield, label: "Compliance" },
    ],
  },
  {
    label: "Support & Moderation",
    items: [
      { path: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
      { path: "/admin/content-moderation", icon: ShieldAlert, label: "Content Moderation" },
      { path: "/admin/messages", icon: MessageSquare, label: "Messages" },
      { path: "/admin/contact-submissions", icon: Mail, label: "Contact Submissions" },
    ],
  },
];

export const adminProfileMenu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
];
