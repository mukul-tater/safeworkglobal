import { createPortalDrawer } from './PortalDrawer';
import { partnerNavItems } from '../config/navigation';
import type { PartnerStackParamList } from './types';
import { colors } from '../theme/colors';

import PartnerDashboardScreen from '../screens/partner/PartnerDashboardScreen';
import PartnerWorkersScreen from '../screens/partner/PartnerWorkersScreen';
import PartnerRegisterWorkerScreen from '../screens/partner/PartnerRegisterWorkerScreen';
import PartnerNotificationsScreen from '../screens/partner/PartnerNotificationsScreen';
import PartnerComplianceScreen from '../screens/partner/PartnerComplianceScreen';

const screens = {
  PartnerDashboard: PartnerDashboardScreen,
  PartnerWorkers: PartnerWorkersScreen,
  PartnerRegisterWorker: PartnerRegisterWorkerScreen,
  PartnerNotifications: PartnerNotificationsScreen,
  PartnerCompliance: PartnerComplianceScreen,
};

export default createPortalDrawer<PartnerStackParamList>(
  screens,
  partnerNavItems,
  'PartnerDashboard',
  colors.partner,
  colors.partnerLight,
);
