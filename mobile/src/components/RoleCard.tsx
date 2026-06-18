import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type RoleCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  actionLabel?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export default function RoleCard({
  title,
  description,
  icon,
  iconBg,
  actionLabel = 'Continue',
  onPress,
  style,
}: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
        <Text style={styles.action}>{actionLabel}</Text>
      </View>
      <ChevronRight size={18} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  desc: { ...typography.caption, marginTop: 2 },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
