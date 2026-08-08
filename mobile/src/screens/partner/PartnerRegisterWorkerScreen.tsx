import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { sendWorkerOtp, verifyWorkerOtp } from '../../lib/otpApi';
import { normalizeIndianMobileDigits } from '../../lib/workerAuthEmail';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

const SKILLS = ['Electrician', 'Welder', 'Plumber', 'Mason', 'Carpenter', 'Driver', 'Helper', 'Other'];

export default function PartnerRegisterWorkerScreen() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [skill, setSkill] = useState(SKILLS[0]);
  const [city, setCity] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const digits = normalizeIndianMobileDigits(phone);
    if (digits.length !== 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const result = await sendWorkerOtp(digits);
    setLoading(false);
    if (!result.success) {
      Alert.alert('OTP failed', result.error ?? 'Could not send OTP');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP sent', result.demo ? 'Demo mode OTP flow.' : 'Ask the worker for the SMS code.');
  };

  const handleSubmit = async () => {
    if (!profile?.id || !fullName || !phone) {
      Alert.alert('Missing fields', 'Name and phone are required.');
      return;
    }
    const digits = normalizeIndianMobileDigits(phone);
    if (!otpSent) {
      Alert.alert('Verify phone', 'Send and verify OTP before registering the worker.');
      return;
    }
    setLoading(true);
    const verified = await verifyWorkerOtp(digits, otp);
    if (!verified.success) {
      setLoading(false);
      Alert.alert('OTP invalid', verified.error ?? 'Check the OTP and try again.');
      return;
    }

    const { error } = await (supabase as any).from('partner_workers').insert({
      partner_id: profile.id,
      full_name: fullName.trim(),
      phone: digits,
      email: email.trim() || null,
      primary_skill: skill,
      city: city.trim() || null,
      status: 'REGISTERED',
      source: 'mobile_app',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error.message);
      return;
    }

    Alert.alert('Worker registered', 'The worker has been added to your center.');
    setFullName('');
    setPhone('');
    setEmail('');
    setCity('');
    setOtp('');
    setOtpSent(false);
  };

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle title="Register Worker" subtitle="E-Mitra assisted onboarding" />
      <Card>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Worker's full name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit mobile" />
        <Input label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="City" value={city} onChangeText={setCity} />
        <Text style={styles.label}>Primary skill</Text>
        <View style={styles.chips}>
          {SKILLS.map((s) => (
            <Pressable key={s} onPress={() => setSkill(s)} style={[styles.chip, skill === s && styles.chipOn]}>
              <Text style={[styles.chipText, skill === s && styles.chipTextOn]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Button title={otpSent ? 'Resend OTP' : 'Send worker OTP'} variant="outline" onPress={handleSendOtp} loading={loading} />
        {otpSent ? (
          <Input label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="Enter OTP" />
        ) : null}
        <Button title="Register Worker" onPress={handleSubmit} loading={loading} size="lg" />
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodySm, fontWeight: '600', marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipOn: { backgroundColor: colors.partnerLight, borderColor: colors.partner },
  chipText: { ...typography.bodySm },
  chipTextOn: { color: colors.partner, fontWeight: '700' },
});
