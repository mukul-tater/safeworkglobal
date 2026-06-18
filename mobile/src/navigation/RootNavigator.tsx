import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from './types';
import PublicNavigator from './PublicNavigator';
import WorkerNavigator from './WorkerNavigator';
import EmployerNavigator from './EmployerNavigator';
import AdminNavigator from './AdminNavigator';
import PartnerNavigator from './PartnerNavigator';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import { LoadingView } from '../components/ui';
import { navigationTheme } from '../theme/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function AppNavigation() {
  const { isAuthenticated, role, loading, profileLoading, needsRoleSelection } = useAuth();

  const navKey = !isAuthenticated
    ? 'public'
    : needsRoleSelection
      ? 'role-select'
      : role ?? 'unknown';

  if (loading || (isAuthenticated && profileLoading)) {
    return <LoadingView message="Starting SafeWork Global..." />;
  }

  return (
    <NavigationContainer key={navKey} theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Public" component={PublicNavigator} />
        ) : needsRoleSelection ? (
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        ) : role === 'worker' ? (
          <Stack.Screen name="WorkerApp" component={WorkerNavigator} />
        ) : role === 'employer' ? (
          <Stack.Screen name="EmployerApp" component={EmployerNavigator} />
        ) : role === 'admin' ? (
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        ) : role === 'partner' ? (
          <Stack.Screen name="PartnerApp" component={PartnerNavigator} />
        ) : (
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}
