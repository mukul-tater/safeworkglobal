import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FAQ_GROUPS, type FaqEntry } from '../../config/faqContent';
import {
  EMIGRATE_PORTAL_URL,
  RECRUITMENT_PARTNER,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from '../../config/workerSupport';
import type { PublicStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';
import { useI18n } from '../../i18n';

type Props = NativeStackScreenProps<PublicStackParamList, 'Faq'>;

function matchesQuery(item: FaqEntry, query: string) {
  if (!query) return true;
  const haystack = [item.qEn, item.qHi, item.aEn, item.aHi, ...(item.bulletsEn ?? [])].join(' ').toLowerCase();
  return haystack.includes(query);
}

function FaqItemCard({ item }: { item: FaqEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={styles.item}>
      <View style={styles.itemHead}>
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{String(item.n).padStart(2, '0')}</Text>
        </View>
        <View style={styles.itemCopy}>
          <Text style={styles.qEn}>{item.qEn}</Text>
          <Text style={styles.qHi}>{item.qHi}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '–' : '+'}</Text>
      </View>
      {open ? (
        <View style={styles.answer}>
          <Text style={styles.aEn}>{item.aEn}</Text>
          {item.bulletsEn?.length ? (
            <View style={styles.bullets}>
              {item.bulletsEn.map((b) => (
                <View key={b} style={styles.bulletChip}>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.aHi}>{item.aHi}</Text>
          {item.extra === 'vesta-ra' ? (
            <View style={styles.raBox}>
              <Text style={styles.raKicker}>Overseas recruitment through</Text>
              <Text style={styles.raName}>{RECRUITMENT_PARTNER.name}</Text>
              <Text style={styles.muted}>{RECRUITMENT_PARTNER.designation}</Text>
              <Text style={styles.muted}>RC No. {RECRUITMENT_PARTNER.rcNo}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function FaqScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState(FAQ_GROUPS[0]?.id ?? 'workers');
  const normalized = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const groups = FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesQuery(item, normalized)),
    })).filter((group) => group.items.length > 0);
    return groups;
  }, [normalized]);

  const visible = normalized
    ? filteredGroups
    : filteredGroups.filter((g) => g.id === topic);

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle
        title={t('faq.title')}
        subtitle="श्रमिकों के लिए अक्सर पूछे जाने वाले प्रश्न"
      />
      <Input
        placeholder="Search questions… | प्रश्न खोजें"
        value={query}
        onChangeText={setQuery}
      />

      {!normalized ? (
        <View style={styles.topics}>
          {FAQ_GROUPS.map((group) => {
            const active = topic === group.id;
            return (
              <Pressable
                key={group.id}
                onPress={() => setTopic(group.id)}
                style={[styles.topicChip, active && styles.topicChipOn]}
              >
                <Text style={[styles.topicText, active && styles.topicTextOn]}>{group.titleEn}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {visible.length === 0 ? (
        <Card>
          <Text style={styles.qEn}>No matching questions</Text>
          <Text style={styles.muted}>Try a different keyword, or send us an enquiry.</Text>
          <Button title="Contact support" variant="outline" onPress={() => navigation.navigate('Contact')} />
        </Card>
      ) : (
        visible.map((group) => (
          <View key={group.id}>
            <SectionTitle title={group.titleEn} subtitle={group.titleHi} />
            <Card elevated={false} style={styles.groupCard}>
              {group.items.map((item) => (
                <FaqItemCard key={item.n} item={item} />
              ))}
            </Card>
          </View>
        ))
      )}

      <SectionTitle title="Official Government Resources" subtitle="आधिकारिक सरकारी सहायता" />
      <Card>
        <Text style={styles.body}>
          SafeWork Global is not a Government of India agency. Verify recruitment information through official channels.
        </Text>
        <Button title="Visit eMigrate" variant="outline" onPress={() => Linking.openURL(EMIGRATE_PORTAL_URL)} />
        <View style={{ height: spacing.sm }} />
        <Button title="Government help on Contact" variant="outline" onPress={() => navigation.navigate('Contact')} />
      </Card>

      <Card>
        <Text style={styles.qEn}>Need help? | सहायता चाहिए?</Text>
        <Text style={styles.muted}>{SAFEWORK_CONTACT.email}</Text>
        <View style={{ height: spacing.md }} />
        <Button title="Send enquiry" onPress={() => navigation.navigate('Contact')} fullWidth />
        <View style={{ height: spacing.sm }} />
        <Button
          title="Email support"
          variant="outline"
          onPress={() => Linking.openURL(getSafeworkMailtoUrl('SafeWork Global – FAQ'))}
          fullWidth
        />
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  topicChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  topicChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  topicText: { ...typography.bodySm, fontWeight: '600' },
  topicTextOn: { color: colors.primaryForeground },
  groupCard: { padding: 0, overflow: 'hidden' },
  item: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  numBadge: {
    height: 24,
    minWidth: 24,
    borderRadius: 6,
    backgroundColor: colors.primaryTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  itemCopy: { flex: 1, minWidth: 0 },
  qEn: { ...typography.body, fontWeight: '700' },
  qHi: { ...typography.caption, marginTop: 2 },
  chevron: { ...typography.h3, color: colors.mutedForeground, paddingHorizontal: 4 },
  answer: { marginTop: spacing.md, paddingLeft: 32, gap: spacing.sm },
  aEn: { ...typography.body },
  aHi: { ...typography.bodySm, backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.md },
  bullets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bulletChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.muted,
  },
  bulletText: { ...typography.caption, color: colors.foreground, fontWeight: '600' },
  raBox: {
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  raKicker: { ...typography.caption, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  raName: { ...typography.h3, marginTop: 4 },
  muted: { ...typography.bodySm, marginTop: 4 },
  body: { ...typography.body, marginBottom: spacing.md },
});
