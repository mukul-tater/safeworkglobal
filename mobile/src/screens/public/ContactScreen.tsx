import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EMIGRATE_PORTAL_URL,
  MADAD_PORTAL_URL,
  MEA_PBSK,
  RA_DISCLOSURE,
  RECRUITMENT_PARTNER,
  SAFEWORK_CONTACT,
  getSafeworkMailtoUrl,
} from '../../config/workerSupport';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';
import { useI18n } from '../../i18n';

const ENQUIRY_ROLES = [
  { value: 'worker', label: 'Worker' },
  { value: 'employer', label: 'Employer' },
  { value: 'emitra', label: 'E-Mitra Partner' },
  { value: 'iti', label: 'ITI / Training Institute' },
  { value: 'ttc', label: 'Trade Test Centre' },
  { value: 'other', label: 'Other' },
] as const;

type EnquiryRole = (typeof ENQUIRY_ROLES)[number]['value'];

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open link', url);
  }
}

export default function ContactScreen() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EnquiryRole | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!role) {
      Alert.alert('Missing details', 'Please select who you are.');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert('Invalid mobile', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Name, email, subject, and message are required.');
      return;
    }

    const roleLabel = ENQUIRY_ROLES.find((r) => r.value === role)?.label ?? role;
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('contact_submissions').insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: [`I am: ${roleLabel}`, `Mobile: ${mobile.trim()}`, '', message.trim()].join('\n'),
      });
      if (insertError) throw insertError;

      await supabase.functions.invoke('contact-enquiry', {
        body: {
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          role: roleLabel,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      setSubmitted(true);
      setName('');
      setMobile('');
      setEmail('');
      setRole('');
      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert(
        'Could not send enquiry',
        error instanceof Error ? error.message : 'Please email us directly.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
      />

      <Card>
        <Text style={styles.label}>SafeWork Global</Text>
        <Pressable onPress={() => openUrl(getSafeworkMailtoUrl())}>
          <Text style={styles.link}>{SAFEWORK_CONTACT.email}</Text>
        </Pressable>
        <Text style={styles.muted}>{SAFEWORK_CONTACT.officeAddress}</Text>
        <Text style={[styles.muted, styles.topGap]}>
          {SAFEWORK_CONTACT.operatingCompany} · {SAFEWORK_CONTACT.founderName}, {SAFEWORK_CONTACT.founderTitle}
        </Text>
      </Card>

      <SectionTitle title="Government channels" subtitle="Official overseas-employment help, not SafeWork." />
      <Card elevated={false}>
        <Text style={styles.label}>{MEA_PBSK.name}</Text>
        <Pressable onPress={() => openUrl(MEA_PBSK.phoneTel)}>
          <Text style={styles.link}>{MEA_PBSK.phoneDisplay}</Text>
        </Pressable>
        <Pressable onPress={() => openUrl(MEA_PBSK.whatsappUrl)}>
          <Text style={styles.link}>WhatsApp {MEA_PBSK.whatsappDisplay}</Text>
        </Pressable>
        <Pressable onPress={() => openUrl(`mailto:${MEA_PBSK.email}`)}>
          <Text style={styles.link}>{MEA_PBSK.email}</Text>
        </Pressable>
        <View style={styles.topGap}>
          <Button title="Open MADAD portal" variant="outline" onPress={() => openUrl(MADAD_PORTAL_URL)} />
        </View>
        <View style={styles.topGap}>
          <Button title="Open eMigrate" variant="outline" onPress={() => openUrl(EMIGRATE_PORTAL_URL)} />
        </View>
      </Card>

      <SectionTitle title="Licensed recruitment partner" />
      <Card>
        <Text style={styles.label}>{RECRUITMENT_PARTNER.name}</Text>
        <Text style={styles.muted}>{RECRUITMENT_PARTNER.designation}</Text>
        <Text style={styles.muted}>RC No. {RECRUITMENT_PARTNER.rcNo}</Text>
        <Text style={[styles.body, styles.topGap]}>{RA_DISCLOSURE}</Text>
      </Card>

      {submitted ? (
        <Card>
          <Text style={styles.label}>{t('contact.received')}</Text>
          <Text style={styles.body}>
            {t('contact.thanks')}
          </Text>
          <Button title={t('contact.another')} variant="outline" onPress={() => setSubmitted(false)} />
        </Card>
      ) : (
        <Card>
          <SectionTitle title={t('contact.enquiry')} />
          <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your name" />
          <Input
            label="Mobile"
            value={mobile}
            onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="10-digit mobile"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@email.com"
          />
          <Text style={styles.chipLabel}>I am</Text>
          <View style={styles.chips}>
            {ENQUIRY_ROLES.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRole(item.value)}
                style={[styles.chip, role === item.value && styles.chipOn]}
              >
                <Text style={[styles.chipText, role === item.value && styles.chipTextOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="How can we help?" />
          <Input
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us briefly what you need"
            multiline
          />
          <Button title={t('contact.send')} onPress={handleSubmit} loading={loading} fullWidth />
        </Card>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.h3 },
  body: { ...typography.body, marginBottom: spacing.md },
  muted: { ...typography.bodySm, marginTop: 4 },
  link: { ...typography.body, color: colors.primary, fontWeight: '600', marginTop: 6 },
  topGap: { marginTop: spacing.md },
  chipLabel: { ...typography.bodySm, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  chipText: { ...typography.bodySm, color: colors.foreground },
  chipTextOn: { color: colors.primary, fontWeight: '700' },
});
