import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { formatIndianMobile } from '../../lib/workerAuthEmail';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Button, Card, Input, LoadingView, SectionTitle } from '../../components/ui';
import { passwordSignupIssue, sanitizePasswordInput, PASSWORD_HINT } from '../../lib/password';

type WorkerProfile = {
  bio: string | null;
  primary_skill: string | null;
  current_city: string | null;
  current_location: string | null;
  years_of_experience: number | null;
  kyc_status: string | null;
  review_status: string | null;
  availability: string | null;
};

export default function WorkerProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [wp, setWp] = useState<WorkerProfile | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [skill, setSkill] = useState('');
  const [years, setYears] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('worker_profiles')
        .select(
          'bio, primary_skill, current_city, current_location, years_of_experience, kyc_status, review_status, availability',
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      setWp(data);
      setFullName(profile?.full_name ?? '');
      setBio(data?.bio ?? '');
      setCity(data?.current_city ?? '');
      setSkill(data?.primary_skill ?? '');
      setYears(data?.years_of_experience != null ? String(data.years_of_experience) : '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, profile?.full_name]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      const { error: wpErr } = await supabase.from('worker_profiles').upsert(
        {
          user_id: user.id,
          bio: bio.trim() || null,
          current_city: city.trim() || null,
          current_location: city.trim() || null,
          primary_skill: skill.trim() || null,
          years_of_experience: years.trim() ? Number(years) : null,
        },
        { onConflict: 'user_id' },
      );
      if (wpErr) throw wpErr;
      await refreshProfile();
      await load();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView message="Loading profile..." />;

  return (
    <ScreenLayout variant="stack">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <SectionTitle title="My profile" subtitle="Visible to verified employers" />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card>
          <View style={styles.badges}>
            {wp?.kyc_status ? <Badge label={`KYC: ${wp.kyc_status}`} tone="info" /> : null}
            {wp?.review_status ? <Badge label={wp.review_status} tone="secondary" /> : null}
          </View>
          <Text style={styles.meta}>{formatIndianMobile(profile?.phone) ?? 'No phone'}</Text>
          <Input label="Full name" value={fullName} onChangeText={setFullName} />
          <Input label="Primary skill" value={skill} onChangeText={setSkill} />
          <Input label="City" value={city} onChangeText={setCity} />
          <Input
            label="Years of experience"
            value={years}
            onChangeText={setYears}
            keyboardType="number-pad"
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />
          <Button title="Save profile" onPress={save} loading={saving} fullWidth />
        </Card>

        <SectionTitle title="Change password" subtitle="Use a password only you know" />
        <Card>
          <Input
            label="New password"
            value={newPassword}
            onChangeText={(v) => setNewPassword(sanitizePasswordInput(v))}
            secureTextEntry
            placeholder={PASSWORD_HINT}
          />
          <Input
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={(v) => setConfirmPassword(sanitizePasswordInput(v))}
            secureTextEntry
            placeholder="Re-enter new password"
          />
          <Button
            title="Update password"
            onPress={async () => {
              if (!newPassword.trim() || !confirmPassword.trim()) {
                Alert.alert('Password required', 'Enter and confirm your new password.');
                return;
              }
              const passwordIssue = passwordSignupIssue(newPassword);
              if (passwordIssue) {
                Alert.alert('Password', passwordIssue);
                return;
              }
              if (newPassword !== confirmPassword) {
                Alert.alert('Passwords do not match', 'Re-enter the same password in both fields.');
                return;
              }
              setSavingPassword(true);
              try {
                const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
                if (pwErr) throw pwErr;
                setNewPassword('');
                setConfirmPassword('');
                Alert.alert('Password updated', 'Sign in with this password next time.');
              } catch (e) {
                Alert.alert(
                  'Update failed',
                  e instanceof Error ? e.message : 'Could not update password',
                );
              } finally {
                setSavingPassword(false);
              }
            }}
            loading={savingPassword}
            fullWidth
          />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  error: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  meta: { ...typography.bodySm, color: colors.mutedForeground, marginBottom: spacing.md },
});
