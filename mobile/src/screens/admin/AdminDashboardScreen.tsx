import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import HeroBanner from '../../components/HeroBanner';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Card, LoadingView, SectionTitle, StatCard } from '../../components/ui';

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0, partners: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('job_applications').select('id', { count: 'exact', head: true }),
      (supabase as any).from('partner_profiles').select('id', { count: 'exact', head: true }),
    ]).then(([users, jobs, apps, partners]: any[]) => {
      setStats({
        users: users.count ?? 0,
        jobs: jobs.count ?? 0,
        applications: apps.count ?? 0,
        partners: partners.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingView />;

  return (
    <ScreenLayout variant="stack" scrollable>
      <HeroBanner
        compact
        title="Admin Dashboard"
        subtitle="Platform overview and operations"
      />

      <SectionTitle title="Platform Overview" />
      <View style={styles.statsGrid}>
        <StatCard value={stats.users} label="Users" accent={colors.primary} />
        <StatCard value={stats.jobs} label="Jobs" accent={colors.employer} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard value={stats.applications} label="Applications" accent={colors.success} />
        <StatCard value={stats.partners} label="Partners" accent={colors.partner} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});
