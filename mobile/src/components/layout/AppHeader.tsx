import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Shield color={colors.primary} size={size * 0.48} />
    </View>
  );
}

export default function AppHeader({
  title = 'SafeWork Global',
  subtitle,
  showLogo = true,
  right,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }, style]}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          {showLogo ? <BrandLogo /> : null}
          <View style={styles.brandText}>
            <Text style={styles.brandName}>{title}</Text>
            {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  logo: {
    backgroundColor: colors.primaryTintMedium,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    ...typography.caption,
    marginTop: 1,
    color: colors.mutedForeground,
  },
});
