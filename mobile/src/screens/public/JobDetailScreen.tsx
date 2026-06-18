import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, Shield } from 'lucide-react-native';
import ScreenLayout from '../../components/layout/ScreenLayout';
import type { PublicStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { formatSalaryINR, formatSalaryLakh } from '../../lib/utils';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { Badge, Button, Card, LoadingView, SectionTitle } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ route }: Props) {
  const { jobId } = route.params;
  const { isAuthenticated, profile } = useAuth();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
      .then(({ data }) => {
        setJob(data);
        setLoading(false);
      });
  }, [jobId]);

  const handleApply = async () => {
    if (!isAuthenticated || !profile?.id) {
      Alert.alert('Login required', 'Please sign in as a worker to apply for this job.');
      return;
    }

    setApplying(true);
    const { data: jobData } = await supabase.from('jobs').select('employer_id').eq('id', jobId).single();
    const { error } = await supabase.from('job_applications').insert({
      job_id: jobId,
      worker_id: profile.id,
      employer_id: jobData?.employer_id ?? profile.id,
      status: 'PENDING',
    });
    setApplying(false);

    if (error) {
      Alert.alert('Application failed', error.message);
      return;
    }
    Alert.alert('Application submitted', 'Your application has been sent to the employer.');
  };

  if (loading) return <LoadingView />;
  if (!job) {
    return (
      <ScreenLayout variant="stack" scrollable>
        <Text style={styles.error}>Job not found</Text>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout variant="stack" scrollable>
      <View style={[styles.hero, shadows.sm]}>
        <View style={styles.blobPrimary} />
        <View style={styles.blobInfo} />
        <View style={styles.heroInner}>
          <Text style={styles.title}>{String(job.title)}</Text>
          <View style={styles.metaRow}>
            <MapPin size={16} color={colors.mutedForeground} />
            <Text style={styles.location}>{String(job.location)}, {String(job.country)}</Text>
          </View>
          <Text style={styles.salary}>
            {formatSalaryLakh(
              job.salary_min as number | null,
              job.salary_max as number | null,
              String(job.currency ?? 'USD'),
            )}
          </Text>
          <Text style={styles.salaryDetail}>
            {formatSalaryINR(
              job.salary_min as number | null,
              job.salary_max as number | null,
              String(job.currency ?? 'INR'),
            )}
          </Text>
        </View>
      </View>

      <View style={styles.badges}>
        {job.experience_level ? <Badge label={String(job.experience_level)} tone="primary" /> : null}
        {job.job_type ? <Badge label={String(job.job_type)} tone="success" /> : null}
        {job.visa_sponsorship ? <Badge label="Visa Sponsorship" tone="info" /> : null}
      </View>

      <Card elevated={false} style={styles.protection}>
        <Shield size={20} color={colors.primary} />
        <Text style={styles.protectionText}>Salary protected · Verified employer</Text>
      </Card>

      <SectionTitle title="Job Description" />
      <Card>
        <Text style={styles.description}>{String(job.description ?? 'No description provided.')}</Text>
      </Card>

      <Button title="Apply Now" onPress={handleApply} loading={applying} size="lg" />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  heroInner: { padding: spacing.xl, zIndex: 1 },
  blobPrimary: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryTintMedium,
  },
  blobInfo: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.infoTint,
  },
  title: { ...typography.h1, color: colors.foreground, fontSize: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  location: { fontSize: 15, color: colors.mutedForeground },
  salary: { fontSize: 26, fontWeight: '700', color: colors.foreground, marginTop: spacing.lg },
  salaryDetail: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  protection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.muted,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  protectionText: { ...typography.bodySm, color: colors.mutedForeground, fontWeight: '600' },
  description: { ...typography.body },
  error: { ...typography.body, color: colors.destructive },
});
