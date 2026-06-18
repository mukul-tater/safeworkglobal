import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenLayout from '../layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  header?: boolean | { title?: string; subtitle?: string };
  keyboard?: boolean;
  variant?: 'tab' | 'stack' | 'full' | 'modal';
};

/** @deprecated Prefer ScreenLayout directly for new screens */
export function ScreenContainer({
  children,
  style,
  scrollable,
  header,
  keyboard,
  variant = 'tab',
}: ScreenContainerProps) {
  return (
    <ScreenLayout
      variant={variant}
      scrollable={scrollable}
      header={header}
      keyboard={keyboard}
      style={style}
    >
      {children}
    </ScreenLayout>
  );
}

export function Card({
  children,
  style,
  elevated = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}) {
  return <View style={[styles.card, elevated && shadows.sm, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  size = 'md',
  fullWidth,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const variantStyle =
    variant === 'secondary'
      ? styles.btnSecondary
      : variant === 'outline'
        ? styles.btnOutline
        : variant === 'destructive'
          ? styles.btnDestructive
          : variant === 'ghost'
            ? styles.btnGhost
            : styles.btnPrimary;

  const textStyle =
    variant === 'primary' || variant === 'destructive'
      ? styles.btnTextLight
      : variant === 'secondary'
        ? styles.btnTextPrimary
        : styles.btnTextDark;

  const sizeStyle = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        sizeStyle,
        fullWidth && styles.btnFull,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.btnText, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  icon,
  compact,
  ...props
}: TextInputProps & { label?: string; error?: string; icon?: React.ReactNode; compact?: boolean }) {
  return (
    <View style={[styles.inputWrap, compact && styles.inputWrapCompact]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          placeholderTextColor={colors.textLight}
          style={styles.input}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Badge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'primary' | 'info' | 'secondary';
}) {
  const toneStyle =
    tone === 'success'
      ? styles.badgeSuccess
      : tone === 'warning'
        ? styles.badgeWarning
        : tone === 'primary'
          ? styles.badgePrimary
          : tone === 'info'
            ? styles.badgeInfo
            : tone === 'secondary'
              ? styles.badgeSecondary
              : styles.badgeDefault;

  const textStyle =
    tone === 'default' ? styles.badgeTextDark : styles.badgeTextColored;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <SafeAreaView style={styles.loadingScreen} edges={['top', 'bottom', 'left', 'right']}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{message}</Text>
    </SafeAreaView>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function IconCircle({
  children,
  color = colors.primaryLight,
  size = 48,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {children}
    </View>
  );
}

export function StatCard({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: string;
}) {
  return (
    <Card style={styles.statCard} elevated={false}>
      {accent ? <View style={[styles.statAccent, { backgroundColor: accent }]} /> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function TrustPill({ label }: { label: string }) {
  return (
    <View style={styles.trustPill}>
      <Text style={styles.trustPillText}>{label}</Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmentTrack}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: { paddingVertical: 10, paddingHorizontal: spacing.md },
  btnLg: { paddingVertical: 15, paddingHorizontal: spacing.xl },
  btnFull: { alignSelf: 'stretch', width: '100%' },
  btnPrimary: { backgroundColor: colors.primaryHover },
  btnSecondary: { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
  btnOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnDestructive: { backgroundColor: colors.destructive },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnText: { ...typography.button },
  btnTextLight: { color: colors.primaryForeground },
  btnTextPrimary: { color: colors.foreground },
  btnTextDark: { color: colors.text },
  inputWrap: { marginBottom: spacing.lg },
  inputWrapCompact: { marginBottom: 0 },
  label: { ...typography.label, marginBottom: spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.destructive },
  errorText: { color: colors.destructive, fontSize: 12, marginTop: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDefault: { backgroundColor: colors.muted },
  badgeSuccess: { backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.successBorder },
  badgeWarning: { backgroundColor: colors.warningLight },
  badgePrimary: { backgroundColor: colors.primaryTintMedium, borderWidth: 1, borderColor: colors.primaryMuted },
  badgeInfo: { backgroundColor: colors.infoLight },
  badgeSecondary: { backgroundColor: colors.secondaryTint },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextDark: { color: colors.mutedForeground },
  badgeTextColored: { color: colors.foreground },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
  },
  muted: { ...typography.bodySm },
  emptyTitle: { ...typography.h2 },
  sectionHeader: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h2 },
  sectionSubtitle: { ...typography.bodySm, marginTop: spacing.xs },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, marginBottom: 0, overflow: 'hidden' },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.55,
  },
  statValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: colors.foreground },
  statLabel: { ...typography.caption, marginTop: spacing.xs, textAlign: 'center' },
  trustPill: {
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustPillText: { color: colors.mutedForeground, fontSize: 12, fontWeight: '500' },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  segmentTextActive: {
    color: colors.foreground,
  },
});
