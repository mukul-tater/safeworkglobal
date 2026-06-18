import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import HeroBanner from '../../components/HeroBanner';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Card, LoadingView, SectionTitle, StatCard } from '../../components/ui';

export default function PartnerDashboardScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workerCount, setWorkerCount] = useState(0);
  const [pendingCompliance, setPendingCompliance] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      (supabase as any).from('partner_workers').select('id', { count: 'exact', head: true }).eq('partner_id', profile.id),
      (supabase as any).from('partner_compliance').select('id', { count: 'exact', head: true }).eq('partner_id', profile.id).eq('status', 'PENDING'),
    ]).then(([workers, compliance]: any[]) => {
      setWorkerCount(workers.count ?? 0);
      setPendingCompliance(compliance.count ?? 0);
      setLoading(false);
    });
  }, [profile?.id]);

  if (loading) return <LoadingView />;

  return (
    <ScreenLayout variant="stack" scrollable>
      <HeroBanner
        compact
        title="E-Mitra Dashboard"
        subtitle={profile?.full_name ?? profile?.email ?? 'Manage your service center'}
      />

      <View style={styles.statsRow}>
        <StatCard value={workerCount} label="Registered Workers" accent={colors.partner} />
        <StatCard value={pendingCompliance} label="Pending Compliance" accent={colors.warning} />
      </View>

      <SectionTitle title="Quick Actions" subtitle="Common tasks for your center" />
      <Card elevated={false}>
        <Text style={styles.muted}>Register new workers and track compliance from the menu.</Text>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  muted: { ...typography.bodySm },
});
