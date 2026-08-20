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
import { useI18n } from '../../i18n';

type Props = NativeStackScreenProps<PublicStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [searchKeyword, setSearchKeyword] = useState('');

  const features = [
    { icon: Shield, label: t('home.noAgentFees') },
    { icon: Briefcase, label: t('home.verifiedEmployers') },
    { icon: BadgeCheck, label: t('home.skillTested') },
  ];

  const trustPoints = [
    { icon: BadgeCheck, title: t('home.t1'), description: t('home.t1d') },
    { icon: Wrench, title: t('home.t2'), description: t('home.t2d') },
    { icon: FileCheck, title: t('home.t4'), description: t('home.t4d') },
  ];

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
        title={`${t('hero.title1')} ${t('hero.title2')}`}
        hindiTitle={t('hero.title3')}
        values={t('hero.values')}
        subtitle={t('hero.body')}
      >
        <Text style={styles.heroMeta}>{t('hero.trust')}</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Input
              compact
              placeholder={t('hero.searchPlaceholder')}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              icon={<Search size={18} color={colors.textMuted} />}
            />
          </View>
          <View style={styles.searchBtn}>
            <Button title={t('hero.go')} onPress={handleSearch} size="sm" />
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
            <Text style={styles.statLabel}>{t('home.verifiedJobs')}</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Wrench size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>{t('home.skills')}</Text>
            <Text style={styles.statLabel}>{t('home.skillsSub')}</Text>
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
        title={t('home.verifyTitle')}
        subtitle={t('home.verifySub')}
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
        title={t('home.browseUae')}
        variant="outline"
        fullWidth
        onPress={() => navigation.navigate('Jobs', { country: 'UAE' })}
      />

      <SectionTitle title={t('home.getStarted')} subtitle={t('home.choosePortal')} />

      <RoleCard
        title={t('home.workers')}
        description={t('home.workersDesc')}
        icon={<HardHat color={colors.worker} size={22} />}
        iconBg={colors.workerLight}
        actionLabel={t('home.workerSignIn')}
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'worker' })}
      />
      <RoleCard
        title={t('home.employers')}
        description={t('home.employersDesc')}
        icon={<Briefcase color={colors.employer} size={22} />}
        iconBg={colors.employerLight}
        actionLabel={t('home.employerSignIn')}
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'employer' })}
      />
      <RoleCard
        title={t('home.partners')}
        description={t('home.partnersDesc')}
        icon={<Users color={colors.partner} size={22} />}
        iconBg={colors.partnerLight}
        actionLabel={t('home.partnerSignIn')}
        onPress={() => navigation.navigate('Auth', { mode: 'login', role: 'partner' })}
      />

      <SectionTitle title={t('home.why')} subtitle={t('home.whySub')} />
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
        <Button title={t('home.browseUae')} variant="outline" fullWidth onPress={() => navigation.navigate('Jobs', { country: 'UAE' })} />
        <Button
          title={t('home.createAccount')}
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
        />
        <View style={styles.legalRow}>
          <Pressable onPress={() => openPublic('About')}>
            <Text style={styles.legalLink}>{t('nav.about')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Faq')}>
            <Text style={styles.legalLink}>{t('nav.faq')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('CountryInsights')}>
            <Text style={styles.legalLink}>{t('nav.insights')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Contact')}>
            <Text style={styles.legalLink}>{t('nav.contact')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Privacy')}>
            <Text style={styles.legalLink}>{t('nav.privacy')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => openPublic('Terms')}>
            <Text style={styles.legalLink}>{t('nav.terms')}</Text>
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
