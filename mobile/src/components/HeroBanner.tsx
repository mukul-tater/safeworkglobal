import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
  highlight?: string;
};

export default function HeroBanner({
  title,
  subtitle,
  children,
  style,
  compact,
  highlight,
}: HeroBannerProps) {
  const titleParts = highlight && title.includes(highlight)
    ? title.split(highlight)
    : null;

  return (
    <View style={[styles.hero, compact && styles.heroCompact, style]}>
      <View style={styles.blobPrimary} />
      <View style={styles.blobInfo} />
      <View style={styles.inner}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>SafeWork Global</Text>
        </View>

        {titleParts ? (
          <Text style={styles.title}>
            {titleParts[0]}
            <Text style={styles.titleAccent}>{highlight}</Text>
            {titleParts[1]}
          </Text>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}

        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  heroCompact: { marginBottom: spacing.md },
  inner: { padding: spacing.xl, zIndex: 1 },
  blobPrimary: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryTint,
  },
  blobInfo: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.infoTint,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
    fontSize: 26,
    lineHeight: 32,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedForeground,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
