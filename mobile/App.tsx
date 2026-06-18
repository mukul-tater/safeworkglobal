import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.surface}
          translucent={Platform.OS === 'android'}
        />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});

export default App;
