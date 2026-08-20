import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RA_DISCLOSURE, RECRUITMENT_PARTNER, SAFEWORK_CONTACT } from '../../config/workerSupport';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Card, SectionTitle } from '../../components/ui';
import { useI18n } from '../../i18n';

const PRINCIPLES = [
  'Skill-first, not CV-first',
  'Transparent pathway from India to overseas work',
  'Verification by SafeWork, deployment by licensed partners',
  'No large upfront agent commissions',
];

export default function AboutScreen() {
  const { t } = useI18n();
  return (
    <ScreenLayout variant="stack" scrollable>
      <SectionTitle title={t('about.title')} subtitle={t('nav.about')} />
      <Card>
        <Text style={styles.hindiHero}>भारत का हुनर, दुनिया के रोज़गार।</Text>
        <Text style={styles.englishHero}>Indian Skills. Global Opportunities.</Text>
        <Text style={styles.kicker}>India's Workforce Mobility Infrastructure</Text>
        <Text style={styles.body}>
          SafeWork Global is a technology and workforce mobility platform built to connect India's
          skilled workforce with trusted global employment opportunities through a structured,
          transparent and skill-first ecosystem.
        </Text>
        <Text style={styles.body}>
          We believe skilled electricians, plumbers, welders, fitters, HVAC technicians, drivers,
          construction workers and other professionals should have a transparent pathway to global
          employment.
        </Text>
      </Card>

      <SectionTitle title="What we do" subtitle="हम क्या करते हैं" />
      <Card elevated={false}>
        <Text style={styles.body}>
          We verify worker documents and skills, then connect verified profiles with overseas
          employers. Visa, emigration, and travel are handled by licensed recruitment partners.
        </Text>
      </Card>

      <SectionTitle title="Our principles" subtitle="हमारे सिद्धांत" />
      {PRINCIPLES.map((item) => (
        <Card key={item} elevated={false}>
          <Text style={styles.bullet}>• {item}</Text>
        </Card>
      ))}

      <SectionTitle title="Licensed recruitment partner" />
      <Card>
        <Text style={styles.partnerName}>{RECRUITMENT_PARTNER.name}</Text>
        <Text style={styles.muted}>{RECRUITMENT_PARTNER.designation}</Text>
        <Text style={styles.muted}>RC No. {RECRUITMENT_PARTNER.rcNo}</Text>
        <Text style={[styles.body, styles.topGap]}>{RA_DISCLOSURE}</Text>
      </Card>

      <Pressable onPress={() => Linking.openURL(SAFEWORK_CONTACT.websiteUrl)}>
        <Text style={styles.link}>{SAFEWORK_CONTACT.websiteDisplay}</Text>
      </Pressable>
      <View style={{ height: spacing.lg }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hindiHero: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.foreground,
  },
  englishHero: {
    ...typography.h3,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  body: { ...typography.body },
  bullet: { ...typography.body },
  partnerName: { ...typography.h3 },
  muted: { ...typography.bodySm, marginTop: 4 },
  topGap: { marginTop: spacing.md },
  link: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
