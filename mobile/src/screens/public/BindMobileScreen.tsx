import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { sendWorkerOtp, verifyWorkerOtp } from '../../lib/otpApi';
import { normalizeIndianMobileDigits } from '../../lib/workerAuthEmail';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

export default function BindMobileScreen() {
  const { profile, user, markMobileVerified, refreshProfile, logout } = useAuth();
  const [phone, setPhone] = useState(profile?.phone?.replace(/\D/g, '').slice(-10) ?? '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSend = async () => {
    setError('');
    setInfo('');
    const digits = normalizeIndianMobileDigits(phone);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    const result = await sendWorkerOtp(digits);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Failed to send OTP');
      return;
    }
    setInfo(result.demo ? 'Demo mode: use OTP from backend logs / configured test flow.' : 'OTP sent via SMS.');
    setStep('otp');
  };

  const handleVerify = async () => {
    setError('');
    const digits = normalizeIndianMobileDigits(phone);
    if (otp.trim().length < 4) {
      setError('Enter the OTP you received.');
      return;
    }
    setLoading(true);
    const result = await verifyWorkerOtp(digits, otp);
    if (!result.success) {
      setLoading(false);
      setError(result.error ?? 'Invalid OTP');
      return;
    }

    const uid = user?.id || profile?.id;
    if (uid) {
      await supabase
        .from('profiles')
        .update({ phone: digits, mobile_verified: true })
        .eq('id', uid);
      await supabase.auth.updateUser({
        data: { phone: digits, mobile_verified: true },
      });
      markMobileVerified(digits, uid);
      await refreshProfile();
    }
    setLoading(false);
  };

  return (
    <ScreenLayout variant="full" scrollable keyboard header={{ title: 'Verify mobile' }}>
      <SectionTitle
        title="Bind your mobile"
        subtitle="Verify a phone number before using the app. In local dev you can use 123456 or any 6-digit OTP."
      />
      <Card>
        {step === 'phone' ? (
          <>
            <Input
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="10-digit mobile"
              accessibilityLabel="Mobile number"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Send OTP" onPress={handleSend} loading={loading} fullWidth />
          </>
        ) : (
          <>
            <Text style={styles.hint}>OTP sent to +91 {normalizeIndianMobileDigits(phone)}</Text>
            <Input
              label="OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="Enter OTP"
              accessibilityLabel="One time password"
            />
            {info ? <Text style={styles.info}>{info}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.row}>
              <Button title="Change number" variant="ghost" onPress={() => setStep('phone')} />
              <Button title="Verify" onPress={handleVerify} loading={loading} />
            </View>
          </>
        )}
      </Card>
      <Button title="Sign out" variant="outline" onPress={() => logout()} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.md },
  info: { ...typography.bodySm, color: colors.success, marginBottom: spacing.md },
  hint: { ...typography.bodySm, color: colors.mutedForeground, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
});
