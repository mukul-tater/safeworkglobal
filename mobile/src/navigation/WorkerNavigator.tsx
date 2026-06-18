import { createPortalDrawer } from './PortalDrawer';
import { workerNavItems } from '../config/navigation';
import type { WorkerStackParamList } from './types';
import { colors } from '../theme/colors';

import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import WorkerVerificationScreen from '../screens/worker/WorkerVerificationScreen';
import JobsScreen from '../screens/public/JobsScreen';
import JobDetailScreen from '../screens/public/JobDetailScreen';
import WorkerSavedJobsScreen from '../screens/worker/WorkerSavedJobsScreen';
import WorkerSavedSearchesScreen from '../screens/worker/WorkerSavedSearchesScreen';
import WorkerApplicationsScreen from '../screens/worker/WorkerApplicationsScreen';
import WorkerApplicationTrackingScreen from '../screens/worker/WorkerApplicationTrackingScreen';
import WorkerInterviewsScreen from '../screens/worker/WorkerInterviewsScreen';
import WorkerCalendarScreen from '../screens/worker/WorkerCalendarScreen';
import WorkerOffersScreen from '../screens/worker/WorkerOffersScreen';
import WorkerTrainingScreen from '../screens/worker/WorkerTrainingScreen';
import WorkerContractsScreen from '../screens/worker/WorkerContractsScreen';
import WorkerContractHistoryScreen from '../screens/worker/WorkerContractHistoryScreen';
import WorkerTravelScreen from '../screens/worker/WorkerTravelScreen';
import WorkerInsuranceScreen from '../screens/worker/WorkerInsuranceScreen';
import WorkerPaymentsScreen from '../screens/worker/WorkerPaymentsScreen';
import WorkerDocumentsScreen from '../screens/worker/WorkerDocumentsScreen';
import WorkerMessagingScreen from '../screens/worker/WorkerMessagingScreen';
import WorkerNotificationsScreen from '../screens/worker/WorkerNotificationsScreen';
import WorkerOnboardingScreen from '../screens/worker/WorkerOnboardingScreen';
import WorkerTrustScreen from '../screens/worker/WorkerTrustScreen';

const screens = {
  WorkerDashboard: WorkerDashboardScreen,
  WorkerProfile: WorkerProfileScreen,
  WorkerVerification: WorkerVerificationScreen,
  Jobs: JobsScreen,
  JobDetail: JobDetailScreen,
  WorkerSavedJobs: WorkerSavedJobsScreen,
  WorkerSavedSearches: WorkerSavedSearchesScreen,
  WorkerApplications: WorkerApplicationsScreen,
  WorkerApplicationTracking: WorkerApplicationTrackingScreen,
  WorkerInterviews: WorkerInterviewsScreen,
  WorkerCalendar: WorkerCalendarScreen,
  WorkerOffers: WorkerOffersScreen,
  WorkerTraining: WorkerTrainingScreen,
  WorkerContracts: WorkerContractsScreen,
  WorkerContractHistory: WorkerContractHistoryScreen,
  WorkerTravel: WorkerTravelScreen,
  WorkerInsurance: WorkerInsuranceScreen,
  WorkerPayments: WorkerPaymentsScreen,
  WorkerDocuments: WorkerDocumentsScreen,
  WorkerMessaging: WorkerMessagingScreen,
  WorkerNotifications: WorkerNotificationsScreen,
  WorkerOnboarding: WorkerOnboardingScreen,
  WorkerTrust: WorkerTrustScreen,
};

export default createPortalDrawer<WorkerStackParamList>(
  screens,
  workerNavItems,
  'WorkerDashboard',
  colors.worker,
  colors.workerLight,
);
