import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Briefcase, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { formatRelativeDate, formatSalaryLakh } from '../lib/utils';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Badge } from './ui';

export type JobListItem = {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  country: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  experience_level: string | null;
  job_type: string | null;
  created_at: string | null;
};

type JobListCardProps = {
  job: JobListItem;
  onPress: () => void;
};

export default function JobListCard({ job, onPress }: JobListCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Briefcase size={18} color={colors.primary} />
        </View>
        <View style={styles.main}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.mutedForeground} />
            <Text style={styles.location} numberOfLines={1}>
              {job.location}, {job.country}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.textLight} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.salary}>
          {formatSalaryLakh(job.salary_min, job.salary_max, job.currency)}
        </Text>
        {job.created_at ? (
          <View style={styles.dateRow}>
            <Clock size={12} color={colors.textLight} />
            <Text style={styles.date}>{formatRelativeDate(job.created_at)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.badges}>
        {job.experience_level ? <Badge label={job.experience_level} tone="primary" /> : null}
        {job.job_type ? <Badge label={job.job_type} tone="success" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  pressed: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  title: { ...typography.h3, lineHeight: 22 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: { ...typography.caption, flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  salary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: { ...typography.caption },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
