import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { formatSalaryLakh, formatRelativeDate } from '../../lib/utils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import HeroBanner from '../../components/HeroBanner';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Card, LoadingView, SectionTitle, StatCard } from '../../components/ui';

export default function WorkerDashboardScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Record<string, unknown>[]>([]);
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);

  const fetchData = async () => {
    if (!profile?.id) return;
    try {
      const [appsRes, notifRes, jobsRes, docsRes] = await Promise.all([
        supabase
          .from('job_applications')
          .select('*, jobs:job_id (title, location, country)')
          .eq('worker_id', profile.id)
          .order('applied_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('jobs')
          .select('id, title, location, country, salary_min, salary_max, currency')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('worker_documents').select('*').eq('worker_id', profile.id),
      ]);

      setApplications(appsRes.data ?? []);
      setNotifications(notifRes.data ?? []);
      setRecommendedJobs(jobsRes.data ?? []);
      setDocuments(docsRes.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  if (loading) return <LoadingView message="Loading dashboard..." />;

  const verifiedDocs = documents.filter((d) => d.status === 'VERIFIED').length;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Worker';

  return (
    <ScreenLayout variant="stack" scrollable>
      <HeroBanner
        compact
        title={`Hi, ${firstName}`}
        subtitle="Track your applications, documents, and job journey"
      />

      <View style={styles.statsRow}>
        <StatCard value={applications.length} label="Applications" accent={colors.worker} />
        <StatCard value={verifiedDocs} label="Verified Docs" accent={colors.primary} />
        <StatCard value={notifications.length} label="Alerts" accent={colors.secondary} />
      </View>

      <SectionTitle title="Recent Applications" subtitle="Your latest job applications" />
      {applications.length === 0 ? (
        <Card elevated={false}>
          <Text style={styles.muted}>No applications yet. Browse jobs to get started.</Text>
        </Card>
      ) : (
        applications.map((app) => {
          const job = app.jobs as Record<string, unknown> | null;
          return (
            <Card key={String(app.id)}>
              <Text style={styles.rowTitle}>{String(job?.title ?? 'Position')}</Text>
              <Text style={styles.muted}>
                {String(job?.location ?? '')}, {String(job?.country ?? '')}
              </Text>
              <Badge label={String(app.status ?? 'PENDING')} tone="primary" />
            </Card>
          );
        })
      )}

      <SectionTitle title="Recommended Jobs" subtitle="Hand-picked for you" />
      {recommendedJobs.map((job) => (
        <Card key={String(job.id)}>
          <Text style={styles.rowTitle}>{String(job.title)}</Text>
          <Text style={styles.muted}>
            {String(job.location)}, {String(job.country)}
          </Text>
          <Text style={styles.salary}>
            {formatSalaryLakh(
              job.salary_min as number | null,
              job.salary_max as number | null,
              String(job.currency ?? 'USD'),
            )}
          </Text>
        </Card>
      ))}

      <SectionTitle title="Notifications" />
      {notifications.length === 0 ? (
        <Card elevated={false}>
          <Text style={styles.muted}>No new notifications</Text>
        </Card>
      ) : (
        notifications.map((n) => (
          <Card key={String(n.id)} elevated={false}>
            <Text style={styles.rowTitle}>{String(n.title)}</Text>
            <Text style={styles.muted}>{formatRelativeDate(String(n.created_at))}</Text>
          </Card>
        ))
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rowTitle: { ...typography.h3 },
  muted: { ...typography.bodySm, marginTop: spacing.xs },
  salary: { fontSize: 16, fontWeight: '800', color: colors.worker, marginTop: spacing.sm },
});
