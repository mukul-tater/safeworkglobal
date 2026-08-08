import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const NetworkContext = createContext({ isOnline: true });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsub();
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {!isOnline ? (
        <View style={[styles.banner, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <Text style={styles.bannerText}>You are offline. Some features may not work.</Text>
        </View>
      ) : null}
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning ?? '#B45309',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bannerText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 13 },
});
