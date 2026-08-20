import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Briefcase, ClipboardList, Home, Menu, PlusCircle } from 'lucide-react-native';
import type { EmployerStackParamList } from './types';
import { colors } from '../theme/colors';
import { createPortalDrawer } from './PortalDrawer';
import { employerNavItems } from '../config/navigation';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { LoadingView } from '../components/ui';

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
import EmployerComplianceScreen from '../screens/employer/EmployerComplianceScreen';
import EmployerReportsScreen from '../screens/employer/EmployerReportsScreen';
import EmployerMessagingScreen from '../screens/employer/EmployerMessagingScreen';
import EmployerOnboardingScreen from '../screens/employer/EmployerOnboardingScreen';
import EmployerTrustScreen from '../screens/employer/EmployerTrustScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<EmployerStackParamList>();

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
  EmployerCompliance: EmployerComplianceScreen,
  EmployerReports: EmployerReportsScreen,
  EmployerMessaging: EmployerMessagingScreen,
  EmployerOnboarding: EmployerOnboardingScreen,
  EmployerTrust: EmployerTrustScreen,
};

const MoreDrawer = createPortalDrawer<EmployerStackParamList>(
  screens,
  employerNavItems,
  'EmployerProfile',
  colors.employer,
  colors.employerLight,
);

function HiringStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EmployerApplications" component={EmployerApplicationsScreen} options={{ title: 'Applications' }} />
      <Stack.Screen name="EmployerShortlist" component={EmployerShortlistScreen} options={{ title: 'Shortlist' }} />
      <Stack.Screen name="EmployerInterviews" component={EmployerInterviewsScreen} options={{ title: 'Interviews' }} />
      <Stack.Screen name="EmployerOffers" component={EmployerOffersScreen} options={{ title: 'Offers' }} />
    </Stack.Navigator>
  );
}

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EmployerManageJobs" component={EmployerManageJobsScreen} options={{ title: 'Manage jobs' }} />
      <Stack.Screen name="EmployerPostJob" component={EmployerPostJobScreen} options={{ title: 'Post a job' }} />
    </Stack.Navigator>
  );
}

function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.employer,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tab.Screen
        name="EmployerHome"
        component={EmployerDashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="EmployerJobsTab"
        component={JobsStack}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="EmployerPostTab"
        component={EmployerPostJobScreen}
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="EmployerHiringTab"
        component={HiringStack}
        options={{
          title: 'Hiring',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="EmployerMoreTab"
        component={MoreDrawer}
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function EmployerNavigator() {
  const { profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile?.id) {
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from('employer_profiles')
        .select('onboarding_completed')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (!cancelled) {
        setNeedsOnboarding(!data?.onboarding_completed);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (!ready) return <LoadingView message="Loading employer portal..." />;
  if (needsOnboarding) return <EmployerOnboardingScreen />;
  return <EmployerTabs />;
}
