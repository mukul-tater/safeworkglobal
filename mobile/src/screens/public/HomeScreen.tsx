import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, Briefcase, FileCheck, HardHat, Search, Shield, Users, Wrench } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeroBanner from '../../components/HeroBanner';
import RoleCard from '../../components/RoleCard';
import ScreenLayout from '../../components/layout/ScreenLayout';
import type { PublicStackParamList } from '../../navigation/types';
import { HOME_TRADES } from '../../config/constants';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'Home'>;

const features = [
  { icon: Shield, label: 'No agent fees' },
  { icon: Briefcase, label: 'Verified employers' },
  { icon: BadgeCheck, label: 'Skill-tested profiles' },
];

const trustPoints = [
  {
    icon: BadgeCheck,
    title: 'Verified jobs only',
    description: 'Every employer and job listing is checked before it goes live.',
  },
  {
    icon: Wrench,
    title: 'Your skills, proven',
    description: 'Skill test, trade test, and medical checks build a profile employers can trust.',
  },
  {
    icon: FileCheck,
    title: 'Everything in writing',
    description: 'You see job terms, salary, and deductions in a written contract before you travel.',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    navigation.navigate('Jobs', {
      keyword: searchKeyword.trim() || undefined,
      country: 'UAE',
    });
  };

  const openPublic = (screen: 'About' | 'Contact' | 'Faq' | 'CountryInsights' | 'Privacy' | 'Terms') => {
    navigation.getParent()?.navigate(screen as never);
  };

  return (
    <ScreenLayout variant="tab" scrollable contentStyle={styles.content}>
      <HeroBanner
        title="Indian Skills. Global Opportunities."
        hindiTitle="🇮🇳 भारत का हुनर, दुनिया में पहचान।"
        values="Safe • Verified • Transparent • Compliant"
        subtitle="We verify your documents and skills, then connect you to overseas employers through licensed recruitment partners."
      >
        <Text style={styles.heroMeta}>Verified employers · Skill-tested profile · Licensed partner deployment</Text>
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
            <Text style={styles.statValue}>UAE</Text>
            <Text style={styles.statLabel}>Verified jobs</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Wrench size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>Skills</Text>
            <Text style={styles.statLabel}>Verified & trade-tested</Text>
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

      <SectionTitle
        title="We verify workers and their skills"
        subtitle="भारत का हुनर, दुनिया के अवसर।"
      />
      <View style={styles.tradeRow}>
        {HOME_TRADES.map((trade) => (
          <View key={trade.en} style={styles.tradeChip}>
            <Text style={styles.tradeEn}>{trade.en}</Text>
            <Text style={styles.tradeHi}>{trade.hi}</Text>
          </View>
        ))}
      </View>
      <Button
        title="Browse UAE jobs"
        variant="outline"
        fullWidth
        onPress={() => navigation.navigate('Jobs', { country: 'UAE' })}
      />

      <SectionTitle title="Get Started" subtitle="Choose your portal to continue" />

      <RoleCard
        title="Workers"
        description="Create a free profile, verify your skills, and get matched with verified Gulf employers."
        icon={<HardHat color={colors.worker} size={22} />}
        iconBg={colors.workerLight}
        actionLabel="Worker sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'worker' })}
      />
      <RoleCard
        title="Employers"
        description="Hire skill-tested, document-verified Indian workers — no large upfront recruiter fees."
        icon={<Briefcase color={colors.employer} size={22} />}
        iconBg={colors.employerLight}
        actionLabel="Employer sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'employer' })}
      />
      <RoleCard
        title="Partners"
        description="E-Mitra, ITI, licensed RA, and consultants — onboard verified workers from your centre."
        icon={<Users color={colors.partner} size={22} />}
        iconBg={colors.partnerLight}
        actionLabel="Partner sign in"
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'partner' })}
      />

      <SectionTitle title="Why SafeWork Global" subtitle="Replacing unsafe agents with a compliance-first platform" />
      {trustPoints.map((point) => {
        const Icon = point.icon;
        return (
          <Card key={point.title} elevated={false} style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <Icon size={18} color={colors.primary} />
            </View>
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>{point.title}</Text>
              <Text style={styles.trustDesc}>{point.description}</Text>
            </View>
          </Card>
        );
      })}

      <View style={styles.quickActions}>
        <Button title="Browse UAE Jobs" variant="outline" fullWidth onPress={() => navigation.navigate('Jobs', { country: 'UAE' })} />
        <Button
          title="Create Free Account"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
        />
        <View style={styles.legalRow}>
          <Pressable onPress={() => openPublic('About')}>
            <Text style={styles.legalLink}>About Us</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Faq')}>
            <Text style={styles.legalLink}>FAQ</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('CountryInsights')}>
            <Text style={styles.legalLink}>UAE Insights</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Contact')}>
            <Text style={styles.legalLink}>Contact</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Privacy')}>
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Terms')}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
        </View>
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
  tradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tradeChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tradeEn: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  tradeHi: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustCopy: { flex: 1 },
  trustTitle: { ...typography.h3 },
  trustDesc: { ...typography.bodySm, marginTop: 4 },
  quickActions: { gap: spacing.sm, marginTop: spacing.sm },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legalLink: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  legalDot: { color: colors.mutedForeground },
});
