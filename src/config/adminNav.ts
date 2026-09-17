import {
  LayoutDashboard, TrendingUp, Users, FileCheck, CreditCard, Plane, Shield,
  BarChart3, AlertTriangle, Mail, Store, HardHat, Building2, FileText, Briefcase, UserCog,
  MessageSquare, ShieldAlert, IndianRupee,
  ClipboardCheck, Wallet, BarChartBig, Network, BookOpen, PlusCircle, MapPin, Video, Wrench,
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
    label: "GCC Journey",
    defaultOpen: true,
    items: [
      { path: "/admin/journey-ops", icon: ClipboardCheck, label: "Worker queue" },
      { path: "/admin/interviews", icon: Video, label: "Conduct interviews" },
      { path: "/admin/trade-test-allocations", icon: MapPin, label: "Assign trade test" },
      { path: "/admin/trade-tests", icon: Wrench, label: "Conduct trade tests" },
      { path: "/admin/partners-v2?type=SSVN", icon: Store, label: "Trade test partners" },
    ],
  },
  {
    label: "LSP",
    defaultOpen: true,
    items: [
      { path: "/admin/lsps", icon: Network, label: "Rajasthan LSPs" },
      { path: "/admin/lsp-docs", icon: BookOpen, label: "LSP Developer Guide" },
    ],
  },
  {
    label: "People",
    defaultOpen: true,
    items: [
      { path: "/admin/users", icon: Users, label: "All Users" },
      { path: "/admin/workers", icon: HardHat, label: "Workers" },
      { path: "/admin/employers", icon: Building2, label: "Employers" },
      { path: "/admin/employer-access", icon: Shield, label: "Employer Access" },
      { path: "/admin/partners", icon: Store, label: "e-Mitra partners" },
      { path: "/admin/partner-workers", icon: UserCog, label: "E-Mitra Workers" },
      { path: "/admin/partner-rewards", icon: IndianRupee, label: "Partner Rewards" },
    ],
  },
  {
    label: "eMitra Operations",
    defaultOpen: true,
    items: [
      { path: "/admin/emitra/worker-review", icon: ClipboardCheck, label: "Worker Review" },
      { path: "/admin/emitra/withdrawals", icon: Wallet, label: "Withdrawals" },
      { path: "/admin/emitra/analytics", icon: BarChartBig, label: "Analytics & Settings" },
    ],
  },
  {
    label: "Jobs & Applications",
    defaultOpen: true,
    items: [
      { path: "/admin/jobs", icon: Briefcase, label: "All Jobs" },
      { path: "/admin/post-job", icon: PlusCircle, label: "Post a Job" },
      { path: "/admin/applications", icon: FileText, label: "Applications" },
    ],
  },
  {
    label: "Records",
    items: [
      { path: "/admin/quiz-cms", icon: BookOpen, label: "Quiz CMS (Test 1)" },
      { path: "/admin/document-verification", icon: FileCheck, label: "Documents" },
      { path: "/admin/id-verification", icon: CreditCard, label: "ID Verification" },
      { path: "/admin/ecr-management", icon: Plane, label: "ECR" },
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
