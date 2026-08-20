import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, SectionTitle } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'CountryInsights'>;

const SECTORS = ['Construction', 'MEP / Electrical', 'Hospitality', 'Logistics'];
const BEFORE_YOU_GO = [
  'Confirm employer name, job title, and basic salary in writing',
  'A valid passport is required for emigration and travel — not for the trade test',
  'Ask about accommodation, food, overtime, and medical insurance',
  'Verify the recruitment agent on the official eMigrate portal',
];

export default function CountryInsightsScreen({ navigation }: Props) {
  return (
    <ScreenLayout variant="stack" scrollable>
      <SectionTitle title="Explore your destination" subtitle="अपना रोजगार गंतव्य जानें" />
      <Card>
        <Text style={styles.flag}>🇦🇪 UAE</Text>
        <Text style={styles.hi}>संयुक्त अरब अमीरात</Text>
        <Text style={styles.body}>
          Know the country, understand the work, and learn about living conditions before you travel.
        </Text>
        <Text style={styles.muted}>
          विदेश जाने से पहले देश, काम और रहने की वास्तविक परिस्थितियों को समझें।
        </Text>
      </Card>

      <SectionTitle title="Work sectors" />
      <View style={styles.chips}>
        {SECTORS.map((s) => (
          <View key={s} style={styles.chip}>
            <Text style={styles.chipText}>{s}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Before you go" subtitle="जाने से पहले" />
      {BEFORE_YOU_GO.map((item) => (
        <Card key={item} elevated={false}>
          <Text style={styles.body}>• {item}</Text>
        </Card>
      ))}

      <Button
        title="Browse UAE jobs"
        onPress={() =>
          navigation.navigate('Home', { screen: 'Jobs', params: { country: 'UAE' } } as never)
        }
        fullWidth
      />
      <View style={{ height: spacing.sm }} />
      <Button title="Read FAQ" variant="outline" onPress={() => navigation.navigate('Faq')} fullWidth />
      <View style={{ height: spacing.sm }} />
      <Pressable onPress={() => navigation.navigate('Contact')}>
        <Text style={styles.link}>Questions? Contact us</Text>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flag: { ...typography.h2 },
  hi: { ...typography.bodySm, color: colors.primary, marginTop: 4, marginBottom: spacing.md },
  body: { ...typography.body },
  muted: { ...typography.bodySm, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.bodySm, fontWeight: '600' },
  link: { ...typography.bodySm, color: colors.primary, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});
