import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import HeroBanner from '../../components/HeroBanner';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Card, LoadingView, SectionTitle, StatCard } from '../../components/ui';

export default function EmployerDashboardScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [shortlist, setShortlist] = useState<Record<string, unknown>[]>([]);

  const fetchData = async () => {
    if (!profile?.id) return;
    try {
      const [jobsRes, appsRes, shortlistRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('employer_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('job_applications').select('*, jobs:job_id (title)').eq('employer_id', profile.id).order('applied_at', { ascending: false }).limit(5),
        (supabase as any).from('shortlisted_workers').select('*').eq('employer_id', profile.id).limit(5),
      ]);
      setJobs(jobsRes.data ?? []);
      setApplications(appsRes.data ?? []);
      setShortlist(shortlistRes.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  if (loading) return <LoadingView message="Loading dashboard..." />;

  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE').length;

  return (
    <ScreenLayout variant="stack" scrollable>
      <HeroBanner
        compact
        title="Employer Dashboard"
        subtitle={profile?.full_name ?? profile?.email ?? 'Manage your hiring pipeline'}
      />

      <View style={styles.statsRow}>
        <StatCard value={jobs.length} label="Total Jobs" accent={colors.employer} />
        <StatCard value={activeJobs} label="Active" accent={colors.success} />
        <StatCard value={applications.length} label="Applications" accent={colors.secondary} />
      </View>

      <SectionTitle title="Recent Jobs" />
      {jobs.map((job) => (
        <Card key={String(job.id)}>
          <Text style={styles.rowTitle}>{String(job.title)}</Text>
          <Text style={styles.muted}>{String(job.location)}, {String(job.country)}</Text>
          <Badge label={String(job.status ?? 'DRAFT')} tone="primary" />
        </Card>
      ))}

      <SectionTitle title="Recent Applications" />
      {applications.map((app) => {
        const job = app.jobs as Record<string, unknown> | null;
        return (
          <Card key={String(app.id)}>
            <Text style={styles.rowTitle}>{String(job?.title ?? 'Application')}</Text>
            <Badge label={String(app.status ?? 'PENDING')} tone="success" />
          </Card>
        );
      })}

      <SectionTitle title="Shortlisted Workers" />
      <Card elevated={false}>
        <Text style={styles.muted}>{shortlist.length} workers in your shortlist</Text>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rowTitle: { ...typography.h3 },
  muted: { ...typography.bodySm, marginTop: spacing.xs },
});
