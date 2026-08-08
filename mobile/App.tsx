import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkProvider } from './src/contexts/NetworkContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <NetworkProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.surface}
              translucent={Platform.OS === 'android'}
            />
            <RootNavigator />
          </NetworkProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});

export default App;
