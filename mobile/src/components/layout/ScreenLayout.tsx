import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import AppHeader from './AppHeader';

type ScreenLayoutProps = {
  children: React.ReactNode;
  /** Tab screens: top safe area + custom header. Stack screens: nav header handles top. */
  variant?: 'tab' | 'stack' | 'full' | 'modal';
  scrollable?: boolean;
  header?: boolean | { title?: string; subtitle?: string };
  keyboard?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
  showsVerticalScrollIndicator?: boolean;
};

export default function ScreenLayout({
  children,
  variant = 'tab',
  scrollable = false,
  header = false,
  keyboard = false,
  style,
  contentStyle,
  edges,
  showsVerticalScrollIndicator = false,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  const safeEdges: Edge[] =
    edges ??
    (variant === 'tab'
      ? ['left', 'right']
      : variant === 'stack'
        ? ['left', 'right', 'bottom']
        : variant === 'modal'
          ? ['top', 'left', 'right', 'bottom']
          : ['top', 'left', 'right', 'bottom']);

  const showHeader = header === true || (typeof header === 'object' && header !== null);
  const headerProps = typeof header === 'object' ? header : {};

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, contentStyle]}>{children}</View>
  );

  const wrappedBody = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 64 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.screen, style]} edges={safeEdges}>
      {variant === 'tab' && showHeader ? (
        <AppHeader title={headerProps.title} subtitle={headerProps.subtitle} />
      ) : null}
      {wrappedBody}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
});
