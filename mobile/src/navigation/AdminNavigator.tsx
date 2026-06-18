import { createPortalDrawer } from './PortalDrawer';
import { adminNavItems } from '../config/navigation';
import type { AdminStackParamList } from './types';
import { colors } from '../theme/colors';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminInvestorDashboardScreen from '../screens/admin/AdminInvestorDashboardScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminWorkersScreen from '../screens/admin/AdminWorkersScreen';
import AdminEmployersScreen from '../screens/admin/AdminEmployersScreen';
import AdminPartnersScreen from '../screens/admin/AdminPartnersScreen';
import AdminPartnerWorkersScreen from '../screens/admin/AdminPartnerWorkersScreen';
import AdminJobsScreen from '../screens/admin/AdminJobsScreen';
import AdminApplicationsScreen from '../screens/admin/AdminApplicationsScreen';
import AdminJobVerificationScreen from '../screens/admin/AdminJobVerificationScreen';
import AdminDocumentVerificationScreen from '../screens/admin/AdminDocumentVerificationScreen';
import AdminIDVerificationScreen from '../screens/admin/AdminIDVerificationScreen';
import AdminECRManagementScreen from '../screens/admin/AdminECRManagementScreen';
import AdminComplianceScreen from '../screens/admin/AdminComplianceScreen';
import AdminDisputesScreen from '../screens/admin/AdminDisputesScreen';
import AdminContentModerationScreen from '../screens/admin/AdminContentModerationScreen';
import AdminMessagesScreen from '../screens/admin/AdminMessagesScreen';
import AdminContactSubmissionsScreen from '../screens/admin/AdminContactSubmissionsScreen';

const screens = {
  AdminDashboard: AdminDashboardScreen,
  AdminInvestorDashboard: AdminInvestorDashboardScreen,
  AdminReports: AdminReportsScreen,
  AdminUsers: AdminUsersScreen,
  AdminWorkers: AdminWorkersScreen,
  AdminEmployers: AdminEmployersScreen,
  AdminPartners: AdminPartnersScreen,
  AdminPartnerWorkers: AdminPartnerWorkersScreen,
  AdminJobs: AdminJobsScreen,
  AdminApplications: AdminApplicationsScreen,
  AdminJobVerification: AdminJobVerificationScreen,
  AdminDocumentVerification: AdminDocumentVerificationScreen,
  AdminIDVerification: AdminIDVerificationScreen,
  AdminECRManagement: AdminECRManagementScreen,
  AdminCompliance: AdminComplianceScreen,
  AdminDisputes: AdminDisputesScreen,
  AdminContentModeration: AdminContentModerationScreen,
  AdminMessages: AdminMessagesScreen,
  AdminContactSubmissions: AdminContactSubmissionsScreen,
};

export default createPortalDrawer<AdminStackParamList>(
  screens,
  adminNavItems,
  'AdminDashboard',
  colors.admin,
  colors.adminLight,
);
