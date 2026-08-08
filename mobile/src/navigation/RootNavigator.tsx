import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import BindMobileScreen from '../screens/public/BindMobileScreen';
import { LoadingView } from '../components/ui';
import { ENV } from '../config/env';
import { navigationTheme } from '../theme/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const linking = {
  prefixes: ['safeworkglobal://', 'https://safeworkglobal.com', 'https://www.safeworkglobal.com'],
  config: {
    screens: {
      Public: {
        screens: {
          Home: '',
          Jobs: 'jobs',
          JobDetail: 'jobs/:jobId',
          Auth: 'auth',
        },
      },
      WorkerApp: 'worker',
      EmployerApp: 'employer',
      PartnerApp: 'partner',
      AdminApp: 'admin',
    },
  },
};

function ConfigErrorScreen() {
  return (
    <View style={styles.configWrap}>
      <Text style={styles.configTitle}>App not configured</Text>
      <Text style={styles.configBody}>
        Missing SUPABASE_URL / SUPABASE_ANON_KEY. Copy mobile/.env.example to mobile/.env, fill values,
        then restart Metro.
      </Text>
    </View>
  );
}

function AppNavigation() {
  const {
    isAuthenticated,
    role,
    loading,
    profileLoading,
    needsRoleSelection,
    isMobileVerified,
  } = useAuth();

  if (!ENV.isConfigured) {
    return <ConfigErrorScreen />;
  }

  const needsBindMobile =
    isAuthenticated &&
    !needsRoleSelection &&
    role === 'worker' &&
    !isMobileVerified;

  const navKey = !isAuthenticated
    ? 'public'
    : needsRoleSelection
      ? 'role-select'
      : needsBindMobile
        ? 'bind-mobile'
        : role ?? 'unknown';

  if (loading || (isAuthenticated && profileLoading)) {
    return <LoadingView message="Starting SafeWork Global..." />;
  }

  return (
    <NavigationContainer
      key={navKey}
      theme={navigationTheme}
      linking={linking as any}
      fallback={<LoadingView message="Opening link..." />}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Public" component={PublicNavigator} />
        ) : needsRoleSelection ? (
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        ) : needsBindMobile ? (
          <Stack.Screen name="BindMobile" component={BindMobileScreen} />
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

const styles = StyleSheet.create({
  configWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  configTitle: { ...typography.h2, marginBottom: spacing.sm },
  configBody: { ...typography.body, color: colors.mutedForeground },
});
