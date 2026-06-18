import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavItem } from '../config/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Button, LoadingView } from '../components/ui';

type ScreenMap = Record<string, React.ComponentType<any>>;

export function createPortalDrawer<T extends Record<string, object | undefined>>(
  screens: ScreenMap,
  navItems: NavItem[],
  initialRoute: keyof T & string,
  accent: string,
  accentLight: string = colors.primaryLight,
  options?: {
    resolveInitialRoute?: (userId: string) => Promise<(keyof T & string) | null>;
  },
) {
  const Drawer = createDrawerNavigator<T>();

  function CustomDrawerContent(props: any) {
    const { logout, profile } = useAuth();
    const insets = useSafeAreaInsets();
    const grouped = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
      acc[item.group] = acc[item.group] ?? [];
      acc[item.group].push(item);
      return acc;
    }, {});

    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.drawer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View
          style={[
            styles.drawerHeader,
            { backgroundColor: accentLight, paddingTop: insets.top + spacing.lg },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: accent + '33' }]}>
            <Text style={[styles.avatarText, { color: accent }]}>
              {(profile?.full_name ?? profile?.email ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.drawerName}>{profile?.full_name ?? 'User'}</Text>
          <Text style={styles.drawerEmail}>{profile?.email}</Text>
        </View>

        {Object.entries(grouped).map(([group, items]) => (
          <View key={group}>
            <Text style={styles.groupLabel}>{group}</Text>
            {items.map((item) => (
              <DrawerItem
                key={item.name}
                label={item.label}
                onPress={() => props.navigation.navigate(item.name as never)}
                focused={props.state.routes[props.state.index]?.name === item.name}
                activeTintColor={accent}
                inactiveTintColor={colors.textMuted}
                activeBackgroundColor={accentLight}
                labelStyle={styles.drawerLabel}
                style={styles.drawerItem}
              />
            ))}
          </View>
        ))}

        <View style={styles.logoutWrap}>
          <Button title="Sign Out" variant="outline" onPress={() => logout()} />
        </View>
      </DrawerContentScrollView>
    );
  }

  return function PortalNavigator() {
    const { profile } = useAuth();
    const [resolvedRoute, setResolvedRoute] = React.useState<(keyof T & string) | null>(
      options?.resolveInitialRoute ? null : initialRoute,
    );

    React.useEffect(() => {
      if (!options?.resolveInitialRoute || !profile?.id) return;
      let cancelled = false;
      options.resolveInitialRoute(profile.id).then((route) => {
        if (!cancelled) setResolvedRoute(route ?? initialRoute);
      });
      return () => {
        cancelled = true;
      };
    }, [profile?.id]);

    if (!resolvedRoute) {
      return <LoadingView message="Loading portal..." />;
    }

    return (
      <Drawer.Navigator
        initialRouteName={resolvedRoute as never}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: colors.text,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          drawerActiveTintColor: accent,
          drawerInactiveTintColor: colors.textMuted,
        }}
      >
        {Object.entries(screens).map(([name, Component]) => (
          <Drawer.Screen
            key={name}
            name={name as never}
            component={Component}
            options={{
              title: navItems.find((n) => n.name === name)?.label ?? name,
            }}
          />
        ))}
      </Drawer.Navigator>
    );
  };
}

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: colors.background },
  drawerHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  drawerName: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  drawerEmail: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  drawerLabel: { fontSize: 15, fontWeight: '600', marginLeft: -8 },
  drawerItem: { marginHorizontal: spacing.sm, borderRadius: radius.md },
  logoutWrap: { margin: spacing.lg, marginTop: spacing.xxl },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontWeight: '700', fontSize: 17, color: colors.text },
});
