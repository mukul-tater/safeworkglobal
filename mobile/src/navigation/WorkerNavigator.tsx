import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Briefcase,
  ClipboardList,
  Home,
  Menu,
  ShieldCheck,
} from 'lucide-react-native';
import type { WorkerStackParamList, WorkerTabParamList } from './types';
import { colors } from '../theme/colors';
import { createPortalDrawer } from './PortalDrawer';
import { workerNavItems } from '../config/navigation';

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

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

const moreScreens = {
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

const MoreDrawer = createPortalDrawer<WorkerStackParamList>(
  moreScreens,
  workerNavItems,
  'WorkerProfile',
  colors.worker,
  colors.workerLight,
);

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Jobs" component={JobsScreen} options={{ title: 'Jobs' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job details' }} />
    </Stack.Navigator>
  );
}

function ApplicationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="WorkerApplications"
        component={WorkerApplicationsScreen}
        options={{ title: 'Applications' }}
      />
      <Stack.Screen
        name="WorkerApplicationTracking"
        component={WorkerApplicationTrackingScreen}
        options={{ title: 'Track applications' }}
      />
      <Stack.Screen
        name="WorkerInterviews"
        component={WorkerInterviewsScreen}
        options={{ title: 'Interviews' }}
      />
      <Stack.Screen
        name="WorkerOffers"
        component={WorkerOffersScreen}
        options={{ title: 'Offers' }}
      />
    </Stack.Navigator>
  );
}

export default function WorkerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.worker,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={WorkerDashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobsStack}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="JourneyTab"
        component={WorkerVerificationScreen}
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ApplicationsTab"
        component={ApplicationsStack}
        options={{
          title: 'Apply',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreDrawer}
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
