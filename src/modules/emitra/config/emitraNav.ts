import {
  LayoutDashboard, Users, UserPlus, IndianRupee, Bell, ShieldCheck, FileEdit, Wallet, ClipboardList,
} from 'lucide-react';
import type { NavGroup } from '@/components/layout/DashboardSidebar';

export const emitraNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    defaultOpen: true,
    items: [
      { path: '/emitra/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/emitra/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    label: 'Workers',
    defaultOpen: true,
    items: [
      { path: '/emitra/onboard-worker', icon: UserPlus, label: 'Onboard Worker' },
      { path: '/emitra/my-workers', icon: Users, label: 'My Workers' },
    ],
  },
  {
    label: 'Earnings',
    defaultOpen: true,
    items: [
      { path: '/emitra/rewards', icon: Wallet, label: 'Rewards & Earnings' },
      { path: '/emitra/withdrawals', icon: ClipboardList, label: 'Withdrawals' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/emitra/compliance', icon: ShieldCheck, label: 'Compliance' },
      { path: '/partner/onboarding', icon: FileEdit, label: 'My Application' },
    ],
  },
];

export const emitraProfileMenu = [
  { label: 'My Application', icon: FileEdit, path: '/partner/onboarding' },
  { label: 'Compliance', icon: ShieldCheck, path: '/emitra/compliance' },
];
