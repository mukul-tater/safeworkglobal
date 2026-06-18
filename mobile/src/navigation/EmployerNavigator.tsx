import { createPortalDrawer } from './PortalDrawer';
import { employerNavItems } from '../config/navigation';
import type { EmployerStackParamList } from './types';
import { colors } from '../theme/colors';
import { supabase } from '../integrations/supabase/client';

import EmployerDashboardScreen from '../screens/employer/EmployerDashboardScreen';
import EmployerProfileScreen from '../screens/employer/EmployerProfileScreen';
import EmployerCompanyScreen from '../screens/employer/EmployerCompanyScreen';
import EmployerPostJobScreen from '../screens/employer/EmployerPostJobScreen';
import EmployerManageJobsScreen from '../screens/employer/EmployerManageJobsScreen';
import EmployerSearchWorkersScreen from '../screens/employer/EmployerSearchWorkersScreen';
import EmployerSavedSearchesScreen from '../screens/employer/EmployerSavedSearchesScreen';
import EmployerApplicationsScreen from '../screens/employer/EmployerApplicationsScreen';
import EmployerShortlistScreen from '../screens/employer/EmployerShortlistScreen';
import EmployerInterviewsScreen from '../screens/employer/EmployerInterviewsScreen';
import EmployerOffersScreen from '../screens/employer/EmployerOffersScreen';
import EmployerFormalitiesScreen from '../screens/employer/EmployerFormalitiesScreen';
import EmployerContractsScreen from '../screens/employer/EmployerContractsScreen';
import EmployerContractHistoryScreen from '../screens/employer/EmployerContractHistoryScreen';
import EmployerEscrowScreen from '../screens/employer/EmployerEscrowScreen';
import EmployerComplianceScreen from '../screens/employer/EmployerComplianceScreen';
import EmployerReportsScreen from '../screens/employer/EmployerReportsScreen';
import EmployerMessagingScreen from '../screens/employer/EmployerMessagingScreen';
import EmployerOnboardingScreen from '../screens/employer/EmployerOnboardingScreen';
import EmployerTrustScreen from '../screens/employer/EmployerTrustScreen';

const screens = {
  EmployerDashboard: EmployerDashboardScreen,
  EmployerProfile: EmployerProfileScreen,
  EmployerCompany: EmployerCompanyScreen,
  EmployerPostJob: EmployerPostJobScreen,
  EmployerManageJobs: EmployerManageJobsScreen,
  EmployerSearchWorkers: EmployerSearchWorkersScreen,
  EmployerSavedSearches: EmployerSavedSearchesScreen,
  EmployerApplications: EmployerApplicationsScreen,
  EmployerShortlist: EmployerShortlistScreen,
  EmployerInterviews: EmployerInterviewsScreen,
  EmployerOffers: EmployerOffersScreen,
  EmployerFormalities: EmployerFormalitiesScreen,
  EmployerContracts: EmployerContractsScreen,
  EmployerContractHistory: EmployerContractHistoryScreen,
  EmployerEscrow: EmployerEscrowScreen,
  EmployerCompliance: EmployerComplianceScreen,
  EmployerReports: EmployerReportsScreen,
  EmployerMessaging: EmployerMessagingScreen,
  EmployerOnboarding: EmployerOnboardingScreen,
  EmployerTrust: EmployerTrustScreen,
};

export default createPortalDrawer<EmployerStackParamList>(
  screens,
  employerNavItems,
  'EmployerDashboard',
  colors.employer,
  colors.employerLight,
  {
    resolveInitialRoute: async (userId) => {
      const { data } = await supabase
        .from('employer_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.onboarding_completed ? 'EmployerDashboard' : 'EmployerOnboarding';
    },
  },
);
