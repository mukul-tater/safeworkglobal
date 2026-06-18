import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Briefcase, Globe, HardHat, Search, Shield, Users } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeroBanner from '../../components/HeroBanner';
import RoleCard from '../../components/RoleCard';
import ScreenLayout from '../../components/layout/ScreenLayout';
import type { PublicStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'Home'>;

const features = [
  { icon: Shield, label: 'No agent fees' },
  { icon: Briefcase, label: 'Verified employers' },
  { icon: Globe, label: '50+ countries' },
];

export default function HomeScreen({ navigation }: Props) {
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    navigation.navigate('Jobs', {
      keyword: searchKeyword.trim() || undefined,
    });
  };

  return (
    <ScreenLayout variant="tab" scrollable contentStyle={styles.content}>
      <HeroBanner
        title="Find Verified Jobs Abroad"
        highlight="Jobs Abroad"
        subtitle="Verified employers, salary protection, and zero agent fees — only standard government charges apply."
      >
        <Text style={styles.heroMeta}>1000+ verified jobs · 50+ countries</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Input
              compact
              placeholder="Search jobs, skills, location..."
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              icon={<Search size={18} color={colors.textMuted} />}
            />
          </View>
          <View style={styles.searchBtn}>
            <Button title="Go" onPress={handleSearch} size="sm" />
          </View>
        </View>
      </HeroBanner>

      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Briefcase size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>Verified jobs</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Globe size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuresRow}>
        {features.map(({ icon: Icon, label }) => (
          <View key={label} style={styles.featureChip}>
            <Icon size={14} color={colors.mutedForeground} />
            <Text style={styles.featureText}>{label}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Get Started" subtitle="Choose your portal to continue" />

      <RoleCard
        title="Workers"
        description="Browse verified jobs, apply, and track your journey abroad."
        icon={<HardHat color={colors.worker} size={22} />}
        iconBg={colors.workerLight}
        actionLabel="Worker sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'worker' })}
      />
      <RoleCard
        title="Employers"
        description="Post jobs, review applications, and hire globally."
        icon={<Briefcase color={colors.employer} size={22} />}
        iconBg={colors.employerLight}
        actionLabel="Employer sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'employer' })}
      />
      <RoleCard
        title="E-Mitra Partners"
        description="Register workers and manage compliance from your center."
        icon={<Users color={colors.partner} size={22} />}
        iconBg={colors.partnerLight}
        actionLabel="Partner sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'partner' })}
      />

      <Card elevated style={styles.protectionCard}>
        <View style={styles.protectionIcon}>
          <Shield color={colors.primary} size={24} />
        </View>
        <View style={styles.protectionContent}>
          <Text style={styles.protectionTitle}>Salary Protection Promise</Text>
          <Text style={styles.protectionDesc}>
            Verified employers, escrow payments, and dedicated dispute support for every placement.
          </Text>
        </View>
      </Card>

      <View style={styles.quickActions}>
        <Button title="Browse All Jobs" variant="outline" fullWidth onPress={() => navigation.navigate('Jobs')} />
        <Button
          title="Create Free Account"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  heroMeta: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchField: { flex: 1 },
  searchBtn: {
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  statLabel: { ...typography.caption },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  protectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectionContent: { flex: 1 },
  protectionTitle: { ...typography.h3 },
  protectionDesc: { ...typography.bodySm, marginTop: spacing.xs },
  quickActions: { gap: spacing.sm },
});
