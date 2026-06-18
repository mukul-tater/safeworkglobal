import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, User } from 'lucide-react-native';
import type { PublicStackParamList } from './types';
import HomeScreen from '../screens/public/HomeScreen';
import JobsScreen from '../screens/public/JobsScreen';
import JobDetailScreen from '../screens/public/JobDetailScreen';
import AuthScreen from '../screens/public/AuthScreen';
import { InfoScreen } from '../components/DataListScreen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<PublicStackParamList>();

function AboutScreen() {
  return (
    <InfoScreen
      title="About SafeWork Global"
      description="SafeWork Global connects verified workers with trusted international employers through compliance-first hiring."
      variant="stack"
    />
  );
}

function ContactScreen() {
  return (
    <InfoScreen
      title="Contact Us"
      description="Reach our support team for help with applications, compliance, and account issues."
      variant="stack"
    />
  );
}

function PrivacyScreen() {
  return (
    <InfoScreen
      title="Privacy Policy"
      description="We protect your personal data and only share it for verified hiring workflows."
      variant="stack"
    />
  );
}

function TermsScreen() {
  return (
    <InfoScreen
      title="Terms of Service"
      description="By using SafeWork Global you agree to our platform terms and compliance policies."
      variant="stack"
    />
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabHeight = 56 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: Math.max(insets.bottom, spacing.sm),
          },
        ],
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen as React.ComponentType<any>}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen as React.ComponentType<any>}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <Search color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tab.Screen
        name="Auth"
        component={AuthScreen as React.ComponentType<any>}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size, focused }) => (
            <User color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function PublicNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.stackHeader,
        headerTintColor: colors.primary,
        headerTitleStyle: styles.stackTitle,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  stackHeader: {
    backgroundColor: colors.surface,
  },
  stackTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: colors.text,
  },
});
